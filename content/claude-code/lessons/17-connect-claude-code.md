---
title: Connect a server to Claude Code
section: 4 · MCP
---

So far your servers talked to a client in the same file. To let **Claude Code** use one, you run it as its own program and tell Claude Code how to start it. The usual way for a local server is the **stdio** transport: Claude Code launches your server as a child process and exchanges JSON-RPC messages over its standard input and output.

## A real stdio server

Here's a complete server file. The only new piece is `StdioServerTransport`; the tool is the same kind you wrote in lesson 15:

```typescript-snippet
// src/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"

const server = new McpServer({ name: "team-tools", version: "1.0.0" })

server.registerTool(
  "word_count",
  {
    description: "Count the words in a piece of text",
    inputSchema: { text: z.string().describe("The text to count") },
  },
  async ({ text }) => ({
    content: [{ type: "text", text: `${text.split(/\s+/).filter(Boolean).length} words` }],
  })
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error("team-tools MCP server running on stdio") // stderr, never stdout
}

main().catch((error) => {
  console.error("Fatal error in main():", error)
  process.exit(1)
})
```

Build it with `tsc` (with `"type": "module"` in `package.json`), and you have `build/index.js` that any MCP host can start.

## Log to stderr, never stdout

On stdio, **stdout is the protocol channel**. Every byte your server writes there must be a JSON-RPC message. A stray `console.log("got request")` lands in the middle of that stream, the client can't parse it, and your server breaks in confusing ways.

| Do | Don't |
| --- | --- |
| `console.error("Server started")` (goes to stderr) | `console.log("Server started")` (goes to stdout) |
| A logging library configured to write to stderr or a file | A library that prints to stdout by default |

This only applies to stdio servers. An HTTP server can log to stdout freely, because its messages travel over HTTP instead.

## Add it with `claude mcp add`

For a stdio server, the syntax is:

```bash
claude mcp add [options] <name> -- <command> [args...]
```

The `--` matters: everything before it is an option for Claude Code (`--transport`, `--env`, `--scope`); everything after it is the command that starts your server, passed through untouched.

```bash
# Add your server (local scope is the default)
claude mcp add --transport stdio team-tools -- node /absolute/path/to/build/index.js

# Pass an environment variable to the server
claude mcp add --env API_KEY=your-key --transport stdio team-tools -- node /absolute/path/to/build/index.js

# Manage servers
claude mcp list
claude mcp get team-tools
claude mcp remove team-tools
```

> 💡 **Tip:** put at least one other option (like `--transport stdio`) between `--env` and the server name. `--env` takes several `KEY=value` pairs, so a name right after it is read as another pair and rejected.

## Scopes: who gets the server?

The `--scope` flag decides where the config is stored and who sees it:

| Scope | Loads in | Shared with team | Stored in |
| --- | --- | --- | --- |
| `local` (default) | Current project only | No | `~/.claude.json` |
| `project` | Current project only | Yes, via version control | `.mcp.json` in the project root |
| `user` | All your projects | No | `~/.claude.json` |

Pick **local** for personal or experimental servers and anything with private credentials. Pick **project** when the whole team should get the server: commit the `.mcp.json`. Pick **user** for a personal utility you want everywhere.

If the same server name is defined in more than one scope, Claude Code uses one definition in this order: local, then project, then user. Whole entries win; fields aren't merged.

## The `.mcp.json` file

`claude mcp add --scope project ...` writes `.mcp.json` for you, but it's plain JSON you can edit. Each key under `mcpServers` is a server name:

```json
{
  "mcpServers": {
    "team-tools": {
      "type": "stdio",
      "command": "node",
      "args": ["./tools/build/index.js"],
      "env": {
        "API_KEY": "${API_KEY}"
      }
    },
    "docs": {
      "type": "http",
      "url": "https://mcp.example.com/mcp",
      "headers": {
        "Authorization": "Bearer ${DOCS_TOKEN}"
      }
    }
  }
}
```

- A stdio entry has `command`, optional `args` and `env`.
- A remote entry has `"type": "http"` and a `url`, plus optional `headers`. An entry with a `url` but no `type` is a config error, because Claude Code treats an entry without `type` as stdio.
- `${VAR}` expands an environment variable, and `${VAR:-default}` falls back to a default. That's how you commit the file without committing secrets.

For safety, Claude Code asks you to approve project-scoped servers from `.mcp.json` before using them in an interactive session. `claude mcp reset-project-choices` resets those choices.

## Check it inside a session

Run `/mcp` inside Claude Code. It opens a panel that shows every configured server and its connection status, and lets you reconnect a server, turn it on or off, and sign in to remote servers. Once connected, your tool is available to Claude as `mcp__team-tools__word_count`.

If a server fails to connect, check stderr output first: that's where your `console.error` logs go.

## Helpful validation errors

