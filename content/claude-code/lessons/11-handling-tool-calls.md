---
title: Handling tool calls
section: 3 · Tool Use
---

Defining a tool doesn't run anything. When Claude decides to use one of your client tools, the response stops early with `stop_reason: "tool_use"` and contains one or more `tool_use` blocks. Your code has to run the tool and send the result back. Then Claude continues its answer.

A response that calls a tool looks like this:

```json
{
  "id": "msg_01Aq9w938a90dw8q",
  "model": "claude-opus-5",
  "stop_reason": "tool_use",
  "role": "assistant",
  "content": [
    { "type": "text", "text": "I'll check the current weather in San Francisco for you." },
    {
      "type": "tool_use",
      "id": "toolu_01A09q90qw90lq917835lq9",
      "name": "get_weather",
      "input": { "location": "San Francisco, CA", "unit": "celsius" }
    }
  ]
}
```

Each `tool_use` block has three fields you need:

| Field | Meaning |
| --- | --- |
| `id` | A unique ID for this call. You'll quote it back in the result. |
| `name` | Which tool to run. |
| `input` | The arguments, as an object that follows the tool's `input_schema`. |

## Reading the tool_use blocks

`content` is a list of blocks of different types, so filter by `type` first. The response below is hand-written in the real API shape, so it runs without an API key:

```typescript
type TextBlock = { type: "text"; text: string }
type ToolUseBlock = { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
type Response = { stop_reason: "tool_use" | "end_turn"; content: (TextBlock | ToolUseBlock)[] }

const response: Response = {
  stop_reason: "tool_use",
  content: [
    { type: "text", text: "I'll check the current weather in San Francisco for you." },
    { type: "tool_use", id: "toolu_01", name: "get_weather", input: { location: "San Francisco, CA" } },
  ],
}

if (response.stop_reason === "tool_use") {
  for (const block of response.content) {
    if (block.type === "tool_use") console.log(`run ${block.name}(${JSON.stringify(block.input)}) for ${block.id}`)
  }
}
```

## Sending the result back

To reply, send a new message with role `user` whose content has a `tool_result` block:

| Field | Meaning |
| --- | --- |
| `tool_use_id` | The `id` of the `tool_use` block this answers. |
| `content` | Optional. The result, as a string like `"15 degrees"` or a list of content blocks. |
| `is_error` | Optional. Set it to `true` when the tool failed. |

The docs set two formatting rules. Break them and you get a 400 error:

1. The tool result message must come **right after** the assistant message that made the call. No other messages can go in between.
2. In that user message, the `tool_result` blocks come **first**. Any text must come after all of them.

Then send the whole conversation again: the user's question, Claude's `tool_use` reply, and your `tool_result`. The API is stateless, so it only knows what you send.

## The loop, with a stand-in model

The code below uses a **scripted fake model**: a function that returns canned responses shaped like the real Messages API, so you can see the loop without a key. The loop runs tools while `stop_reason` is `"tool_use"` and stops at `"end_turn"`:

```typescript
type TextBlock = { type: "text"; text: string }
type ToolUseBlock = { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
type ToolResultBlock = { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean }
type Message =
  | { role: "user"; content: string | ToolResultBlock[] }
  | { role: "assistant"; content: (TextBlock | ToolUseBlock)[] }
type Response = { stop_reason: "tool_use" | "end_turn"; content: (TextBlock | ToolUseBlock)[] }

// Stand-in for client.messages.create: first asks for a tool, then answers.
function fakeModel(messages: Message[]): Response {
  const last = messages[messages.length - 1]
  if (typeof last.content === "string") {
    return {
      stop_reason: "tool_use",
      content: [{ type: "tool_use", id: "toolu_01", name: "get_weather", input: { location: "Paris" } }],
    }
  }
  const result = last.content[0] as ToolResultBlock
  return { stop_reason: "end_turn", content: [{ type: "text", text: `It's ${result.content} in Paris.` }] }
}

const getWeather = (input: Record<string, unknown>) => `18°C and sunny (checked ${String(input.location)})`

const messages: Message[] = [{ role: "user", content: "What's the weather in Paris?" }]
let response = fakeModel(messages)

