---
title: Your first MCP tool
section: 4 · MCP
---

A **tool** is the MCP primitive you'll write most. It's a function the model can decide to call: search the docs, create a ticket, convert a file. In the TypeScript SDK you add one with `server.registerTool(name, config, handler)`.

## registerTool

The config describes the tool; the handler does the work:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { z } from "zod"

const server = new McpServer({ name: "text-tools", version: "1.0.0" })

server.registerTool(
  "shout",
  {
    title: "Shout",
    description: "Return the text in upper case. Use when the user wants emphasis.",
    inputSchema: { text: z.string().describe("The text to shout") },
  },
  async ({ text }) => ({
    content: [{ type: "text", text: text.toUpperCase() + "!" }],
  })
)

const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
const client = new Client({ name: "demo", version: "1.0.0" })
await server.connect(serverSide)
await client.connect(clientSide)

const { tools } = await client.listTools()
console.log(JSON.stringify(tools[0]?.inputSchema))
console.log(await client.callTool({ name: "shout", arguments: { text: "ship it" } }))
await client.close()
```

What each part does:

| Part | Purpose |
| --- | --- |
| `name` | The id clients call it by. Keep it short and specific, like `search_issues`. |
| `title` | A friendly display name for UIs. |
| `description` | What the tool does and **when** to use it. The model reads this to decide. |
| `inputSchema` | A zod shape (an object of zod types). The SDK turns it into JSON Schema for `tools/list` and validates every call against it. |
| handler | Gets the **already validated, typed** arguments and returns a result. |

`.describe()` on a zod field becomes the `description` of that property in the JSON Schema, so the model knows what to pass.

## The result: a content array

A tool returns an object with a `content` array. Each item has a `type`; `"text"` is the most common, and MCP also supports images, audio and links to resources. The host passes that content back to the model as the tool result.

## When things go wrong: isError

The spec defines two kinds of failure:

- **Protocol errors** are JSON-RPC errors about the request itself: an unknown tool, a malformed request. The model can rarely fix these.
- **Tool execution errors** are normal results with `isError: true`: the API failed, the input was invalid (a date in the wrong format, a value out of range), or a business rule said no. The model **can** fix these, so the message should tell it how.

The host passes execution errors back to the model, which can then retry with better input. In the v1 SDK, an exception thrown by your handler becomes an `isError: true` result for you, and so do arguments that fail your zod schema:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { z } from "zod"

const users: Record<string, string> = { u1: "Ada", u2: "Linus" }
const server = new McpServer({ name: "users", version: "1.0.0" })

server.registerTool(
  "get_user",
  { description: "Look up a user by id", inputSchema: { id: z.string() } },
  async ({ id }) => {
    const name = users[id]
    if (!name) {
      return {
        isError: true,
        content: [{ type: "text", text: `No user "${id}". Known ids: ${Object.keys(users).join(", ")}` }],
      }
    }
    return { content: [{ type: "text", text: name }] }
  }
)

const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
const client = new Client({ name: "demo", version: "1.0.0" })
await server.connect(serverSide)
await client.connect(clientSide)

console.log(JSON.stringify(await client.callTool({ name: "get_user", arguments: { id: "u1" } })))
console.log(JSON.stringify(await client.callTool({ name: "get_user", arguments: { id: "u9" } })))
console.log(JSON.stringify(await client.callTool({ name: "get_user", arguments: { id: 42 } }))) // wrong type
await client.close()
```

> 💡 **Tip:** write error text for the model, not for a log file. "No user u9. Known ids: u1, u2" lets it recover on the next turn; "Error 404" doesn't.

## Structured output

Text is fine for the model, but sometimes the *host* wants data it can use directly. Add an `outputSchema` (another zod shape) and return the same data as `structuredContent`. The SDK checks your `structuredContent` against the schema. The spec suggests also returning the JSON as text, for clients that only read `content`:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { z } from "zod"

const server = new McpServer({ name: "health", version: "1.0.0" })

