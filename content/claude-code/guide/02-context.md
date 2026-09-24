---
title: Context
section: Guide Book
summary: The window is the agent's whole world — what fills it, what it costs, and the four ways to keep it from overflowing.
---
An agent has no memory between requests. Everything it knows arrives in one request, every turn. That request is the context window, and managing it is most of what separates an agent that works from one that degrades after ten turns.

## What is in a request

```text
┌─ tools            every tool definition, every turn
├─ system           instructions, CLAUDE.md, skill frontmatter
├─ messages         the whole conversation so far
│    ├─ user
│    ├─ assistant   including tool_use blocks
│    ├─ user        tool_result blocks — usually the biggest thing here
│    └─ …
└─ output_config    effort, format
```

Every one of those is re-sent on **every** turn. A conversation is not stored on the server; the growth is linear in turns and superlinear in cost if nothing is trimmed.

```typescript
// A rough model of how a transcript grows.
type Turn = { userTokens: number; assistantTokens: number; toolResultTokens: number }

const turns: Turn[] = Array.from({ length: 8 }, (_, i) => ({
  userTokens: 40,
  assistantTokens: 120,
  toolResultTokens: i < 6 ? 2500 : 400, // a few big file reads early on
}))

const systemTokens = 3000
const toolTokens = 1800

let transcript = 0
let cumulativeInput = 0

turns.forEach((turn, i) => {
  transcript += turn.userTokens + turn.assistantTokens + turn.toolResultTokens
  const requestInput = systemTokens + toolTokens + transcript
  cumulativeInput += requestInput
  console.log(
    `turn ${i + 1}: request ${requestInput.toString().padStart(6)} tokens,` +
      ` cumulative ${cumulativeInput.toString().padStart(6)}`,
  )
})
```

Notice the shape: one large tool result early on is paid for again on every subsequent turn.

> 🔍 **Behind the scenes: tool results dominate**
>
> In a real coding agent, the system prompt and the tool definitions are a fixed few thousand tokens, and the user's messages are small. What actually fills a window is **tool output** — file contents, command output, search results, API responses. That is why the highest-value context optimisation is almost never "shorten the system prompt"; it is "stop returning 800 lines when 30 would do".

## Four ways to stay inside the window

| Technique | What it does | Cost |
| --- | --- | --- |
| **Prompt caching** | reuse an identical prefix | none — it is a pure win |
| **Context editing** | *clear* old tool results | loses that detail |
| **Compaction** | *summarise* earlier turns | loses detail, keeps the gist |
| **Memory / files** | store outside the window, read back on demand | needs a tool and a discipline |

### Caching

Caching is a **prefix match**. Anything before the last cache breakpoint must be byte-identical, so the order is: stable content first, volatile content last.

```typescript
// The ordering rule, made concrete.
const stable = "You are a careful assistant. [3000 tokens of instructions]"
const volatile = `Current time: ${new Date().toISOString()}`

function buildSystem(order: "good" | "bad"): string[] {
  return order === "good" ? [stable, volatile] : [volatile, stable]
}

const good = buildSystem("good")
const bad = buildSystem("bad")

console.log("good: stable prefix is identical every request →", good[0] === stable)
console.log("bad:  the timestamp is FIRST, so nothing after it can ever cache →", bad[0] !== stable)
console.log("render order is always: tools → system → messages")
```

> ⚠️ A single `Date.now()`, UUID or unsorted JSON key anywhere in the prefix silently drops your hit rate to zero. Verify with `usage.cache_read_input_tokens` — if it is zero across repeated requests with the same prefix, something in the prefix is moving.

### Context editing and compaction

Both are server-side, and they are different operations. **Context editing** clears old tool results outright; **compaction** summarises earlier turns into a block that replaces them.

```typescript-snippet
// Context editing: clear old tool results.
await client.beta.messages.create({
  model: "claude-opus-5",
  max_tokens: 16000,
  betas: ["context-management-2025-06-27"],
  context_management: { edits: [{ type: "clear_tool_uses_20250919" }] },
  tools,
  messages,
})

// Compaction: summarise earlier context automatically.
const response = await client.beta.messages.create({
  model: "claude-opus-5",
  max_tokens: 16000,
  betas: ["compact-2026-01-12"],
  context_management: { edits: [{ type: "compact_20260112" }] },
  messages,
})

// Append the WHOLE content array — the compaction block must survive.
messages.push({ role: "assistant", content: response.content })
```

