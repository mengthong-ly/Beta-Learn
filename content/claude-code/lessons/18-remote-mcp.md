---
title: Remote MCP servers
section: 4 · MCP
---

A stdio server lives on one machine and serves one client. That's great for personal tools, but a team (or a company offering an MCP server to customers) wants one server that **many** clients reach over the network. That's a **remote** MCP server, and it uses the **Streamable HTTP** transport.

## Streamable HTTP

With Streamable HTTP, the server exposes one HTTP endpoint (often `/mcp`):

- The client sends every JSON-RPC message as an HTTP **POST** to that endpoint.
- The server replies with plain JSON, or opens a Server-Sent Events stream when it has several messages to send back.
- The server may hand out a session id in an `Mcp-Session-Id` header; the client then sends it back on later requests.

Your tools don't change at all. Only the transport does. The example below runs a real `StreamableHTTPClientTransport` against a real server transport. Instead of opening a port, the client's `fetch` hands each `Request` straight to the server, so you can see the HTTP traffic without a network:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import { z } from "zod"

const server = new McpServer({ name: "remote-demo", version: "1.0.0" })
server.registerTool("echo", { inputSchema: { text: z.string() } }, async ({ text }) => ({
  content: [{ type: "text", text }],
}))
const serverTransport = new WebStandardStreamableHTTPServerTransport({
  sessionIdGenerator: () => crypto.randomUUID(),
  enableJsonResponse: true, // plain JSON replies instead of SSE streams
})
await server.connect(serverTransport)

const TOKEN = "demo-token"

// Stands in for the network: checks the bearer token like a real server would.
async function fakeNetwork(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const req = new Request(input, init)
  const session = req.headers.get("mcp-session-id")
  console.log(req.method, new URL(req.url).pathname, session ? `session ${session.slice(0, 8)}…` : "(no session yet)")
  if (req.headers.get("authorization") !== `Bearer ${TOKEN}`) return new Response("Unauthorized", { status: 401 })
  return serverTransport.handleRequest(req)
}

const url = new URL("https://mcp.example.com/mcp")
const client = new Client({ name: "demo", version: "1.0.0" })
await client.connect(
  new StreamableHTTPClientTransport(url, {
    fetch: fakeNetwork,
    requestInit: { headers: { Authorization: `Bearer ${TOKEN}` } },
  })
)
console.log(await client.callTool({ name: "echo", arguments: { text: "hello over HTTP" } }))
await client.close()

const stranger = new Client({ name: "no-token", version: "1.0.0" })
try {
  await stranger.connect(new StreamableHTTPClientTransport(url, { fetch: fakeNetwork }))
} catch (e) {
  console.log("rejected:", e instanceof Error ? e.message : e)
}
```

In a real deployment you'd serve `serverTransport.handleRequest` from an HTTP framework, and the SDK's server guide has complete Express examples.

> 💡 **Tip:** the older **HTTP+SSE** transport is deprecated. Build new remote servers on Streamable HTTP.

## Auth at a high level

A remote server usually needs to know who's calling. MCP's authorization spec is built on **OAuth 2.1**, and it's optional (a public read-only server may skip it). It applies to HTTP transports only; a stdio server gets credentials from its environment instead.

The flow, simplified:

1. The client calls the server without a token and gets **401 Unauthorized**, with a `WWW-Authenticate` header that points to the server's metadata.
2. The client reads that metadata to find the **authorization server**, and sends the user through a browser sign-in.
3. The client gets an access token and sends `Authorization: Bearer <token>` on **every** request.
4. The server checks that the token was issued **for this server**. It must never pass the token on to other APIs.

In Claude Code you don't write any of this: add the server with `claude mcp add --transport http <name> <url>`, then run `/mcp` (or `claude mcp login <name>`) to sign in. Tokens are stored and refreshed for you.

## The MCP connector in the Messages API

Claude Code isn't the only way to reach a remote server. The Claude API's **MCP connector** lets the API itself connect to remote MCP servers, so your app doesn't need an MCP client at all. It's a beta feature, turned on with the `anthropic-beta: mcp-client-2025-11-20` header (the older `mcp-client-2025-04-04` version is deprecated).

A request has two parts:

- `mcp_servers`: how to reach each server. `type` is `"url"` (the only supported value), `url` must start with `https://`, `name` is a unique id, and `authorization_token` is optional (an OAuth token you obtained yourself).
- `tools`: one `mcp_toolset` entry per server, pointing back to it with `mcp_server_name`. It can turn tools on or off with `default_config` and per-tool `configs`.

