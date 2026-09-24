---
title: What an agent actually is
section: Guide Book
summary: A model, a tool list and a loop — the whole idea, and the three stop reasons that drive it.
---
There is no agent API. An agent is a pattern: call the model with a list of tools, run whatever it asks for, send the results back, repeat until it stops asking.

```text
                ┌────────────────────────────┐
                │  messages + tools          │
                └──────────┬─────────────────┘
                           ▼
                  POST /v1/messages
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
   stop_reason: "tool_use"      stop_reason: "end_turn"
             │                           │
    run the tools, append                └──► done
    tool_result blocks ──┐
             ▲───────────┘
```

## The loop, in full

1. Send the conversation and the `tools` list.
2. If `stop_reason` is `"tool_use"`, append the assistant's **whole** reply to the history.
3. Run every `tool_use` block in it. Return all results together in **one** user message, each `tool_result` carrying the matching `tool_use_id`.
4. Go back to step 1.
5. When `stop_reason` is `"end_turn"`, read the text and stop.

Against the real API that is this:

```typescript-snippet
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()
const messages: Anthropic.MessageParam[] = [
  { role: "user", content: "What is the weather in Paris?" },
]

let response = await client.messages.create({
  model: "claude-opus-5",
  max_tokens: 16000,
  tools,
  messages,
})

while (response.stop_reason === "tool_use") {
  messages.push({ role: "assistant", content: response.content })

  const results: Anthropic.ToolResultBlockParam[] = []
  for (const block of response.content) {
    if (block.type !== "tool_use") continue
    results.push({
      type: "tool_result",
      tool_use_id: block.id,
      content: JSON.stringify(await runTool(block.name, block.input)),
    })
  }

  messages.push({ role: "user", content: results })
  response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 16000,
    tools,
    messages,
  })
}
```

## A loop you can run

The examples here use a **scripted model** — a function returning canned responses shaped exactly like the Messages API's. The loop around it is the real thing.

```typescript
type Block =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }

type Response = { content: Block[]; stop_reason: "tool_use" | "end_turn" }

// A scripted model: turn 0 asks for a tool, turn 1 answers.
const script: Response[] = [
  {
    stop_reason: "tool_use",
    content: [
      { type: "text", text: "Let me look that up." },
      { type: "tool_use", id: "t1", name: "get_weather", input: { city: "Paris" } },
    ],
  },
  {
    stop_reason: "end_turn",
    content: [{ type: "text", text: "It is 18°C and clear in Paris." }],
  },
]

let turn = 0
const model = (): Response => script[turn++]!

const tools: Record<string, (input: Record<string, unknown>) => string> = {
  get_weather: (input) => `18°C, clear in ${input.city}`,
}

// The loop.
let response = model()
let iterations = 0

while (response.stop_reason === "tool_use" && iterations++ < 10) {
  for (const block of response.content) {
    if (block.type === "tool_use") {
      console.log(`→ calling ${block.name}(${JSON.stringify(block.input)})`)
      console.log(`← ${tools[block.name]!(block.input)}`)
    }
  }
  response = model()
}

for (const block of response.content) {
  if (block.type === "text") console.log(`final: ${block.text}`)
}
console.log(`loop ran ${iterations} times`)
```

> ⚠️ Always bound the loop. A model that keeps calling tools — because a tool keeps failing, or because the task is genuinely unbounded — will run until your budget or your patience ends. A maximum iteration count, a token budget, or both, belongs in every agent loop you write.

## Parallel tool calls

One assistant reply may contain several `tool_use` blocks. Run them concurrently and return every result in a **single** user message.

```typescript
type Block = { type: "tool_use"; id: string; name: string; input: { path: string } }

const calls: Block[] = [
  { type: "tool_use", id: "a", name: "read_file", input: { path: "a.ts" } },
  { type: "tool_use", id: "b", name: "read_file", input: { path: "b.ts" } },
  { type: "tool_use", id: "c", name: "read_file", input: { path: "c.ts" } },
]

async function readFile(path: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 10))
  return `contents of ${path}`
}

const started = Date.now()

// Concurrent — not a for-await loop.
const results = await Promise.all(
  calls.map(async (call) => ({
    type: "tool_result" as const,
    tool_use_id: call.id,
    content: await readFile(call.input.path),
  })),
)

console.log(`${results.length} results in one user message`)
for (const r of results) console.log(`  ${r.tool_use_id}: ${r.content}`)
console.log(`elapsed under 50ms: ${Date.now() - started < 50}`)
```

> 🔍 **Behind the scenes: splitting results teaches the model not to parallelise**
>
> If you return three `tool_result` blocks across three separate user messages, the transcript now shows a model that made one call at a time. The model reads its own history as an example of how this conversation works, and on the next turn it serialises its calls. The performance loss is real and the cause is invisible — which is why "all results in one message" is a rule rather than a preference.

## Failures are results, not exceptions

```typescript
type ToolResult = {
  type: "tool_result"
  tool_use_id: string
  content: string
  is_error?: boolean
}

function runTool(name: string, id: string): ToolResult {
  try {
    if (name === "read_file") throw new Error("ENOENT: no such file or directory")
    return { type: "tool_result", tool_use_id: id, content: "ok" }
  } catch (e) {
    // Hand the error BACK to the model — it can often recover.
    return {
      type: "tool_result",
      tool_use_id: id,
      content: `Error: ${(e as Error).message}`,
      is_error: true,
    }
  }
}

console.log(JSON.stringify(runTool("read_file", "t1"), null, 2))
console.log(JSON.stringify(runTool("list_dir", "t2"), null, 2))
```

A tool that throws should not crash the loop. Return `is_error: true` with a message the model can act on — "no such file" lets it try a different path; a thrown exception ends the conversation.

## Every stop reason

| `stop_reason` | Means | Do |
| --- | --- | --- |
| `end_turn` | finished naturally | read the text |
| `tool_use` | wants a tool | run it, loop |
| `max_tokens` | hit your output cap | raise `max_tokens`, or stream |
| `stop_sequence` | hit a stop sequence you set | handle it |
| `pause_turn` | a long server-tool turn paused | send the response back to continue |
| `refusal` | declined on safety grounds | check `stop_details.category` |

```typescript
type Stop = "end_turn" | "tool_use" | "max_tokens" | "pause_turn" | "refusal"

function handle(stop: Stop): string {
  switch (stop) {
    case "tool_use":
      return "run the tools and loop"
    case "end_turn":
      return "done — read the final text"
    case "max_tokens":
      return "output was truncated; raise max_tokens or stream"
    case "pause_turn":
      return "send the response back to resume"
    case "refusal":
      return "declined; inspect stop_details before reading content"
  }
}

for (const stop of ["tool_use", "end_turn", "max_tokens", "pause_turn", "refusal"] as Stop[]) {
  console.log(`${stop.padEnd(14)} → ${handle(stop)}`)
}
```

> 💡 **Tip:** Check `stop_reason` **before** reading `content`. On a refusal the content is not the answer you asked for, and on `max_tokens` it is half an answer. Code that reads `content[0].text` unconditionally is the most common source of "it returned nonsense" reports.

## Who writes the loop

| Approach | You write | Who hosts |
| --- | --- | --- |
| Manual loop | the whole loop | you |
| SDK tool runner | just the tool functions | you |
| Claude Agent SDK | a prompt and options | you |
| Managed Agents | an agent config | Anthropic |

The manual loop is worth writing once, even if you never ship it: everything above is what the other three are doing on your behalf, and knowing the shape makes their behaviour predictable.

**Reference:** [Tool use with Claude](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview) in the Claude API documentation.
