---
title: Resources & prompts
section: 4 · MCP
---

Tools are only one of the three server primitives. The other two, **resources** and **prompts**, answer a different question: *who decides when they're used?*

| Primitive | Who controls it | What it's for | In Claude Code |
| --- | --- | --- | --- |
| **Tools** | The **model** decides to call them | Actions: search flights, send a message, write a file | Claude calls `mcp__server__tool` |
| **Resources** | The **application** decides what to include | Read-only context: a file, a DB schema, API docs | You type `@server:uri` to attach one |
| **Prompts** | The **user** picks them explicitly | Reusable templates: "review this code", "plan a trip" | You run `/mcp__server__prompt` |

Picking the right one matters. If you want Claude to *act*, write a tool. If you have data a person (or the app) might want to pull into the conversation as context, make it a resource. If your team keeps typing the same long instruction, ship it as a prompt.

## Static resources

A resource has a unique **URI** and a MIME type. `registerResource` takes a name, the URI, metadata, and a read callback that returns `contents`:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"

const server = new McpServer({ name: "db", version: "1.0.0" })

server.registerResource(
  "schema",
  "schema://main",
  { title: "Database schema", description: "Tables in the main database", mimeType: "text/plain" },
  async (uri) => ({
    contents: [{ uri: uri.href, text: "users(id, email)\norders(id, user_id, total)" }],
  })
)

const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
const client = new Client({ name: "demo", version: "1.0.0" })
await server.connect(serverSide)
await client.connect(clientSide)

const { resources } = await client.listResources() // resources/list
console.log(resources.map((r) => `${r.name} -> ${r.uri}`))

const read = await client.readResource({ uri: "schema://main" }) // resources/read
const first = read.contents[0]
if (first && "text" in first) console.log(first.text)
await client.close()
```

The callback receives the URI as a `URL`, so `uri.href` gives the string back. Text goes in `text`; binary data would go in `blob` as base64.

## Resource templates

A fixed URI covers one thing. For a family of things (every user, every city) use a **resource template**: a URI with `{placeholders}`. Clients find templates with `resources/templates/list`, fill in the values, and read the result like any other resource. The callback gets the filled-in variables:

```typescript
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"

const forecasts: Record<string, string> = { paris: "Rain, 14°C", phnompenh: "Sunny, 33°C" }
const server = new McpServer({ name: "weather", version: "1.0.0" })

server.registerResource(
  "forecast",
  new ResourceTemplate("weather://forecast/{city}", { list: undefined }),
  { title: "Forecast for a city", mimeType: "text/plain" },
  async (uri, { city }) => ({
    contents: [{ uri: uri.href, text: forecasts[String(city)] ?? `No forecast for ${city}` }],
  })
)

const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
const client = new Client({ name: "demo", version: "1.0.0" })
await server.connect(serverSide)
await client.connect(clientSide)

const { resourceTemplates } = await client.listResourceTemplates()
console.log(resourceTemplates.map((t) => t.uriTemplate))

for (const city of ["paris", "phnompenh"]) {
  const { contents } = await client.readResource({ uri: `weather://forecast/${city}` })
  const first = contents[0]
  if (first && "text" in first) console.log(city, "->", first.text)
}
await client.close()
```

`{ list: undefined }` means "this template has no list of concrete resources to show". You can pass a `list` callback instead if you want every city to appear in `resources/list` too.

> 💡 **Tip:** resources are meant to be cheap reads. Don't hide side effects (sending mail, writing rows) in a read callback; that's what tools are for.

## Prompts

A prompt is a named template that returns ready-made **messages**. It can take arguments, declared as a zod shape in `argsSchema`. The client calls `prompts/get` with the arguments and gets messages back to send to the model:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { z } from "zod"

const server = new McpServer({ name: "reviewer", version: "1.0.0" })

server.registerPrompt(
  "review-code",
  {
    title: "Code Review",
    description: "Review code for best practices and potential issues",
    argsSchema: { code: z.string() },
  },
  ({ code }) => ({
    messages: [{ role: "user", content: { type: "text", text: `Please review this code:\n\n${code}` } }],
  })
)

const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
const client = new Client({ name: "demo", version: "1.0.0" })
await server.connect(serverSide)
await client.connect(clientSide)

const { prompts } = await client.listPrompts() // prompts/list
console.log(JSON.stringify(prompts))

const { messages } = await client.getPrompt({ name: "review-code", arguments: { code: "let x = 1" } }) // prompts/get
const first = messages[0]
if (first && first.content.type === "text") console.log(first.role, "|", first.content.text)
await client.close()
```

