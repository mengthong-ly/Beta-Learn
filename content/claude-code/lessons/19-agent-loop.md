---
title: The agent loop
section: 5 · Agentic Workflows
---

An **agent** is a model that uses tools in a loop. It isn't a special API. You send a request with a `tools` list. If Claude wants a tool, the response comes back with `stop_reason: "tool_use"` and one or more `tool_use` blocks. You run those tools and send the results back in `tool_result` blocks. Then you ask again. When Claude answers without calling a tool, the loop is over.

Claude Code works this way, and so does every agent you build with the Messages API. This lesson shows you how to write that loop yourself.

## The loop, step by step

1. Call the model with the conversation so far and the `tools` list.
2. If `stop_reason` is `"tool_use"`, add Claude's whole reply to the history as an `assistant` message.
3. Run **every** `tool_use` block in that reply. Send all the results back together in **one** `user` message. Each `tool_result` has a `tool_use_id` that matches the `id` of the call it answers.
4. Go back to step 1.
5. When `stop_reason` is `"end_turn"`, read the final text and stop.

The API tutorial writes this loop with the real SDK. It's shown here as a snippet because it needs an API key:

```typescript-snippet
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()
const messages: Anthropic.MessageParam[] = [{ role: "user", content: "Schedule a standup every Monday at 9am." }]

let response = await client.messages.create({ model: "claude-opus-5", max_tokens: 1024, tools, messages })

while (response.stop_reason === "tool_use") {
  messages.push({ role: "assistant", content: response.content })
  const results: Anthropic.ToolResultBlockParam[] = []
  for (const block of response.content) {
    if (block.type !== "tool_use") continue
    results.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(runTool(block.name, block.input)) })
  }
  messages.push({ role: "user", content: results })
  response = await client.messages.create({ model: "claude-opus-5", max_tokens: 1024, tools, messages })
}
```

## A loop you can run

The examples in this lesson can't call the real API, so they use a **scripted fake model**. It's a stand-in: a function that returns canned replies shaped like real Messages API responses, with `content` blocks and a `stop_reason`. The loop around it is the same code you would use with the real model.

```typescript
type Block =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
type Reply = { content: Block[]; stop_reason: "tool_use" | "end_turn" }

// The stand-in model: it asks for the weather once, then answers.
const script: Reply[] = [
  { content: [{ type: "tool_use", id: "toolu_1", name: "get_weather", input: { city: "Paris" } }], stop_reason: "tool_use" },
  { content: [{ type: "text", text: "It's 18°C and cloudy in Paris." }], stop_reason: "end_turn" },
]
let call = 0
const fakeModel = async (): Promise<Reply> => script[call++]

const tools: Record<string, (input: Record<string, unknown>) => string> = {
  get_weather: (input) => `18°C, cloudy in ${input.city}`,
}

const messages: unknown[] = [{ role: "user", content: "What's the weather in Paris?" }]
let reply = await fakeModel()
while (reply.stop_reason === "tool_use") {
  messages.push({ role: "assistant", content: reply.content })
  const results = reply.content
    .filter((b): b is Extract<Block, { type: "tool_use" }> => b.type === "tool_use")
    .map((b) => ({ type: "tool_result", tool_use_id: b.id, content: tools[b.name](b.input) }))
  console.log("ran:", results.map((r) => r.content).join(", "))
  messages.push({ role: "user", content: results })
  reply = await fakeModel()
}
console.log("final:", reply.content[0].type === "text" ? reply.content[0].text : "")
console.log("messages in history:", messages.length)
```

## When a tool fails

Tools fail. An API rejects the input, or Claude asks for a tool you don't have. Don't let the error crash the loop. Send the message back as a `tool_result` with `is_error: true`. Claude reads the error and can retry with corrected input, ask the user, or explain what went wrong.

```typescript
function runSafely(run: () => string, id: string) {
  try {
    return { type: "tool_result", tool_use_id: id, content: run() }
  } catch (e) {
    return { type: "tool_result", tool_use_id: id, content: String(e), is_error: true }
  }
}

console.log(runSafely(() => "42", "toolu_1"))
console.log(runSafely(() => { throw new Error("Too many attendees (max 10)") }, "toolu_2"))
```

## Always cap the turns

A loop that runs until the model says stop could, in theory, run forever. Real agents set a limit:

| Where | The limit |
| --- | --- |
| SDK Tool Runner | `max_iterations` (all seven SDKs support it) |
| Claude Code subagent | `maxTurns` in the frontmatter. When it hits the limit, Claude Code returns the output marked as partial |
| Your own loop | A counter: stop after N model calls, even if Claude still wants tools |

The SDKs also have a **Tool Runner** that writes this loop for you. It calls the API, runs your tool functions, appends the results and repeats until Claude stops calling tools:

```typescript-snippet
const finalMessage = await client.beta.messages.toolRunner({
  model: "claude-opus-5",
  max_tokens: 1024,
  tools: [createCalendarEvent, listCalendarEvents], // made with betaZodTool
  messages: [{ role: "user", content: "Check next Monday, then schedule a planning session." }],
  max_iterations: 10,
})
```

> 💡 **Tip:** write the loop by hand once so you know what's going on inside it. Then use the Tool Runner.

## Workflows vs. agents

Anthropic's "Building effective agents" post makes a split. In a **workflow**, your code decides the steps and calls the model at fixed points. In an **agent**, the model decides which tools to use and when to stop. The post's advice: start with simple prompts, and add multi-step systems only when simpler ones fall short. Agents cost more, and their errors can compound.

| Pattern | What it does | Use it when |
| --- | --- | --- |
| Prompt chaining | Each call works on the previous call's output, with checks in between | The task splits cleanly into fixed steps |
| Routing | Classify the input, then send it to a specialized follow-up | Distinct categories are better handled separately |
| Parallelization | Run calls at the same time (*sectioning*) or the same call several times (*voting*), then combine the results | Subtasks are independent, or you want several attempts |
| Orchestrator-workers | A central model breaks the task down, hands the pieces to workers and merges what they return | You can't predict the subtasks in advance |
| Evaluator-optimizer | One call writes, another grades it and gives feedback, in a loop | You have clear criteria and refining helps |
| Agent | The model loops with tools until it's done | Open-ended problems where you can't predict the number of steps |

Routing is a workflow: your code picks the path, not the model. Here's a sketch with a fake classifier:

```typescript
type Route = "billing" | "technical" | "general"
const classify = (q: string): Route =>
  /refund|invoice|charge/i.test(q) ? "billing" : /error|crash|bug/i.test(q) ? "technical" : "general"

const handlers: Record<Route, (q: string) => string> = {
  billing: (q) => `[billing prompt] ${q}`,
  technical: (q) => `[technical prompt, bigger model] ${q}`,
  general: (q) => `[small, cheap model] ${q}`,
}

for (const q of ["I was charged twice", "The app crashes on start", "What are your hours?"]) {
  console.log(handlers[classify(q)](q))
}
```

## Challenge

> 🎯 **Challenge:** Implement `runAgent(model, tools, prompt, maxTurns)`. Start the history with the user's prompt. On every `"tool_use"` reply, append the reply, run every `tool_use` block and send all the results in one `user` message. Report an unknown tool as a `tool_result` with `is_error: true`. Return `{ text, turns, stopped }`, where `turns` counts model calls. `stopped` is `"end_turn"`, or `"max_turns"` once `maxTurns` calls have been made while Claude still wants tools.

```typescript starter
type TextBlock = { type: "text"; text: string }
type ToolUseBlock = { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
type ToolResultBlock = { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean }
export type Message = { role: "user" | "assistant"; content: string | (TextBlock | ToolUseBlock | ToolResultBlock)[] }
export type Reply = { content: (TextBlock | ToolUseBlock)[]; stop_reason: "tool_use" | "end_turn" }
export type Model = (messages: Message[]) => Promise<Reply>
export type Tools = Record<string, (input: Record<string, unknown>) => string>
export type Result = { text: string; turns: number; stopped: "end_turn" | "max_turns" }

export async function runAgent(model: Model, tools: Tools, prompt: string, maxTurns: number): Promise<Result> {
  const messages: Message[] = [{ role: "user", content: prompt }]
  // call the model, run tools, append results, repeat
  return { text: "", turns: 0, stopped: "end_turn" }
}

// A scripted stand-in for Claude: one tool call, then an answer.
const replies: Reply[] = [
  { content: [{ type: "tool_use", id: "t1", name: "add", input: { a: 2, b: 3 } }], stop_reason: "tool_use" },
  { content: [{ type: "text", text: "2 + 3 = 5" }], stop_reason: "end_turn" },
]
const fake: Model = async () => replies.shift()!
console.log(await runAgent(fake, { add: (i) => String(Number(i.a) + Number(i.b)) }, "What is 2 + 3?", 5))
```

