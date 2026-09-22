---
title: Parallel tool calls
section: 3 · Tool Use
---

Ask "What's the weather in Paris, Tokyo and Lima?" and Claude doesn't need three round trips. By default it can put **several `tool_use` blocks in one response**, one per city. Your job is the same as before, times three: run each call and send back one `tool_result` per `tool_use`.

```json
{
  "stop_reason": "tool_use",
  "content": [
    { "type": "text", "text": "I'll check all three cities." },
    { "type": "tool_use", "id": "toolu_01", "name": "get_weather", "input": { "location": "Paris" } },
    { "type": "tool_use", "id": "toolu_02", "name": "get_weather", "input": { "location": "Tokyo" } },
    { "type": "tool_use", "id": "toolu_03", "name": "get_weather", "input": { "location": "Lima" } }
  ]
}
```

## You choose how to run them

The API doesn't set an execution order. The docs say you can run the calls concurrently (`Promise.all`), one by one in the order they appear, or a mix. Pick based on what the tools do:

| The calls are... | Run them |
| --- | --- |
| Independent and read-only (lookups, searches, reading files) | Concurrently, for lower latency |
| Writing, sharing state, or dependent on each other | One by one, in order |

Here's why concurrency matters. Each fake lookup below takes 100 ms. Run one by one, three take about 300 ms. With `Promise.all`, they take about as long as the slowest one:

```typescript
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
async function getWeather(city: string) {
  await sleep(100)
  return `${city}: 20°C`
}
const cities = ["Paris", "Tokyo", "Lima"]

let start = Date.now()
for (const city of cities) await getWeather(city)
const oneByOne = Date.now() - start

start = Date.now()
const results = await Promise.all(cities.map((city) => getWeather(city)))
const together = Date.now() - start

console.log(results)
console.log(together < oneByOne ? "Promise.all was faster" : "no difference?")
```

`Promise.all` also returns the results **in the same order as its input**, even when a later call finishes first. That makes it easy to pair each result with its `tool_use` block.

## All results in one message

However you run them, the docs say to return one `tool_result` for each `tool_use` block, **all together in the next user message**. Match each result to its call with `tool_use_id`, and put every `tool_result` before any text.

Sending each result in its own user message is a common mistake. The docs warn that separate user messages reduce parallel tool use in later turns.

```typescript
const ids = ["toolu_01", "toolu_02", "toolu_03"]
const results = ["Paris: 18°C", "Tokyo: 24°C", "Lima: 20°C"]
const toResult = (id: string, i: number) => ({ type: "tool_result", tool_use_id: id, content: results[i] })

// Wrong: one user message per result
const wrong = ids.map((id, i) => ({ role: "user", content: [toResult(id, i)] }))

// Right: a single user message with every result
const right = { role: "user", content: ids.map(toResult) }

console.log(`wrong: ${wrong.length} messages; right: 1 message with ${right.content.length} results`)
```

If one call fails, send an `is_error` result for it and keep the others. If you run the calls in order and stop at the first failure, still send a result for each call you skipped, as the docs show:

```json
{
  "type": "tool_result",
  "tool_use_id": "toolu_02",
  "is_error": true,
  "content": "Not executed: the preceding write_file call failed."
}
```

> 💡 **Tip:** If Claude sometimes puts dependent calls in the same batch (for example "create the file" and "read the file"), the docs suggest adding "Only batch tool calls that are independent of each other." to your system prompt.

## Turning it off

Parallel tool use is on by default. To turn it off, set `disable_parallel_tool_use: true` **inside `tool_choice`**. It isn't a top-level parameter. What it does depends on the `tool_choice` type:

| `tool_choice.type` | With `disable_parallel_tool_use: true` |
| --- | --- |
| `auto` (the default) | Claude calls **at most one** tool per response. It can still answer in plain text. |
| `any` or `tool` | Claude calls **exactly one** tool. |

```typescript-snippet
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()

const response = await client.messages.create({
  model: "claude-opus-5",
  max_tokens: 1024,
  tools, // your tool definitions
  tool_choice: { type: "auto", disable_parallel_tool_use: true },
  messages: [{ role: "user", content: "What's the weather in Paris, Tokyo and Lima?" }],
})
```

Turn it off when each step depends on the one before, for example when a tool changes state the next call must see. Otherwise, leave it on. Fewer round trips means faster answers.

## Challenge

> 🎯 **Challenge:** Write `runToolCalls(response, tools)`. It runs every `tool_use` block **concurrently** with `Promise.all` and returns a single user message with one `tool_result` per call, in the same order as the blocks. If a tool is unknown or throws, return `is_error: true` for that call and keep the rest. The starter works but runs the calls one by one, which is too slow.