> ⚠️ With compaction, appending only the text of the response instead of the full `content` array silently discards the compaction block, and the next request re-sends the history it was meant to replace. Always push `response.content`.

### Memory: move it out of the window

```typescript
// A memory tool is just a tool over a store. The point is what it lets you NOT send.
type Memory = { write(key: string, value: string): string; read(key: string): string | null; list(): string[] }

function createMemory(): Memory {
  const store = new Map<string, string>()
  return {
    write(key, value) {
      store.set(key, value)
      return `stored ${key} (${value.length} chars)`
    },
    read(key) {
      return store.get(key) ?? null
    },
    list() {
      return [...store.keys()]
    },
  }
}

const memory = createMemory()

// A 4,000-token analysis goes to the store, and a 12-token note into the transcript.
const analysis = "…".repeat(4000)
console.log(memory.write("analysis/auth-module", analysis))
console.log("in the transcript:", "Analysis saved to analysis/auth-module")
console.log("keys available later:", memory.list())
console.log("read back on demand:", memory.read("analysis/auth-module")?.length, "chars")
```

## Keep tool output small at the source

The cheapest context management is a tool that does not produce the bloat.

```typescript
const lines = Array.from({ length: 800 }, (_, i) => `line ${i + 1}: some source code here`)

// Returns everything, every time.
function readAll(): string {
  return lines.join("\n")
}

// Returns a window, with the information needed to ask for more.
function readWindow(offset: number, limit: number): string {
  const slice = lines.slice(offset, offset + limit)
  const shown = `${offset + 1}-${Math.min(offset + limit, lines.length)}`
  return [
    ...slice,
    `\n[showing lines ${shown} of ${lines.length}. Call again with offset=${offset + limit} for more.]`,
  ].join("\n")
}

console.log(`readAll:    ${readAll().length} chars`)
console.log(`readWindow: ${readWindow(0, 30).length} chars`)
console.log(readWindow(0, 3))
```

> 💡 **Tip:** Three habits cover most of it — paginate anything unbounded, return structured summaries rather than raw dumps, and say explicitly in the output how to get the rest. A tool that truncates *silently* is worse than one that returns everything, because the model cannot tell that it is missing something.

## Effort and the budget

`output_config.effort` trades thoroughness against tokens within one model. It is the first quality-affecting lever, after caching.

```typescript
const effort = ["low", "medium", "high", "xhigh", "max"] as const
type Effort = (typeof effort)[number]

const guidance: Record<Effort, string> = {
  low: "sub-agents, simple or high-volume tasks, latency-sensitive routes",
  medium: "the cost-saving step down where quality holds",
  high: "the default — the usual sweet spot",
  xhigh: "coding and long-horizon agentic work",
  max: "correctness matters more than cost; use when measurement shows headroom",
}

for (const level of effort) {
  console.log(`${level.padEnd(7)} ${guidance[level]}`)
}
```

A **task budget** is the other half: a token ceiling the model is *aware of*, so it paces itself and finishes cleanly rather than being cut off by `max_tokens`.

```typescript-snippet
const stream = client.beta.messages.stream({
  model: "claude-opus-5",
  max_tokens: 128000,
  betas: ["task-budgets-2026-03-13"],
  output_config: {
    effort: "high",
    task_budget: { type: "tokens", total: 64000 },
  },
  tools,
  messages,
})

const response = await stream.finalMessage()
```

## A checklist

```typescript
const checklist = [
  ["cache the stable prefix", "tools and system first, volatile content last"],
  ["verify the hit rate", "usage.cache_read_input_tokens should be non-zero"],
  ["paginate tool output", "never return an unbounded dump"],
  ["summarise, do not dump", "structure beats raw text for the same information"],
  ["move bulk out of the window", "memory, files, a store — read back on demand"],
  ["compact long conversations", "and append the whole content array"],
  ["bound the loop", "max iterations and a task budget"],
] as const

for (const [rule, why] of checklist) {
  console.log(`• ${rule.padEnd(30)} ${why}`)
}
```

**Reference:** [Context windows](https://docs.claude.com/en/docs/build-with-claude/context-windows) and [Prompt caching](https://docs.claude.com/en/docs/build-with-claude/prompt-caching).