while (response.stop_reason === "tool_use") {
  messages.push({ role: "assistant", content: response.content })
  const results: ToolResultBlock[] = []
  for (const block of response.content) {
    if (block.type === "tool_use") {
      results.push({ type: "tool_result", tool_use_id: block.id, content: getWeather(block.input) })
    }
  }
  messages.push({ role: "user", content: results })
  response = fakeModel(messages)
}

for (const block of response.content) if (block.type === "text") console.log(block.text)
console.log(`${messages.length} messages in the history`)
```

With the real SDK, the only change is that `fakeModel(messages)` becomes an API call. Types like `Anthropic.ToolUseBlock` and `Anthropic.MessageParam` come from the package:

```typescript-snippet
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()
const tools: Anthropic.Tool[] = [/* get_weather from the last lesson */]
const messages: Anthropic.MessageParam[] = [{ role: "user", content: "What's the weather in Paris?" }]

let response = await client.messages.create({ model: "claude-opus-5", max_tokens: 1024, tools, messages })

while (response.stop_reason === "tool_use") {
  messages.push({ role: "assistant", content: response.content })
  const results: Anthropic.ToolResultBlockParam[] = []
  for (const block of response.content) {
    if (block.type === "tool_use") {
      results.push({ type: "tool_result", tool_use_id: block.id, content: await runTool(block.name, block.input) })
    }
  }
  messages.push({ role: "user", content: results })
  response = await client.messages.create({ model: "claude-opus-5", max_tokens: 1024, tools, messages })
}
```

> 💡 **Tip:** The SDK also has a **Tool Runner** that does this loop for you. Writing the loop yourself once shows you what it does.

## When a tool fails

Tools fail: a network call times out, or Claude calls a tool with a missing parameter. Don't crash, and don't drop the result. Send a `tool_result` with `is_error: true` and a useful message:

```json
{
  "type": "tool_result",
  "tool_use_id": "toolu_01A09q90qw90lq917835lq9",
  "content": "ConnectionError: the weather service API is not available (HTTP 500)",
  "is_error": true
}
```

Claude reads the error and adapts. It can tell the user the service is down, or retry with the missing information. The docs say that for an invalid request, Claude "will retry 2-3 times with corrections before apologizing to the user."

Write the message for Claude, not for a log file. The docs suggest saying what went wrong and what to try next. `"Rate limit exceeded. Retry after 60 seconds."` helps Claude much more than `"failed"`.

```typescript
function toResult(id: string, run: () => string) {
  try {
    return { type: "tool_result" as const, tool_use_id: id, content: run() }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { type: "tool_result" as const, tool_use_id: id, content: `Error: ${message}`, is_error: true }
  }
}

