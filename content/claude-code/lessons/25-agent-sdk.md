---
title: The Claude Agent SDK
section: 5 · Agentic Workflows
---

So far you've driven Claude Code from a terminal. The **Claude Agent SDK** gives you the same thing as a library: the same tools, agent loop and context management that power Claude Code, programmable from TypeScript or Python. Use it when the agent should live *inside your own app*: a CI bot, an internal support tool, a nightly code-audit job.

## Which tool to pick

The SDK docs compare four ways to build with Claude:

| You want to | Use | What you get |
| --- | --- | --- |
| Embed Claude Code's agent in your own app, in a process you operate | **Agent SDK** | A library that runs the Claude Code binary: built-in tools, permissions, sessions, hooks |
| Work interactively or run one-off tasks from a terminal | **Claude Code CLI** | The terminal interface |
| Call the Claude API directly | **Client SDK** (`@anthropic-ai/sdk`) | Raw API access. You write the tool loop yourself (or use its beta tool runner) |
| Have Anthropic host the agent | **Managed Agents** | A hosted harness on the Claude Platform, with sessions in an Anthropic-managed cloud sandbox or a self-hosted one |

The rule of thumb: the Client SDK gives you a model, the Agent SDK gives you an *agent* that already knows how to read files, run commands and edit code, and Managed Agents runs that agent for you on Anthropic's infrastructure (best for long-running, asynchronous work).

## Install and first query

```bash
npm install @anthropic-ai/claude-agent-sdk
export ANTHROPIC_API_KEY=your-api-key
```

