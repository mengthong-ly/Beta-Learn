---
title: How MCP works
section: 4 · MCP
---

In the Tool Use lessons you wrote tools *inside* your own app. That works until you want the same GitHub or database tools in Claude Code, Claude Desktop, your IDE and your own agent. Rewriting them for every app is wasteful.

The **Model Context Protocol (MCP)** fixes this. It's an open protocol: you write a tool once as an **MCP server**, and any app that speaks MCP can use it. Claude Code is one of those apps.

## Host, client, server

MCP has three participants:

| Participant | What it is | Example |
| --- | --- | --- |
| **Host** | The AI application the user works in. It manages one or more clients. | Claude Code, Claude Desktop, VS Code |
| **Client** | A component inside the host that holds a connection to **one** server. | The object Claude Code creates for your GitHub server |
| **Server** | A program that provides context (tools, data, prompts) to clients. | A filesystem server, the Sentry server |

The rule to remember: **one client per server**. When Claude Code connects to three servers, it creates three clients, and each keeps its own dedicated connection.

A "local" server runs on your machine (Claude Code starts it as a child process). A "remote" server runs somewhere else and is reached over HTTP. Either way it's still called a server.

## The three server primitives

A server can offer three kinds of things. Each kind has a `*/list` method so the client can discover what's there:

| Primitive | What it is | Protocol methods |
| --- | --- | --- |
| **Tools** | Functions the model can call to do things (query a DB, call an API) | `tools/list`, `tools/call` |
| **Resources** | Read-only data for context (a file, a schema, a doc page) | `resources/list`, `resources/read` |
| **Prompts** | Reusable message templates (for example "review this code") | `prompts/list`, `prompts/get` |

Lessons 15 and 16 build each one.

## Two layers: JSON-RPC over a transport

MCP is split into two layers:

- The **data layer** is the message format: [JSON-RPC 2.0](https://www.jsonrpc.org/). A request has an `id`, a `method` and `params`; the reply carries the same `id`. A **notification** has no `id` and gets no reply.
- The **transport layer** moves those messages. MCP defines two transports:
  - **stdio**: the host starts the server as a local process and they talk over standard input and output. No network involved.
  - **Streamable HTTP**: the client sends messages with HTTP POST, and the server can stream back with Server-Sent Events. This is how remote servers work, and it supports bearer tokens, API keys and custom headers. MCP recommends OAuth for getting tokens.

Because the data layer is the same everywhere, a server's code doesn't change when you swap transports. The SDK even ships an **in-memory transport** that links a client and a server in one process. It's made for tests, and it's what these lessons use so the real SDK runs inside a single lesson file.

A tool call on the wire looks like this:

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": { "name": "weather_current", "arguments": { "location": "San Francisco" } }
}
```

## Capability negotiation

Before they do any work, client and server agree on what each supports. With the protocol version this SDK speaks (`2025-11-25`), the client opens with an `initialize` request carrying its protocol version, its **capabilities** and its name. The server answers with its own version, capabilities (for example `tools`, `resources`, `prompts`) and name. Then the client sends a `notifications/initialized` notification, and normal work starts.

You don't write any of that yourself: `client.connect()` does it. Here's a real server and client, with the client's outgoing messages printed so you can watch the handshake:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js"
import { z } from "zod"

const server = new McpServer({ name: "weather", version: "1.0.0" })
server.registerTool(
  "get_forecast",
  { description: "Get the forecast for a city", inputSchema: { city: z.string() } },
  async ({ city }) => ({ content: [{ type: "text", text: `${city}: sunny, 31°C` }] })
)

const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()

// Spy on what the client sends, just to see the JSON-RPC traffic.
const send = clientSide.send.bind(clientSide)
clientSide.send = async (message: JSONRPCMessage) => {
  console.log("client →", "method" in message ? message.method : "(response)")
  return send(message)
}

const client = new Client({ name: "demo-host", version: "1.0.0" })
await server.connect(serverSide)
await client.connect(clientSide) // initialize + notifications/initialized

console.log("server:", client.getServerVersion())
console.log("capabilities:", Object.keys(client.getServerCapabilities() ?? {}))

await client.close()
```