console.log(toResult("toolu_01", () => "15 degrees"))
console.log(toResult("toolu_02", () => { throw new Error("Missing required 'location' parameter") }))
```

> 💡 **Tip:** Tool results often contain text you don't control, like web pages or emails. Keep that text inside `tool_result` blocks, not in your system prompt, so it isn't read as instructions from you.

## Challenge

> 🎯 **Challenge:** Write `handleToolUse(response, tools)`. It returns the user message to send next: `{ role: "user", content: [...] }` with one `tool_result` per `tool_use` block, in order, each with the right `tool_use_id`. Put the tool's return value in `content`. If the tool name isn't in `tools`, or the tool throws, return `is_error: true` with a message that says what went wrong (include the unknown tool's name, or the thrown error's message).

```typescript starter
type TextBlock = { type: "text"; text: string }
type ToolUseBlock = { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
export type ToolResultBlock = { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean }
export type Response = { stop_reason: "tool_use" | "end_turn"; content: (TextBlock | ToolUseBlock)[] }
export type Tools = Record<string, (input: Record<string, unknown>) => string | Promise<string>>

export async function handleToolUse(
  response: Response,
  tools: Tools
): Promise<{ role: "user"; content: ToolResultBlock[] }> {
  const content: ToolResultBlock[] = []
  // one tool_result per tool_use block
  return { role: "user", content }
}

const tools: Tools = {
  get_weather: (input) => `18°C in ${String(input.location)}`,
}

const reply = await handleToolUse(
  {
    stop_reason: "tool_use",
    content: [
      { type: "text", text: "Checking..." },
      { type: "tool_use", id: "toolu_01", name: "get_weather", input: { location: "Paris" } },
      { type: "tool_use", id: "toolu_02", name: "get_time", input: {} },
    ],
  },
  tools
)
console.log(JSON.stringify(reply, null, 2))
```

```typescript solution
type TextBlock = { type: "text"; text: string }
type ToolUseBlock = { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
export type ToolResultBlock = { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean }
export type Response = { stop_reason: "tool_use" | "end_turn"; content: (TextBlock | ToolUseBlock)[] }
export type Tools = Record<string, (input: Record<string, unknown>) => string | Promise<string>>

export async function handleToolUse(
  response: Response,
  tools: Tools
): Promise<{ role: "user"; content: ToolResultBlock[] }> {
  const content: ToolResultBlock[] = []
  for (const block of response.content) {
    if (block.type !== "tool_use") continue
    const tool = tools[block.name]
    if (!tool) {
      content.push({ type: "tool_result", tool_use_id: block.id, content: `Error: unknown tool "${block.name}"`, is_error: true })
      continue
    }
    try {
      content.push({ type: "tool_result", tool_use_id: block.id, content: await tool(block.input) })
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      content.push({ type: "tool_result", tool_use_id: block.id, content: `Error: ${message}`, is_error: true })
    }
  }
  return { role: "user", content }
}

const tools: Tools = {
  get_weather: (input) => `18°C in ${String(input.location)}`,
}

const reply = await handleToolUse(
  {
    stop_reason: "tool_use",
    content: [
      { type: "text", text: "Checking..." },
      { type: "tool_use", id: "toolu_01", name: "get_weather", input: { location: "Paris" } },
      { type: "tool_use", id: "toolu_02", name: "get_time", input: {} },
    ],
  },
  tools
)
console.log(JSON.stringify(reply, null, 2))
```

```typescript check
const tools: import("./main.js").Tools = {
  add: (input) => String(Number(input.a) + Number(input.b)),
  lookup: async (input) => `order ${String(input.id)} shipped`,
  explode: () => {
    throw new Error("database is offline")
  },
}

const reply = await lesson.handleToolUse(
  {
    stop_reason: "tool_use",
    content: [
      { type: "text", text: "Let me run those." },
      { type: "tool_use", id: "toolu_a", name: "add", input: { a: 2, b: 3 } },
      { type: "tool_use", id: "toolu_b", name: "lookup", input: { id: 42 } },
      { type: "tool_use", id: "toolu_c", name: "explode", input: {} },
      { type: "tool_use", id: "toolu_d", name: "teleport", input: {} },
    ],
  },
  tools
)

expect(reply.role === "user", `The reply must be a "user" message, got role ${JSON.stringify(reply.role)}`)
expect(reply.content.length === 4, `Expected 4 tool_result blocks (one per tool_use, none for the text block), got ${reply.content.length}`)
const [a, b, c, d] = reply.content
expect(reply.content.every((r) => r.type === "tool_result"), 'Every block must have type "tool_result"')
expect(a.tool_use_id === "toolu_a" && b.tool_use_id === "toolu_b" && c.tool_use_id === "toolu_c" && d.tool_use_id === "toolu_d", "Results must keep the order of the tool_use blocks and copy each block's id into tool_use_id")
expect(a.content === "5" && !a.is_error, `add(2, 3) should give content "5" with no is_error, got ${JSON.stringify(a)}`)
expect(b.content === "order 42 shipped" && !b.is_error, `Async tools must be awaited: expected "order 42 shipped", got ${JSON.stringify(b)}`)
expect(c.is_error === true && c.content.includes("database is offline"), `A tool that throws should give is_error: true and include the error message, got ${JSON.stringify(c)}`)
expect(d.is_error === true && d.content.includes("teleport"), `An unknown tool should give is_error: true and name the tool, got ${JSON.stringify(d)}`)
```

**Reference:** [Handle tool calls](https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls) in the Claude API docs.