Prompt arguments are always strings on the wire, so use `z.string()` for them. In Claude Code, this prompt would appear in the `/` menu as `/reviewer:review-code (MCP)`, and typing `/mcp__reviewer__review-code` followed by the argument would run it. Claude Code splits arguments on whitespace, so each argument is one token.

## Challenge

> 🎯 **Challenge:** In `createServer()`, add a static resource named `style-guide` at URI `docs://style-guide` (MIME type `text/markdown`) whose text contains the word `tabs`. Then add a prompt named `commit-message` with one argument `change` that returns a single `user` message containing `Write a commit message for: <change>`.

```typescript starter
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

export function createServer() {
  const server = new McpServer({ name: "team-docs", version: "1.0.0" })
  // add the style-guide resource here

  // add the commit-message prompt here

  return server
}

console.log("Server ready:", createServer().isConnected() === false)
```

```typescript solution
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

export function createServer() {
  const server = new McpServer({ name: "team-docs", version: "1.0.0" })

  server.registerResource(
    "style-guide",
    "docs://style-guide",
    { title: "Team style guide", mimeType: "text/markdown" },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: "text/markdown", text: "# Style\n\n- Indent with tabs.\n- Keep functions short." }],
    })
  )

  server.registerPrompt(
    "commit-message",
    { description: "Draft a commit message", argsSchema: { change: z.string() } },
    ({ change }) => ({
      messages: [{ role: "user", content: { type: "text", text: `Write a commit message for: ${change}` } }],
    })
  )

  return server
}

console.log("Server ready:", createServer().isConnected() === false)
```

```typescript check
const { Client } = await import("@modelcontextprotocol/sdk/client/index.js")
const { InMemoryTransport } = await import("@modelcontextprotocol/sdk/inMemory.js")
const [c, s] = InMemoryTransport.createLinkedPair()
const client = new Client({ name: "check", version: "1.0.0" })
await lesson.createServer().connect(s)
await client.connect(c)

const caps = client.getServerCapabilities() ?? {}
expect(caps.resources !== undefined, "The server has no resources. Register docs://style-guide with registerResource.")
const { resources } = await client.listResources()
const res = resources.find((r) => r.uri === "docs://style-guide")
expect(res !== undefined, `Expected a resource at docs://style-guide, found: ${resources.map((r) => r.uri).join(", ") || "none"}`)
expect(res.name === "style-guide", `The resource should be named "style-guide", got "${res.name}"`)
expect(res.mimeType === "text/markdown", `The resource's mimeType should be "text/markdown", got "${res.mimeType}"`)
const read = await client.readResource({ uri: "docs://style-guide" })
const body = read.contents[0]
expect(body !== undefined && "text" in body && /tabs/.test(String(body.text)), "Reading docs://style-guide should return text that mentions tabs")

expect(caps.prompts !== undefined, "The server has no prompts. Register commit-message with registerPrompt.")
const { prompts } = await client.listPrompts()
const p = prompts.find((x) => x.name === "commit-message")
expect(p !== undefined, `Expected a prompt named "commit-message", found: ${prompts.map((x) => x.name).join(", ") || "none"}`)
expect(p.arguments?.some((a) => a.name === "change") === true, "commit-message should take an argument named \"change\"")
const got = await client.getPrompt({ name: "commit-message", arguments: { change: "fix login redirect" } })
const m = got.messages[0]
expect(got.messages.length === 1 && m !== undefined && m.role === "user", "getPrompt should return exactly one user message")
expect(m.content.type === "text" && m.content.text.includes("Write a commit message for: fix login redirect"), "The message text should be \"Write a commit message for: fix login redirect\"")
await client.close()
```

**Reference:** [Understanding MCP servers](https://modelcontextprotocol.io/docs/learn/server-concepts) in the MCP docs, and the [server guide](https://github.com/modelcontextprotocol/typescript-sdk/blob/v1.x/docs/server.md) of the MCP TypeScript SDK (v1.x).