```typescript solution
type TextBlock = { type: "text"; text: string }
type ToolUseBlock = { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
type ToolResultBlock = { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean }
export type Message = { role: "user" | "assistant"; content: string | (TextBlock | ToolUseBlock | ToolResultBlock)[] }
export type Reply = { content: (TextBlock | ToolUseBlock)[]; stop_reason: "tool_use" | "end_turn" }
export type Model = (messages: Message[]) => Promise<Reply>
export type Tools = Record<string, (input: Record<string, unknown>) => string>
export type Result = { text: string; turns: number; stopped: "end_turn" | "max_turns" }

function runTool(tools: Tools, call: ToolUseBlock): ToolResultBlock {
  const tool = tools[call.name]
  if (!tool) return { type: "tool_result", tool_use_id: call.id, content: `Unknown tool: ${call.name}`, is_error: true }
  try {
    return { type: "tool_result", tool_use_id: call.id, content: tool(call.input) }
  } catch (e) {
    return { type: "tool_result", tool_use_id: call.id, content: String(e), is_error: true }
  }
}

export async function runAgent(model: Model, tools: Tools, prompt: string, maxTurns: number): Promise<Result> {
  const messages: Message[] = [{ role: "user", content: prompt }]
  let turns = 0
  while (turns < maxTurns) {
    const reply = await model(messages)
    turns++
    const text = reply.content.map((b) => (b.type === "text" ? b.text : "")).join("")
    if (reply.stop_reason !== "tool_use") return { text, turns, stopped: "end_turn" }
    messages.push({ role: "assistant", content: reply.content })
    const calls = reply.content.filter((b): b is ToolUseBlock => b.type === "tool_use")
    messages.push({ role: "user", content: calls.map((c) => runTool(tools, c)) })
  }
  return { text: "", turns, stopped: "max_turns" }
}

// A scripted stand-in for Claude: one tool call, then an answer.
const replies: Reply[] = [
  { content: [{ type: "tool_use", id: "t1", name: "add", input: { a: 2, b: 3 } }], stop_reason: "tool_use" },
  { content: [{ type: "text", text: "2 + 3 = 5" }], stop_reason: "end_turn" },
]
const fake: Model = async () => replies.shift()!
console.log(await runAgent(fake, { add: (i) => String(Number(i.a) + Number(i.b)) }, "What is 2 + 3?", 5))
```

```typescript check
type Reply = import("./main.js").Reply
type Message = import("./main.js").Message

// A scripted model that records a copy of the history it was sent on each call.
function scripted(replies: Reply[]) {
  const seen: Message[][] = []
  const model = async (messages: Message[]) => {
    seen.push(structuredClone(messages))
    const next = replies.shift()
    if (!next) throw new Error("The fake model ran out of replies: runAgent kept looping after end_turn")
    return next
  }
  return { model, seen }
}

const s = scripted([
  {
    content: [
      { type: "text", text: "Checking both." },
      { type: "tool_use", id: "a", name: "double", input: { n: 4 } },
      { type: "tool_use", id: "b", name: "nope", input: {} },
    ],
    stop_reason: "tool_use",
  },
  { content: [{ type: "text", text: "Done: 8" }], stop_reason: "end_turn" },
])
const r = await lesson.runAgent(s.model, { double: (i) => String(Number(i.n) * 2) }, "Double 4", 5)
expect(s.seen.length === 2, `The model should be called twice (tool_use, then end_turn), but it was called ${s.seen.length} time(s)`)
const first = s.seen[0]
expect(first.length === 1 && first[0].role === "user" && first[0].content === "Double 4", "The first call should get one user message holding the prompt")
const second = s.seen[1]
expect(second.length === 3, `The second call should see 3 messages (prompt, assistant reply, tool results), got ${second.length}`)
expect(second[1].role === "assistant" && Array.isArray(second[1].content) && second[1].content.length === 3, "Append Claude's whole reply (all its blocks) as an assistant message")
const results = second[2].content
expect(second[2].role === "user" && Array.isArray(results) && results.length === 2, "Send the results of BOTH tool_use blocks together in one user message")
const [ra, rb] = results as { type: string; tool_use_id: string; content: string; is_error?: boolean }[]
expect(ra.type === "tool_result" && ra.tool_use_id === "a" && ra.content === "8", `Result for "a" should be a tool_result with tool_use_id "a" and content "8", got ${JSON.stringify(ra)}`)
expect(rb.tool_use_id === "b" && rb.is_error === true, `An unknown tool should come back as a tool_result with is_error: true, got ${JSON.stringify(rb)}`)
expect(r.text === "Done: 8" && r.turns === 2 && r.stopped === "end_turn", `Expected { text: "Done: 8", turns: 2, stopped: "end_turn" }, got ${JSON.stringify(r)}`)

// A model that never stops asking for tools: the guard must end the loop.
let calls = 0
const forever = async (): Promise<Reply> => {
  calls++
  return { content: [{ type: "tool_use", id: `t${calls}`, name: "double", input: { n: 1 } }], stop_reason: "tool_use" }
}
const capped = await lesson.runAgent(forever, { double: () => "2" }, "loop", 3)
expect(calls === 3, `With maxTurns 3 the model should be called exactly 3 times, got ${calls}`)
expect(capped.stopped === "max_turns" && capped.turns === 3, `Expected stopped "max_turns" and turns 3, got ${JSON.stringify(capped)}`)
```

**Reference:** [Tutorial: Build a tool-using agent](https://platform.claude.com/docs/en/agents-and-tools/tool-use/build-a-tool-using-agent) and [Tool runner (SDK)](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-runner) in the Claude Developer Platform docs, and [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) on Anthropic's engineering blog.
