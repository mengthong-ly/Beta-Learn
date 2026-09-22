---
title: Context & compaction
section: 1 · Claude Code Basics
---

The **context window** is everything the model can see when it writes its next reply: its working memory. In Claude Code it holds your conversation, the files Claude read, command output, CLAUDE.md, auto memory, loaded skills and the system instructions.

It fills up as you work. Every file read and every test run adds to it. Bigger isn't automatically better either: the API docs point out that accuracy and recall degrade as the token count grows, which they call *context rot*. What you keep in context matters as much as how much room there is.

```typescript
const session = [
  { what: "system prompt + tools", tokens: 12_000 },
  { what: "CLAUDE.md", tokens: 1_500 },
  { what: "read src/app.ts", tokens: 6_000 },
  { what: "npm test output", tokens: 9_000 },
  { what: "conversation", tokens: 4_000 },
]
const used = session.reduce((sum, s) => sum + s.tokens, 0)
for (const s of session) console.log(`${String(s.tokens).padStart(6)}  ${s.what}`)
console.log(`${String(used).padStart(6)}  total`)
```

Run `/context` in a session to see the real breakdown as a colored grid.

## `/compact`, `/clear` and auto-compaction

| Command | What it does | Use it when |
| --- | --- | --- |
| `/context` | Shows what fills the context window | You wonder where the space went |
| `/compact [instructions]` | Summarizes the conversation so far to free space. The same conversation continues | A long task isn't finished, but the history is bloated |
| `/clear` | Starts a new conversation with empty context. Project memory stays | You switch to unrelated work |
| `/autocompact [auto\|<tokens>]` | Sets how full the window gets before automatic compaction | You want compaction earlier or later |

You rarely need `/compact` by hand. As the conversation nears the limit, Claude Code manages context for you: it **clears older tool outputs first**, then **summarizes the conversation** if that's still not enough. Your requests and key code snippets are kept. Detailed instructions from early in the chat may be lost.

That's why persistent rules belong in CLAUDE.md: after compaction, the project-root CLAUDE.md is re-injected from disk, and Claude Code re-reads up to five of the files Claude recently worked on. To steer what the summary keeps, pass a focus or add a section to CLAUDE.md:

```bash
/compact Focus on code samples and API usage
```

```markdown
# Compact instructions

When you are using compact, please focus on test output and code changes
```

> 💡 **Tip:** `/compact` itself reads the whole conversation it summarizes, so compacting a big context is a big request. When you don't need continuity, `/clear` costs nothing. Use `/rename` first so you can `/resume` the old session later.

## The same idea in the Claude API

When you build your own agent on the Claude API, you manage context yourself. Everything in the request counts toward the window: the system prompt, every message (tool results included), your tool definitions, and the output the model writes. Current models such as Claude Opus 5 and Claude Sonnet 5 have a 1M-token window. The API offers three tools for the job:

| Approach | What it does |
| --- | --- |
| Compaction on demand | You send the older messages with `compaction: { type: "summarize" }` and get back a summary block to put first in `messages` |
| Compaction at a token threshold | The API compacts inside a normal request once input tokens reach the trigger you set |
| Context editing | Clears specific content by rule, for example old tool results (`clear_tool_uses_20250919`) |

Compaction can **keep recent turns** word for word. There's no parameter for this. You pick a cut point yourself: everything before it goes to the summary request, and everything after it is kept. A turn is one user message plus one assistant reply, so you cut with `history.slice(-2 * keepTurns)`. The official loop looks like this (beta, `compact-2026-09-04`):

```typescript-snippet
const older = history.slice(0, -2 * keepTurns)
const recent = history.slice(-2 * keepTurns)
const summary = await client.beta.messages.create({
  model: "claude-opus-5",
  max_tokens: 4096,
  betas: ["compact-2026-09-04"],
  messages: older,
  compaction: { type: "summarize" },
})
if (summary.stop_reason === "compaction") {
  history = [{ role: "assistant", content: summary.content }, ...recent]
}
```

Put the cut where no tool call is left open, so each tool call and its result end up on the same side.

## Challenge

Here you'll write the client-side version: your own summarizer instead of the API's. The `summarize` function is a stand-in for a model call, and tokens are counted as words so the numbers are easy to follow.

> 🎯 **Challenge:** Write `compact(messages, budget, keepTurns, summarize)`. If the total tokens are within `budget`, or there are no more than `keepTurns` turns, return `messages` unchanged. Otherwise keep the last `keepTurns` turns (2 messages each) word for word, and put one `{ role: "assistant", content: "Summary: " + summarize(older) }` message in front of them.