`getServerCapabilities()` returns what the server announced during the handshake. A host uses it to skip features a server doesn't have: no `prompts` capability, no `prompts/list` call.

> 💡 **Tip:** the newest spec revision (`2026-07-28`) makes MCP stateless: every request carries the version and capabilities in its `_meta` field, and an optional `server/discover` request replaces the handshake. The SDK hides this from you either way. The ideas (discover first, then use only what both sides support) stay the same.

## Discovering and calling tools

After connecting, a host lists each server's tools and hands them to the model. When the model picks one, the host routes the call to the right client:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { z } from "zod"

const server = new McpServer({ name: "math", version: "1.0.0" })
server.registerTool(
  "add",
  { description: "Add two numbers", inputSchema: { a: z.number(), b: z.number() } },
  async ({ a, b }) => ({ content: [{ type: "text", text: String(a + b) }] })
)

const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
const client = new Client({ name: "demo-host", version: "1.0.0" })
await server.connect(serverSide)
await client.connect(clientSide)

const { tools } = await client.listTools() // tools/list
for (const tool of tools) console.log(tool.name, "-", tool.description)
console.log(JSON.stringify(tools[0]?.inputSchema))

const result = await client.callTool({ name: "add", arguments: { a: 2, b: 3 } }) // tools/call
console.log(result.content)

await client.close()
```

Notice that the zod shape became a plain JSON Schema in `inputSchema`. That's what the model sees, the same kind of schema you wrote by hand in the Tool Use section.

## Claude Code as a host

Claude Code is an MCP host. For every server you configure (lesson 17), it creates a client, connects, and discovers the server's tools, prompts and resources. The tools then show up next to the built-in ones, named `mcp__<server>__<tool>`: a `search` tool on a server called `docs` becomes `mcp__docs__search`. You use that full name in permission rules and hooks.

## Challenge

> 🎯 **Challenge:** The server below is ready. Connect a `Client` to it with `InMemoryTransport`, call `listTools()`, and export the tool names as `toolNames`. Close the client when you're done.

```typescript starter
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { z } from "zod"

const server = new McpServer({ name: "notes", version: "1.0.0" })
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
server.registerTool("add_note", { inputSchema: { body: z.string() } }, async ({ body }) => text(`Saved: ${body}`))
server.registerTool("list_notes", { inputSchema: {} }, async () => text("(no notes)"))
server.registerTool("delete_note", { inputSchema: { id: z.number() } }, async ({ id }) => text(`Deleted ${id}`))

// Connect a client, list the tools, and fill this in.
export const toolNames: string[] = []

console.log(toolNames)
```

```typescript solution
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { z } from "zod"

const server = new McpServer({ name: "notes", version: "1.0.0" })
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
server.registerTool("add_note", { inputSchema: { body: z.string() } }, async ({ body }) => text(`Saved: ${body}`))
server.registerTool("list_notes", { inputSchema: {} }, async () => text("(no notes)"))
server.registerTool("delete_note", { inputSchema: { id: z.number() } }, async ({ id }) => text(`Deleted ${id}`))

const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
const client = new Client({ name: "my-host", version: "1.0.0" })
await server.connect(serverSide)
await client.connect(clientSide)

const { tools } = await client.listTools()
export const toolNames: string[] = tools.map((t) => t.name)

await client.close()
console.log(toolNames)
```

```typescript check
const names = lesson.toolNames
expect(Array.isArray(names), "Export toolNames as an array of strings")
expect(names.length === 3, `Expected 3 tool names from listTools(), got ${names.length}: ${JSON.stringify(names)}`)
for (const n of ["add_note", "list_notes", "delete_note"]) {
  expect(names.includes(n), `toolNames should include "${n}" (got ${JSON.stringify(names)})`)
}
```

**Reference:** [Architecture overview](https://modelcontextprotocol.io/docs/learn/architecture) in the MCP docs, and [Lifecycle](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle) in the MCP specification.