```typescript starter
type TextBlock = { type: "text"; text: string }
type ToolUseBlock = { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
export type ToolResultBlock = { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean }
export type Response = { stop_reason: "tool_use" | "end_turn"; content: (TextBlock | ToolUseBlock)[] }
export type Tools = Record<string, (input: Record<string, unknown>) => Promise<string>>

async function runOne(block: ToolUseBlock, tools: Tools): Promise<ToolResultBlock> {
  const tool = tools[block.name]
  if (!tool) return { type: "tool_result", tool_use_id: block.id, content: `Error: unknown tool "${block.name}"`, is_error: true }
  try {
    return { type: "tool_result", tool_use_id: block.id, content: await tool(block.input) }
  } catch (e) {
    return { type: "tool_result", tool_use_id: block.id, content: `Error: ${e instanceof Error ? e.message : String(e)}`, is_error: true }
  }
}

export async function runToolCalls(response: Response, tools: Tools): Promise<{ role: "user"; content: ToolResultBlock[] }> {
  const content: ToolResultBlock[] = []
  for (const block of response.content) {
    if (block.type === "tool_use") content.push(await runOne(block, tools)) // one at a time: slow!
  }
  return { role: "user", content }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const tools: Tools = {
  get_weather: async (input) => {
    await sleep(100)
    return `20°C in ${String(input.location)}`
  },
}

const start = Date.now()
const reply = await runToolCalls(
  {
    stop_reason: "tool_use",
    content: ["Paris", "Tokyo", "Lima"].map((location, i) => ({
      type: "tool_use" as const,
      id: `toolu_0${i + 1}`,
      name: "get_weather",
      input: { location },
    })),
  },
  tools
)
console.log(reply.content.map((r) => r.content))
console.log(Date.now() - start < 250 ? "ran concurrently" : "ran one by one")
```

```typescript solution
type TextBlock = { type: "text"; text: string }
type ToolUseBlock = { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
export type ToolResultBlock = { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean }
export type Response = { stop_reason: "tool_use" | "end_turn"; content: (TextBlock | ToolUseBlock)[] }
export type Tools = Record<string, (input: Record<string, unknown>) => Promise<string>>

async function runOne(block: ToolUseBlock, tools: Tools): Promise<ToolResultBlock> {
  const tool = tools[block.name]
  if (!tool) return { type: "tool_result", tool_use_id: block.id, content: `Error: unknown tool "${block.name}"`, is_error: true }
  try {
    return { type: "tool_result", tool_use_id: block.id, content: await tool(block.input) }
  } catch (e) {
    return { type: "tool_result", tool_use_id: block.id, content: `Error: ${e instanceof Error ? e.message : String(e)}`, is_error: true }
  }
}

export async function runToolCalls(response: Response, tools: Tools): Promise<{ role: "user"; content: ToolResultBlock[] }> {
  const calls = response.content.filter((block): block is ToolUseBlock => block.type === "tool_use")
  const content = await Promise.all(calls.map((block) => runOne(block, tools)))
  return { role: "user", content }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const tools: Tools = {
  get_weather: async (input) => {
    await sleep(100)
    return `20°C in ${String(input.location)}`
  },
}

const start = Date.now()
const reply = await runToolCalls(
  {
    stop_reason: "tool_use",
    content: ["Paris", "Tokyo", "Lima"].map((location, i) => ({
      type: "tool_use" as const,
      id: `toolu_0${i + 1}`,
      name: "get_weather",
      input: { location },
    })),
  },
  tools
)
console.log(reply.content.map((r) => r.content))
console.log(Date.now() - start < 250 ? "ran concurrently" : "ran one by one")
```

```typescript check
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
// The slowest call comes first, so finishing order differs from call order.
const tools: import("./main.js").Tools = {
  slow: async () => { await sleep(200); return "slow done" },
  medium: async () => { await sleep(120); return "medium done" },
  fast: async () => { await sleep(40); return "fast done" },
  broken: async () => { await sleep(10); throw new Error("disk full") },
}

const start = Date.now()
const reply = await lesson.runToolCalls(
  {
    stop_reason: "tool_use",
    content: [
      { type: "text", text: "Running four tools at once." },
      { type: "tool_use", id: "t1", name: "slow", input: {} },
      { type: "tool_use", id: "t2", name: "medium", input: {} },
      { type: "tool_use", id: "t3", name: "fast", input: {} },
      { type: "tool_use", id: "t4", name: "broken", input: {} },
      { type: "tool_use", id: "t5", name: "missing", input: {} },
    ],
  },
  tools
)
const took = Date.now() - start

expect(reply.role === "user" && Array.isArray(reply.content), "Return ONE user message: { role: \"user\", content: [...] }")
expect(reply.content.length === 5, `Expected 5 tool_result blocks (one per tool_use), got ${reply.content.length}`)
expect(took < 330, `The calls took ${took} ms. Run one by one they need ~370 ms; with Promise.all it should be ~200 ms (the slowest call)`)
expect(reply.content.map((r) => r.tool_use_id).join(",") === "t1,t2,t3,t4,t5", `Results must follow the order of the tool_use blocks (t1..t5), got ${reply.content.map((r) => r.tool_use_id).join(",")}`)
expect(reply.content[0].content === "slow done" && reply.content[2].content === "fast done", "Each result's content should be what its tool returned")
expect(reply.content[3].is_error === true && reply.content[3].content.includes("disk full"), `A tool that throws should give is_error: true with its message, got ${JSON.stringify(reply.content[3])}`)
expect(reply.content[4].is_error === true && reply.content[4].content.includes("missing"), `An unknown tool should give is_error: true naming it, got ${JSON.stringify(reply.content[4])}`)
expect(!reply.content[0].is_error && !reply.content[1].is_error, "Successful results shouldn't have is_error: true")
```

**Reference:** [Parallel tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/parallel-tool-use) in the Claude API docs.