```typescript starter
export type Message = { role: "user" | "assistant"; content: string }

export const countTokens = (messages: Message[]) =>
  messages.reduce((n, m) => n + m.content.split(/\s+/).filter(Boolean).length, 0)

export function compact(
  messages: Message[],
  budget: number,
  keepTurns: number,
  summarize: (older: Message[]) => string
): Message[] {
  return messages
}

// A stand-in for the model call that writes the summary.
const fakeSummarize = (older: Message[]) => `${older.length} earlier messages about the data model`

const history: Message[] = [
  { role: "user", content: "Name the main entities for a recipe app" },
  { role: "assistant", content: "Recipe, Ingredient, Step and RecipeIngredient" },
  { role: "user", content: "Which fields should Recipe have?" },
  { role: "assistant", content: "id, title, servings and created_at" },
  { role: "user", content: "Which indexes do we need?" },
  { role: "assistant", content: "An index on RecipeIngredient.recipe_id" },
]
const compacted = compact(history, 20, 1, fakeSummarize)
console.log(countTokens(history), "→", countTokens(compacted))
console.log(compacted[0]!.content)
```

```typescript solution
export type Message = { role: "user" | "assistant"; content: string }

export const countTokens = (messages: Message[]) =>
  messages.reduce((n, m) => n + m.content.split(/\s+/).filter(Boolean).length, 0)

export function compact(
  messages: Message[],
  budget: number,
  keepTurns: number,
  summarize: (older: Message[]) => string
): Message[] {
  const keep = 2 * keepTurns
  if (countTokens(messages) <= budget || messages.length <= keep) return messages
  const older = messages.slice(0, messages.length - keep)
  const recent = messages.slice(messages.length - keep)
  return [{ role: "assistant", content: "Summary: " + summarize(older) }, ...recent]
}

// A stand-in for the model call that writes the summary.
const fakeSummarize = (older: Message[]) => `${older.length} earlier messages about the data model`

const history: Message[] = [
  { role: "user", content: "Name the main entities for a recipe app" },
  { role: "assistant", content: "Recipe, Ingredient, Step and RecipeIngredient" },
  { role: "user", content: "Which fields should Recipe have?" },
  { role: "assistant", content: "id, title, servings and created_at" },
  { role: "user", content: "Which indexes do we need?" },
  { role: "assistant", content: "An index on RecipeIngredient.recipe_id" },
]
const compacted = compact(history, 20, 1, fakeSummarize)
console.log(countTokens(history), "→", countTokens(compacted))
console.log(compacted[0]!.content)
```

```typescript check
type M = { role: "user" | "assistant"; content: string }
const msgs: M[] = []
for (let i = 1; i <= 4; i++) {
  msgs.push({ role: "user", content: `question ${i} with some words` })
  msgs.push({ role: "assistant", content: `answer ${i} with some more words here` })
}
let seen: M[] = []
const spy = (older: M[]) => ((seen = older), "S")

const same = lesson.compact(msgs, 1000, 1, spy)
expect(same === msgs, "Under the budget, return the same array unchanged")

const out = lesson.compact(msgs, 10, 2, spy)
expect(out.length === 5, `Keeping 2 turns should give 1 summary + 4 messages, got ${out.length} messages`)
expect(out[0]?.role === "assistant" && out[0]?.content === "Summary: S", `The first message should be { role: "assistant", content: "Summary: S" }, got ${JSON.stringify(out[0])}`)
expect(JSON.stringify(out.slice(1)) === JSON.stringify(msgs.slice(4)), "The last 2 turns (4 messages) must be kept word for word, in order")
expect(seen.length === 4 && seen[0]?.content === "question 1 with some words", "summarize should receive exactly the 4 older messages")

const short = lesson.compact(msgs.slice(0, 2), 1, 1, spy)
expect(short.length === 2, "With no more than keepTurns turns there's nothing to summarize: return the messages unchanged")
```

**Reference:** [How Claude Code works: the context window](https://code.claude.com/docs/en/how-claude-code-works#the-context-window) in the Claude Code docs, and [Compaction that keeps recent turns](https://platform.claude.com/docs/en/build-with-claude/compaction-keep-recent-turns) and [Context windows](https://platform.claude.com/docs/en/build-with-claude/context-windows) in the Claude API docs.
