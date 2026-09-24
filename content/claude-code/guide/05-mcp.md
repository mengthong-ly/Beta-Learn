---
title: MCP
section: Guide Book
summary: One protocol between a host and a capability provider — servers, transports, the three primitives, and where the trust boundary sits.
---
The Model Context Protocol solves an N×M problem. Without it, every agent needs a bespoke integration with every system. With it, a server implements the protocol once and every MCP-speaking host can use it.

```text
┌──────────── host (Claude Code, an IDE, your app) ────────────┐
│                                                               │
│   ┌── client ──┐   ┌── client ──┐   ┌── client ──┐            │
└───┼────────────┼───┼────────────┼───┼────────────┼────────────┘
    │            │   │            │   │            │
  stdio        stdio            HTTP              HTTP
    │            │                │                │
 ┌──▼──┐      ┌──▼──┐          ┌──▼──┐          ┌──▼──┐
 │ git │      │files│          │Linear│         │ your │
 └─────┘      └─────┘          └─────┘          └─────┘
```

One host, many clients, one client per server. The model never talks to a server directly — the host does, and hands results to the model as tool results.

## The three primitives

| Primitive | Controlled by | Analogy |
| --- | --- | --- |
| **Tools** | the model | a function the model may call |
| **Resources** | the host/user | a file the host may read and attach |
| **Prompts** | the user | a slash command the user may invoke |

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { z } from "zod"

const server = new McpServer({ name: "demo", version: "1.0.0" })

// A TOOL — the model decides to call it.
server.registerTool(
  "word_count",
  {
    title: "Word count",
    description: "Count the words in a piece of text. Use when the user asks how long something is.",
    inputSchema: { text: z.string().describe("The text to measure") },
  },
  async ({ text }) => ({
    content: [{ type: "text", text: `${text.trim().split(/\s+/).length} words` }],
  }),
)

const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
const client = new Client({ name: "guide", version: "1.0.0" })
await server.connect(serverSide)
await client.connect(clientSide)

const { tools } = await client.listTools()
console.log("tools:", tools.map((t) => t.name).join(", "))
console.log(JSON.stringify(await client.callTool({ name: "word_count", arguments: { text: "one two three" } })))

await client.close()
```

## Resources and prompts

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { z } from "zod"

const server = new McpServer({ name: "docs", version: "1.0.0" })

// A RESOURCE — the host reads it; the model does not choose to.
server.registerResource(
  "style-guide",
  "docs://style-guide",
  { title: "Style guide", description: "The team's writing conventions", mimeType: "text/markdown" },
  async (uri) => ({
    contents: [{ uri: uri.href, text: "# Style\n\n- British spelling\n- No exclamation marks\n" }],
  }),
)

// A PROMPT — the user invokes it, usually as a slash command.
server.registerPrompt(
  "review",
  {
    title: "Review a diff",
    description: "Review a diff against the team's checklist",
    argsSchema: { diff: z.string().describe("The unified diff to review") },
  },
  ({ diff }) => ({
    messages: [
      {
        role: "user",
        content: { type: "text", text: `Review this diff for correctness and style:\n\n${diff}` },
      },
    ],
  }),
)

const [c, s] = InMemoryTransport.createLinkedPair()
const client = new Client({ name: "guide", version: "1.0.0" })
await server.connect(s)
await client.connect(c)

console.log("resources:", (await client.listResources()).resources.map((r) => r.uri).join(", "))
console.log("prompts:  ", (await client.listPrompts()).prompts.map((p) => p.name).join(", "))

const read = await client.readResource({ uri: "docs://style-guide" })
console.log("resource body:", JSON.stringify(read.contents[0]))

await client.close()
```

> 🔍 **Behind the scenes: why the split matters**
>
> The three primitives differ by **who is in control**, and that is a security boundary rather than a taxonomy. A tool is model-controlled: the model can decide to call it with arguments it chose, so a tool that deletes things is a tool the model can decide to delete things with. A resource is host-controlled: the host attaches it, and the model cannot cause one to be read. A prompt is user-controlled. When you are deciding which primitive fits, ask who should be allowed to trigger it — not which one is technically easiest.