A server's input schema is its first line of defence. When zod rejects an argument, the v1 SDK returns an `isError: true` result that includes your zod message, so write messages that tell the model how to fix the call:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { z } from "zod"

const server = new McpServer({ name: "timer", version: "1.0.0" })
server.registerTool(
  "set_timer",
  {
    description: "Start a timer",
    inputSchema: {
      minutes: z.number().int().min(1, "minutes must be at least 1").max(120, "minutes can be at most 120; split longer timers"),
    },
  },
  async ({ minutes }) => ({ content: [{ type: "text", text: `Timer set for ${minutes} min` }] })
)

const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
const client = new Client({ name: "demo", version: "1.0.0" })
await server.connect(serverSide)
await client.connect(clientSide)

for (const minutes of [25, 300]) {
  const result = await client.callTool({ name: "set_timer", arguments: { minutes } })
  console.log(result.isError ? "ERROR" : "OK", JSON.stringify(result.content))
}
await client.close()
```

Some rules can't live in the schema, such as "that name is already taken". Check those in the handler and return `isError: true` yourself.

## Challenge

> 🎯 **Challenge:** In `createServer()`, register a `create_branch` tool with input `name`. Validate it with zod so it only accepts lowercase letters, digits and dashes, with the error message `Use lowercase letters, digits and dashes, like fix-login-bug`. In the handler, if the name is already in `existingBranches`, return `isError: true` with text that includes `already exists`. Otherwise return the text `Created branch <name>`.

```typescript starter
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { z } from "zod"

export const existingBranches = ["main", "develop"]

export function createServer() {
  const server = new McpServer({ name: "git-helper", version: "1.0.0" })
  server.registerTool(
    "create_branch",
    { description: "Create a git branch", inputSchema: { name: z.string() } },
    async ({ name }) => ({ content: [{ type: "text", text: `Created branch ${name}` }] })
  )
  return server
}

const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
const client = new Client({ name: "demo", version: "1.0.0" })
await createServer().connect(serverSide)
await client.connect(clientSide)
for (const name of ["fix-login-bug", "Fix Login", "main"]) {
  console.log(JSON.stringify(await client.callTool({ name: "create_branch", arguments: { name } })))
}
await client.close()
```

```typescript solution
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { z } from "zod"

export const existingBranches = ["main", "develop"]

export function createServer() {
  const server = new McpServer({ name: "git-helper", version: "1.0.0" })
  server.registerTool(
    "create_branch",
    {
      description: "Create a git branch",
      inputSchema: {
        name: z
          .string()
          .regex(/^[a-z0-9-]+$/, "Use lowercase letters, digits and dashes, like fix-login-bug")
          .describe("The new branch name"),
      },
    },
    async ({ name }) => {
      if (existingBranches.includes(name)) {
        return {
          isError: true,
          content: [{ type: "text", text: `Branch ${name} already exists. Pick a different name.` }],
        }
      }
      return { content: [{ type: "text", text: `Created branch ${name}` }] }
    }
  )
  return server
}

const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
const client = new Client({ name: "demo", version: "1.0.0" })
await createServer().connect(serverSide)
await client.connect(clientSide)
for (const name of ["fix-login-bug", "Fix Login", "main"]) {
  console.log(JSON.stringify(await client.callTool({ name: "create_branch", arguments: { name } })))
}
await client.close()
```

```typescript check
const { Client } = await import("@modelcontextprotocol/sdk/client/index.js")
const { InMemoryTransport } = await import("@modelcontextprotocol/sdk/inMemory.js")
const [c, s] = InMemoryTransport.createLinkedPair()
const client = new Client({ name: "check", version: "1.0.0" })
await lesson.createServer().connect(s)
await client.connect(c)
const call = (name: string) => client.callTool({ name: "create_branch", arguments: { name } })
const textOf = (r: unknown) => ((r as { content?: { text?: string }[] }).content?.[0]?.text ?? "")

const ok = await call("add-search")
expect(!ok.isError && textOf(ok) === "Created branch add-search", `A valid name should give "Created branch add-search", got ${JSON.stringify(ok)}`)

const bad = await call("Add Search")
expect(bad.isError === true, "\"Add Search\" has capitals and a space: the call should come back with isError: true")
expect(textOf(bad).includes("Use lowercase letters, digits and dashes, like fix-login-bug"), `The validation error should include your zod message, got "${textOf(bad)}"`)

const taken = await call("develop")
expect(taken.isError === true, "\"develop\" already exists: return isError: true from the handler")
expect(textOf(taken).includes("already exists"), `The duplicate-name error should say it "already exists", got "${textOf(taken)}"`)
await client.close()
```

**Reference:** [Connect Claude Code to tools via MCP](https://code.claude.com/docs/en/mcp) in the Claude Code docs, and [Build an MCP server](https://modelcontextprotocol.io/docs/develop/build-server) in the MCP docs.