This is a real call. It needs an API key, so it's shown but not run:

```typescript-snippet
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic()

const response = await anthropic.beta.messages.create({
  model: "claude-opus-5",
  max_tokens: 1000,
  messages: [{ role: "user", content: "What tools do you have available?" }],
  mcp_servers: [
    {
      type: "url",
      url: "https://example-server.modelcontextprotocol.io/sse",
      name: "example-mcp",
      authorization_token: "YOUR_TOKEN",
    },
  ],
  tools: [{ type: "mcp_toolset", mcp_server_name: "example-mcp" }],
  betas: ["mcp-client-2025-11-20"],
})
```

Things to know about the connector:

- It supports **tools only**, not resources or prompts.
- The server must be reachable over public HTTP (Streamable HTTP or SSE). It can't start a local stdio server.
- Every server in `mcp_servers` must be used by **exactly one** `mcp_toolset`, and every toolset must name a server that exists.

To turn tools on selectively (an **allowlist**), disable everything by default and enable the ones you want:

```json
{
  "type": "mcp_toolset",
  "mcp_server_name": "google-calendar-mcp",
  "default_config": { "enabled": false },
  "configs": {
    "search_events": { "enabled": true },
    "create_event": { "enabled": true }
  }
}
```

## Reading the response

When Claude uses an MCP tool through the connector, the API runs the call for you. The response then contains two new block types: `mcp_tool_use` (what Claude called) and `mcp_tool_result` (what the server returned). Here a **scripted fake response** stands in for the real API, shaped like the documented blocks:

```typescript
type Block =
  | { type: "text"; text: string }
  | { type: "mcp_tool_use"; id: string; name: string; server_name: string; input: Record<string, unknown> }
  | { type: "mcp_tool_result"; tool_use_id: string; is_error: boolean; content: { type: "text"; text: string }[] }

// A stand-in for anthropic.beta.messages.create(...)
function fakeCreate(): { content: Block[]; stop_reason: string } {
  return {
    stop_reason: "end_turn",
    content: [
      { type: "mcp_tool_use", id: "mcptoolu_01", name: "search_events", server_name: "calendar", input: { query: "standup" } },
      { type: "mcp_tool_result", tool_use_id: "mcptoolu_01", is_error: false, content: [{ type: "text", text: "Standup, Mon 09:00" }] },
      { type: "text", text: "Your next standup is Monday at 09:00." },
    ],
  }
}

for (const block of fakeCreate().content) {
  if (block.type === "mcp_tool_use") console.log(`→ ${block.server_name}.${block.name}(${JSON.stringify(block.input)})`)
  else if (block.type === "mcp_tool_result") console.log(`← ${block.is_error ? "ERROR " : ""}${block.content.map((c) => c.text).join(" ")}`)
  else console.log("Claude:", block.text)
}
```

Unlike your own tools, there's no `tool_result` for you to send back: the loop already happened on Anthropic's side.

## Private servers: MCP tunnels

The connector needs a public URL. If your MCP server sits inside a private network, **MCP tunnels** (a research preview) let Claude reach it over an outbound-only connection, so you don't open inbound firewall ports. You then pass the tunnel's URL in `mcp_servers` like any other server. Only connect to servers you trust: a remote MCP server sees the data Claude sends to its tools.

## Challenge

> 🎯 **Challenge:** Write `buildMcpParams(servers)` that turns a list of servers into the connector's `mcp_servers` and `tools` params. Each server becomes `{ type: "url", url, name }`, plus `authorization_token` only when a `token` is given. Each gets one `mcp_toolset`; if `allowTools` is given, use the allowlist pattern (`default_config: { enabled: false }` and `configs` enabling each tool). Throw an `Error` if a URL doesn't start with `https://` or if two servers share a name, and put the bad URL or name in the message.

```typescript starter
export type ServerInput = { name: string; url: string; token?: string; allowTools?: string[] }

export type McpServerParam = { type: "url"; url: string; name: string; authorization_token?: string }
export type McpToolset = {
  type: "mcp_toolset"
  mcp_server_name: string
  default_config?: { enabled?: boolean }
  configs?: Record<string, { enabled?: boolean }>
}

export function buildMcpParams(servers: ServerInput[]): { mcp_servers: McpServerParam[]; tools: McpToolset[] } {
  return { mcp_servers: [], tools: [] }
}

console.log(
  JSON.stringify(
    buildMcpParams([
      { name: "docs", url: "https://mcp.example.com/mcp" },
      { name: "calendar", url: "https://cal.example.com/mcp", token: "abc", allowTools: ["search_events"] },
    ]),
    null,
    2
  )
)
```