The SDK reads the key from the environment of the process (it doesn't load `.env` files for you). The package isn't installed in this course, so SDK code below is shown, not run. This is the quickstart agent:

```typescript-snippet
import { query } from "@anthropic-ai/claude-agent-sdk"

// Agentic loop: streams messages as Claude works
for await (const message of query({
  prompt: "Review utils.py for bugs that would cause crashes. Fix any issues you find.",
  options: {
    allowedTools: ["Read", "Edit", "Glob"], // Auto-approve these tools
    permissionMode: "acceptEdits", // Auto-approve file edits
  },
})) {
  if (message.type === "assistant" && message.message?.content) {
    for (const block of message.message.content) {
      if ("text" in block) console.log(block.text) // Claude's reasoning
      else if ("name" in block) console.log(`Tool: ${block.name}`) // Tool being called
    }
  } else if (message.type === "result") {
    console.log(`Done: ${message.subtype}`) // Final result
  }
}
```

`query()` returns an **async generator** of messages. You don't write the loop that calls tools and feeds results back: the SDK does that. You just consume the stream.

## The messages you get back

Each message has a `type`. The ones you'll use most:

| `type` | When | Useful fields |
| --- | --- | --- |
| `"system"` (`subtype: "init"`) | First, once | `session_id`, `model`, `tools`, `mcp_servers`, `permissionMode` |
| `"assistant"` | Each model turn | `message.content`: `text` and `tool_use` blocks, same as the Messages API |
| `"user"` | Tool results fed back | the `tool_result` content |
| `"result"` | Last | `subtype` (`"success"` or an error such as `"error_max_turns"`), `result` (success only), `total_cost_usd`, `num_turns`, `duration_ms`, `is_error` |

Because it's just an async iterable, you can practise on a scripted stand-in. The generator below yields messages shaped like the SDK's (trimmed to the fields we read); it is not the real SDK:

```typescript
type Block = { type: "text"; text: string } | { type: "tool_use"; id: string; name: string; input: unknown }
type Msg =
  | { type: "system"; subtype: "init"; model: string; tools: string[] }
  | { type: "assistant"; message: { content: Block[] } }
  | { type: "result"; subtype: "success"; result: string; num_turns: number; total_cost_usd: number }

// Scripted stand-in for query(): no API key, no network.
async function* fakeQuery(): AsyncGenerator<Msg> {
  yield { type: "system", subtype: "init", model: "claude-opus-5", tools: ["Read", "Edit", "Glob"] }
  yield { type: "assistant", message: { content: [{ type: "text", text: "Let me look at utils.py." }, { type: "tool_use", id: "t1", name: "Read", input: { file_path: "utils.py" } }] } }
  yield { type: "assistant", message: { content: [{ type: "tool_use", id: "t2", name: "Edit", input: {} }] } }
  yield { type: "result", subtype: "success", result: "Fixed the empty-list crash.", num_turns: 3, total_cost_usd: 0.0123 }
}

for await (const m of fakeQuery()) {
  if (m.type === "system") console.log(`session started on ${m.model}`)
  else if (m.type === "assistant") {
    for (const b of m.message.content) console.log(b.type === "text" ? b.text : `Tool: ${b.name}`)
  } else console.log(`Done: ${m.subtype} in ${m.num_turns} turns, $${m.total_cost_usd}`)
}
```

## Options

The second argument to `query()` configures the agent. The common fields:

```typescript-snippet
query({
  prompt: "Summarise open TODOs in src/",
  options: {
    systemPrompt: "You are a senior TypeScript reviewer. Be brief.",
    allowedTools: ["Read", "Grep", "Glob"], // run without a permission prompt
    disallowedTools: ["Bash"], // a bare name removes the tool from Claude's context
    permissionMode: "default",
    maxTurns: 10, // stop after 10 tool-use round trips
    cwd: "/path/to/repo",
  },
})
```

- `systemPrompt` takes a string, or `{ type: "preset", preset: "claude_code" }` to use Claude Code's own system prompt (add `append` to extend it).
- `allowedTools` only **pre-approves**. Tools you don't list are still available; their calls go through the permission flow (and your `canUseTool` callback, if you pass one).
- `permissionMode` accepts exactly these documented values:

| Mode | Behaviour |
| --- | --- |
| `"default"` | Standard permission behaviour |
| `"acceptEdits"` | Auto-accept file edits |
| `"plan"` | Planning mode: explore without editing |
| `"dontAsk"` | Don't prompt; deny anything not pre-approved |
| `"auto"` | A model classifier approves or denies permission prompts |
| `"bypassPermissions"` | Bypass permission checks (explicit ask rules still prompt) |

For an unattended job, `"dontAsk"` plus a tight `allowedTools` list is the least-privilege choice from the prompt-injection lesson: anything you didn't list is denied, not prompted.

## Custom tools via in-process MCP

To give the agent your own functions, define them with `tool()` (name, description, Zod schema, handler), wrap them in `createSdkMcpServer()`, and pass the server in `mcpServers`. The server runs **in-process**, inside your app, not as a separate process:

```typescript-snippet
import { query, tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk"
import { z } from "zod"

const getTemperature = tool(
  "get_temperature",
  "Get the current temperature at a location",
  { latitude: z.number(), longitude: z.number() },
  async (args) => ({ content: [{ type: "text", text: `Temperature at ${args.latitude},${args.longitude}: 18°C` }] }),
  { annotations: { readOnlyHint: true } },
)

const weatherServer = createSdkMcpServer({ name: "weather", version: "1.0.0", tools: [getTemperature] })

for await (const message of query({
  prompt: "What's the temperature in San Francisco?",
  options: {
    mcpServers: { weather: weatherServer },
    allowedTools: ["mcp__weather__get_temperature"],
  },
})) {
  if (message.type === "result" && message.subtype === "success") console.log(message.result)
}
```

The key in `mcpServers` becomes the middle of the tool's full name: `mcp__{server_name}__{tool_name}`. That is the name to list in `allowedTools` (or `mcp__weather__*` for every tool on that server).

Under the hood this is an ordinary MCP server. You can run the same round trip with the MCP TypeScript SDK that *is* installed here, which is what the Agent SDK does for you:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { z } from "zod"

const server = new McpServer({ name: "weather", version: "1.0.0" })
server.registerTool(
  "get_temperature",
  { description: "Get the current temperature at a location", inputSchema: { latitude: z.number(), longitude: z.number() } },
  async ({ latitude, longitude }) => ({ content: [{ type: "text", text: `Temperature at ${latitude},${longitude}: 18°C` }] }),
)

const [clientT, serverT] = InMemoryTransport.createLinkedPair()
const client = new Client({ name: "agent", version: "1.0.0" })
await server.connect(serverT)
await client.connect(clientT)

const { tools } = await client.listTools()
console.log("Claude would see:", tools.map((t) => `mcp__weather__${t.name}`))
console.log(await client.callTool({ name: "get_temperature", arguments: { latitude: 37.77, longitude: -122.42 } }))
await client.close()
```

> 💡 **Tip:** the SDK also loads skills, commands and `CLAUDE.md` from your project's `.claude/` and `~/.claude/`, like Claude Code does, so the skills you wrote earlier in this course work in SDK agents too.

## Challenge

> 🎯 **Challenge:** Write `summarize(messages)` that consumes an async iterable of SDK-shaped messages and returns `{ result, costUsd, turns, tools }`: `result` is the final `result` text of a `"success"` result message (else `null`), `costUsd` and `turns` come from `total_cost_usd` and `num_turns`, and `tools` lists each `tool_use` name from assistant messages once, in the order first used.

```typescript starter
export type Block = { type: "text"; text: string } | { type: "tool_use"; id: string; name: string; input: unknown }
export type Msg =
  | { type: "system"; subtype: "init"; model: string; tools: string[] }
  | { type: "assistant"; message: { content: Block[] } }
  | { type: "user"; message: { content: unknown } }
  | { type: "result"; subtype: "success"; result: string; num_turns: number; total_cost_usd: number; is_error: boolean }
  | { type: "result"; subtype: "error_max_turns" | "error_during_execution"; num_turns: number; total_cost_usd: number; is_error: boolean }

export type Summary = { result: string | null; costUsd: number; turns: number; tools: string[] }

export async function summarize(messages: AsyncIterable<Msg>): Promise<Summary> {
  // TODO: loop with for await, collect tool names, read the result message
  return { result: null, costUsd: 0, turns: 0, tools: [] }
}

// Scripted stand-in for query()
async function* fakeQuery(): AsyncGenerator<Msg> {
  yield { type: "system", subtype: "init", model: "claude-opus-5", tools: ["Read", "Grep", "Edit"] }
  yield { type: "assistant", message: { content: [{ type: "tool_use", id: "1", name: "Grep", input: {} }] } }
  yield { type: "assistant", message: { content: [{ type: "text", text: "Found it." }, { type: "tool_use", id: "2", name: "Read", input: {} }] } }
  yield { type: "result", subtype: "success", result: "Two TODOs left.", num_turns: 3, total_cost_usd: 0.02, is_error: false }
}

console.log(await summarize(fakeQuery()))
```

```typescript solution
export type Block = { type: "text"; text: string } | { type: "tool_use"; id: string; name: string; input: unknown }
export type Msg =
  | { type: "system"; subtype: "init"; model: string; tools: string[] }
  | { type: "assistant"; message: { content: Block[] } }
  | { type: "user"; message: { content: unknown } }
  | { type: "result"; subtype: "success"; result: string; num_turns: number; total_cost_usd: number; is_error: boolean }
  | { type: "result"; subtype: "error_max_turns" | "error_during_execution"; num_turns: number; total_cost_usd: number; is_error: boolean }

export type Summary = { result: string | null; costUsd: number; turns: number; tools: string[] }

export async function summarize(messages: AsyncIterable<Msg>): Promise<Summary> {
  const tools: string[] = []
  const summary: Summary = { result: null, costUsd: 0, turns: 0, tools }
  for await (const m of messages) {
    if (m.type === "assistant") {
      for (const b of m.message.content) {
        if (b.type === "tool_use" && !tools.includes(b.name)) tools.push(b.name)
      }
    } else if (m.type === "result") {
      summary.costUsd = m.total_cost_usd
      summary.turns = m.num_turns
      summary.result = m.subtype === "success" ? m.result : null
    }
  }
  return summary
}

// Scripted stand-in for query()
async function* fakeQuery(): AsyncGenerator<Msg> {
  yield { type: "system", subtype: "init", model: "claude-opus-5", tools: ["Read", "Grep", "Edit"] }
  yield { type: "assistant", message: { content: [{ type: "tool_use", id: "1", name: "Grep", input: {} }] } }
  yield { type: "assistant", message: { content: [{ type: "text", text: "Found it." }, { type: "tool_use", id: "2", name: "Read", input: {} }] } }
  yield { type: "result", subtype: "success", result: "Two TODOs left.", num_turns: 3, total_cost_usd: 0.02, is_error: false }
}

console.log(await summarize(fakeQuery()))
```

```typescript check
async function* run(msgs: any[]) { for (const m of msgs) yield m }

const ok = await lesson.summarize(run([
  { type: "system", subtype: "init", model: "m", tools: ["Read", "Edit", "Bash"] },
  { type: "assistant", message: { content: [{ type: "text", text: "hi" }, { type: "tool_use", id: "a", name: "Read", input: {} }] } },
  { type: "user", message: { content: [] } },
  { type: "assistant", message: { content: [{ type: "tool_use", id: "b", name: "Bash", input: {} }, { type: "tool_use", id: "c", name: "Read", input: {} }] } },
  { type: "assistant", message: { content: [{ type: "tool_use", id: "d", name: "mcp__weather__get_temperature", input: {} }] } },
  { type: "result", subtype: "success", result: "All done.", num_turns: 4, total_cost_usd: 0.05, is_error: false },
]))
expect(ok.result === "All done.", `result should be the success message's result text, got ${JSON.stringify(ok.result)}`)
expect(ok.costUsd === 0.05 && ok.turns === 4, `costUsd/turns should come from total_cost_usd/num_turns, got ${ok.costUsd}/${ok.turns}`)
expect(JSON.stringify(ok.tools) === JSON.stringify(["Read", "Bash", "mcp__weather__get_temperature"]),
  `tools should be unique tool_use names in first-use order (not the init tools list), got ${JSON.stringify(ok.tools)}`)

const failed = await lesson.summarize(run([
  { type: "assistant", message: { content: [{ type: "tool_use", id: "a", name: "Grep", input: {} }] } },
  { type: "result", subtype: "error_max_turns", num_turns: 10, total_cost_usd: 0.3, is_error: true },
]))
expect(failed.result === null, "an error result (e.g. error_max_turns) has no result text, so result should be null")
expect(failed.turns === 10 && failed.costUsd === 0.3, "turns and cost should still be read from an error result")
```

**Reference:** [Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview), [Agent SDK reference - TypeScript](https://code.claude.com/docs/en/agent-sdk/typescript) and [Give Claude custom tools](https://code.claude.com/docs/en/agent-sdk/custom-tools) in the Claude Code docs, and [Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) in the Claude Platform docs.