## Transports

```typescript
const transports = [
  {
    name: "stdio",
    where: "a subprocess on the same machine",
    auth: "OS process permissions",
    use: "local tools — git, the filesystem, a database on localhost",
  },
  {
    name: "Streamable HTTP",
    where: "a remote server",
    auth: "OAuth 2.1, or a bearer token",
    use: "hosted services — an issue tracker, a SaaS API",
  },
]

for (const t of transports) {
  console.log(`${t.name}\n  runs: ${t.where}\n  auth: ${t.auth}\n  use:  ${t.use}\n`)
}
```

`stdio` is a child process speaking JSON-RPC over stdin/stdout — no network, no ports, and it inherits the user's local permissions. Streamable HTTP is for anything remote, and it needs real authentication and real authorisation.

## Errors: protocol versus tool

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { z } from "zod"

const server = new McpServer({ name: "demo", version: "1.0.0" })

server.registerTool(
  "divide",
  {
    title: "Divide",
    description: "Divide a by b.",
    inputSchema: { a: z.number(), b: z.number() },
  },
  async ({ a, b }) => {
    if (b === 0) {
      // A TOOL error: the model sees it and can recover.
      return { isError: true, content: [{ type: "text", text: "Cannot divide by zero. Pass a non-zero b." }] }
    }
    return { content: [{ type: "text", text: String(a / b) }] }
  },
)

const [c, s] = InMemoryTransport.createLinkedPair()
const client = new Client({ name: "guide", version: "1.0.0" })
await server.connect(s)
await client.connect(c)

console.log(JSON.stringify(await client.callTool({ name: "divide", arguments: { a: 10, b: 2 } })))
console.log(JSON.stringify(await client.callTool({ name: "divide", arguments: { a: 10, b: 0 } })))

// A PROTOCOL error: the call itself was invalid. It throws.
try {
  await client.callTool({ name: "does_not_exist", arguments: {} })
} catch (e) {
  console.log("protocol error:", (e as Error).message.slice(0, 60))
}

await client.close()
```

> ⚠️ The distinction matters. `isError: true` goes back to the **model**, which can read it and try something else. A thrown protocol error goes back to the **host**, which usually surfaces it to the user. A missing file is a tool error; a malformed request is a protocol error. Getting this backwards means either the model never learns what went wrong, or the user sees a stack trace for a routine condition.

## Connecting a server to Claude Code

```typescript
// .mcp.json in a project — checked in, so the whole team gets the same servers.
const config = {
  mcpServers: {
    filesystem: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "./src"],
    },
    linear: {
      type: "http",
      url: "https://mcp.linear.app/mcp",
    },
  },
}

console.log(JSON.stringify(config, null, 2))
console.log("\nscopes: local (just you) · project (.mcp.json, the team) · user (all your projects)")
```

Tools from a server appear to the model as `mcp__<server>__<tool>` — which is worth knowing when you are writing a permission rule or reading a transcript.

## The trust boundary

```typescript
type Source = { origin: string; trusted: boolean; note: string }

const sources: Source[] = [
  { origin: "the user, in the conversation", trusted: true, note: "the only source of instructions" },
  { origin: "an MCP tool result", trusted: false, note: "data — may contain text aimed at the model" },
  { origin: "an MCP resource", trusted: false, note: "data — the host chose to attach it, not to vouch for it" },
  { origin: "a tool DESCRIPTION from a third-party server", trusted: false, note: "loaded into context; a hostile server can write anything there" },
]

for (const s of sources) {
  console.log(`${s.trusted ? "TRUSTED  " : "UNTRUSTED"} ${s.origin.padEnd(42)} ${s.note}`)
}
```

That last row is the one people miss: installing a third-party MCP server puts *its* text into your context. Everything a server returns — and everything it *declares* — is untrusted input. The [prompt injection](/claude-code/guide/prompt-injection) chapter is about what follows from that.

**Reference:** [Model Context Protocol](https://modelcontextprotocol.io) and [MCP in Claude Code](https://docs.claude.com/en/docs/claude-code/mcp).