```typescript solution
export type ServerInput = { name: string; url: string; token?: string; allowTools?: string[] }

export type McpServerParam = { type: "url"; url: string; name: string; authorization_token?: string }
export type McpToolset = {
  type: "mcp_toolset"
  mcp_server_name: string
  default_config?: { enabled?: boolean }
  configs?: Record<string, { enabled?: boolean }>
}

export function buildMcpParams(servers: ServerInput[]): { mcp_servers: McpServerParam[]; tools: McpToolset[] } {
  const seen = new Set<string>()
  const mcp_servers: McpServerParam[] = []
  const tools: McpToolset[] = []

  for (const s of servers) {
    if (!s.url.startsWith("https://")) throw new Error(`Server "${s.name}": url must start with https:// (got ${s.url})`)
    if (seen.has(s.name)) throw new Error(`Duplicate server name "${s.name}": each name must be unique`)
    seen.add(s.name)

    const server: McpServerParam = { type: "url", url: s.url, name: s.name }
    if (s.token) server.authorization_token = s.token
    mcp_servers.push(server)

    const toolset: McpToolset = { type: "mcp_toolset", mcp_server_name: s.name }
    if (s.allowTools) {
      toolset.default_config = { enabled: false }
      toolset.configs = Object.fromEntries(s.allowTools.map((t) => [t, { enabled: true }]))
    }
    tools.push(toolset)
  }
  return { mcp_servers, tools }
}

console.log(
  JSON.stringify(
    buildMcpParams([
      { name: "docs", url: "https://mcp.example.com/mcp" },
      { name: "calendar", url: "https://cal.example.com/mcp", token: "abc", allowTools: ["search_events"] },
    ]),
    null,
    2
  )
)
```

```typescript check
const build = lesson.buildMcpParams
const out = build([
  { name: "docs", url: "https://mcp.example.com/mcp" },
  { name: "calendar", url: "https://cal.example.com/mcp", token: "abc", allowTools: ["search_events", "list_events"] },
])
expect(out.mcp_servers.length === 2 && out.tools.length === 2, `Two servers should give 2 mcp_servers and 2 toolsets, got ${out.mcp_servers.length} and ${out.tools.length}`)
expect(
  JSON.stringify(out.mcp_servers[0]) === JSON.stringify({ type: "url", url: "https://mcp.example.com/mcp", name: "docs" }),
  `docs should be { type: "url", url, name } with no authorization_token, got ${JSON.stringify(out.mcp_servers[0])}`
)
expect(out.mcp_servers[1]?.authorization_token === "abc", "calendar has a token, so it needs authorization_token: \"abc\"")
const docsSet = out.tools.find((t) => t.mcp_server_name === "docs")
expect(docsSet !== undefined && docsSet.type === "mcp_toolset", "Each server needs an mcp_toolset whose mcp_server_name matches it (missing for docs)")
expect(docsSet.default_config === undefined && docsSet.configs === undefined, "Without allowTools, the toolset should have no default_config or configs (all tools enabled)")
const calSet = out.tools.find((t) => t.mcp_server_name === "calendar")
expect(calSet !== undefined, "Missing the mcp_toolset for calendar")
expect(calSet.default_config?.enabled === false, "With allowTools, set default_config: { enabled: false }")
expect(
  calSet.configs?.["search_events"]?.enabled === true && calSet.configs?.["list_events"]?.enabled === true,
  `With allowTools, configs should enable each listed tool, got ${JSON.stringify(calSet.configs)}`
)

let httpErr = ""
try { build([{ name: "local", url: "http://localhost:3000/mcp" }]) } catch (e) { httpErr = e instanceof Error ? e.message : String(e) }
expect(httpErr.includes("http://localhost:3000/mcp"), `A non-https URL should throw an Error that names the URL, got "${httpErr}"`)

let dupErr = ""
try {
  build([
    { name: "docs", url: "https://a.example.com/mcp" },
    { name: "docs", url: "https://b.example.com/mcp" },
  ])
} catch (e) { dupErr = e instanceof Error ? e.message : String(e) }
expect(dupErr.includes("docs"), `Two servers named "docs" should throw an Error that names "docs", got "${dupErr}"`)
```

**Reference:** [MCP connector](https://platform.claude.com/docs/en/agents-and-tools/mcp-connector) in the Claude API docs, and [Authorization](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization) in the MCP specification.