server.registerTool(
  "calculate_bmi",
  {
    description: "Calculate Body Mass Index",
    inputSchema: { weightKg: z.number(), heightM: z.number() },
    outputSchema: { bmi: z.number() },
  },
  async ({ weightKg, heightM }) => {
    const output = { bmi: Math.round((weightKg / (heightM * heightM)) * 10) / 10 }
    return {
      content: [{ type: "text", text: JSON.stringify(output) }],
      structuredContent: output,
    }
  }
)

const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
const client = new Client({ name: "demo", version: "1.0.0" })
await server.connect(serverSide)
await client.connect(clientSide)

const result = await client.callTool({ name: "calculate_bmi", arguments: { weightKg: 70, heightM: 1.75 } })
console.log(result.structuredContent)
await client.close()
```

## Challenge

> 🎯 **Challenge:** In `createServer()`, register a tool named `word_count` with input `{ text: string }` and output schema `{ words: number }`. Return the count as text (like `"3 words"`) **and** as `structuredContent: { words }`. If the text is empty or only spaces, return `isError: true` with a message that says the text is empty.

```typescript starter
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { z } from "zod"

export function createServer() {
  const server = new McpServer({ name: "text-tools", version: "1.0.0" })
  // register word_count here
  return server
}

// Try it with a real client:
const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
const client = new Client({ name: "demo", version: "1.0.0" })
await createServer().connect(serverSide)
await client.connect(clientSide)
console.log(JSON.stringify(await client.callTool({ name: "word_count", arguments: { text: "hello MCP world" } })))
await client.close()
```

```typescript solution
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { z } from "zod"

export function createServer() {
  const server = new McpServer({ name: "text-tools", version: "1.0.0" })
  server.registerTool(
    "word_count",
    {
      description: "Count the words in a piece of text",
      inputSchema: { text: z.string().describe("The text to count") },
      outputSchema: { words: z.number() },
    },
    async ({ text }) => {
      const words = text.split(/\s+/).filter(Boolean).length
      if (words === 0) {
        return { isError: true, content: [{ type: "text", text: "The text is empty. Pass at least one word." }] }
      }
      return {
        content: [{ type: "text", text: `${words} words` }],
        structuredContent: { words },
      }
    }
  )
  return server
}

// Try it with a real client:
const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
const client = new Client({ name: "demo", version: "1.0.0" })
await createServer().connect(serverSide)
await client.connect(clientSide)
console.log(JSON.stringify(await client.callTool({ name: "word_count", arguments: { text: "hello MCP world" } })))
await client.close()
```

```typescript check
const { Client } = await import("@modelcontextprotocol/sdk/client/index.js")
const { InMemoryTransport } = await import("@modelcontextprotocol/sdk/inMemory.js")
const [c, s] = InMemoryTransport.createLinkedPair()
const client = new Client({ name: "check", version: "1.0.0" })
await lesson.createServer().connect(s)
await client.connect(c)
const firstText = (r: unknown) => ((r as { content?: { text?: string }[] }).content?.[0]?.text ?? "")

const { tools } = await client.listTools()
const tool = tools.find((t) => t.name === "word_count")
expect(tool !== undefined, `Register a tool named "word_count" (found: ${tools.map((t) => t.name).join(", ") || "none"})`)
expect(tool.outputSchema !== undefined, "word_count should declare an outputSchema of { words: number }")

const ok = await client.callTool({ name: "word_count", arguments: { text: "one two  three" } })
expect(!ok.isError, `"one two  three" should succeed, got an error: ${firstText(ok)}`)
expect(JSON.stringify(ok.structuredContent) === JSON.stringify({ words: 3 }), `structuredContent should be { words: 3 }, got ${JSON.stringify(ok.structuredContent)}`)
expect(firstText(ok).includes("3"), `The text content should mention the count 3, got "${firstText(ok)}"`)

const empty = await client.callTool({ name: "word_count", arguments: { text: "   " } })
expect(empty.isError === true, "Blank text should return a result with isError: true")
expect(/empty/i.test(firstText(empty)), `The error message should say the text is empty, got "${firstText(empty)}"`)
await client.close()
```

**Reference:** [Tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools) in the MCP specification, and the [server guide](https://github.com/modelcontextprotocol/typescript-sdk/blob/v1.x/docs/server.md) of the MCP TypeScript SDK (v1.x).
