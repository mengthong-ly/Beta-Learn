---
title: Designing tools
section: Guide Book
summary: A tool is an interface for a reader who has never seen your codebase — naming, schemas, error messages, and how many tools is too many.
---
A tool definition is three things: a name, a description, and a JSON Schema. The model sees nothing else. Every design decision is therefore a documentation decision.

```typescript
import { z } from "zod"

const searchFiles = {
  name: "search_files",
  description:
    "Search file contents for a regular expression and return matching lines with " +
    "their file paths and line numbers. Use this to find where something is defined " +
    "or used. For listing files by name, use glob_files instead.",
  input_schema: {
    type: "object" as const,
    properties: {
      pattern: {
        type: "string",
        description: "A regular expression, e.g. 'function\\\\s+handle' or 'TODO'",
      },
      path: {
        type: "string",
        description: "Directory to search in. Defaults to the project root.",
      },
      max_results: {
        type: "number",
        description: "Maximum matches to return. Defaults to 50.",
      },
    },
    required: ["pattern"],
    additionalProperties: false,
  },
  strict: true,
}

console.log(searchFiles.name)
console.log(`description: ${searchFiles.description.length} chars`)
console.log(`required: ${searchFiles.input_schema.required.join(", ")}`)

// Zod is the ergonomic way to define the same schema in TypeScript.
const SearchInput = z.object({
  pattern: z.string().describe("A regular expression"),
  path: z.string().optional().describe("Directory to search in"),
  max_results: z.number().optional().describe("Maximum matches to return"),
})

const parsed = SearchInput.safeParse({ pattern: "TODO", max_results: 10 })
console.log("valid input:", parsed.success)
console.log("rejects a bad input:", !SearchInput.safeParse({ max_results: 10 }).success)
```

## The description is the documentation

> 🔍 **Behind the scenes: the model reads the description, not your code**
>
> When Claude decides between `search_files` and `glob_files`, it has the two descriptions and nothing else — no source, no examples of past use, no ability to try one and look at the other. A description that says "searches files" for both leaves it guessing, and a guess that costs a tool call costs a round trip and a chunk of context. The highest-leverage sentence in a tool description is usually the one that says **when not to use it**.

```typescript
const bad = { name: "search", description: "Searches." }

const good = {
  name: "search_files",
  description:
    "Search file CONTENTS for a regular expression. Returns matching lines with " +
    "paths and line numbers.\n\n" +
    "Use this when you know roughly what the code says but not where it is.\n" +
    "Do NOT use this to find files by name — use glob_files.\n" +
    "Do NOT use this on binary files; it will return noise.\n\n" +
    "Example: pattern='class\\\\s+UserRepository' finds the class definition.",
}

console.log(`bad:  ${bad.description.length} chars — the model must guess`)
console.log(`good: ${good.description.length} chars — when, when not, and an example`)
```

A description worth writing covers: what it does, when to reach for it, when *not* to, what it returns, and one example.

## Name for the caller

```typescript
const naming = [
  ["get_data", "read_customer_orders", "say what data"],
  ["do_thing", "send_invoice_email", "verb plus object"],
  ["process", "validate_and_queue_payment", "name the actual steps"],
  ["helper2", "resolve_shipping_address", "never number your tools"],
  ["dbQuery", "query_orders_database", "snake_case, and say which database"],
] as const

for (const [poor, better, why] of naming) {
  console.log(`${poor.padEnd(12)} → ${better.padEnd(30)} ${why}`)
}
```

## Schemas that make mistakes impossible

```typescript
import { z } from "zod"

// Loose: every wrong value is a runtime error the model discovers by failing.
const Loose = z.object({
  status: z.string(),
  limit: z.number(),
  sort: z.string(),
})

// Tight: the wrong value cannot be expressed.
const Tight = z.object({
  status: z.enum(["pending", "shipped", "delivered", "cancelled"]),
  limit: z.number().int().min(1).max(100).default(20),
  sort: z.enum(["created_at", "-created_at", "total", "-total"]).default("-created_at"),
})

console.log("loose accepts nonsense:", Loose.safeParse({ status: "banana", limit: -5, sort: "?" }).success)
console.log("tight rejects it:      ", Tight.safeParse({ status: "banana", limit: -5, sort: "?" }).success)
console.log("tight fills defaults:  ", JSON.stringify(Tight.parse({ status: "pending" })))
```

`strict: true` on the tool definition (with `additionalProperties: false` and a `required` list) guarantees the arguments validate exactly — no more parsing a field that was supposed to be there.

## Errors are instructions

```typescript
function withBadError(path: string): string {
  return `Error: ENOENT`
}

function withGoodError(path: string, available: string[]): string {
  return (
    `Error: '${path}' does not exist.\n` +
    `Files in this directory: ${available.join(", ")}\n` +
    `Did you mean '${available.find((f) => f.startsWith(path[0]!)) ?? available[0]}'?`
  )
}

const files = ["config.ts", "index.ts", "utils.ts"]

console.log(withBadError("confg.ts"))
console.log("---")
console.log(withGoodError("confg.ts", files))
```

> 💡 **Tip:** Write every error message as if to a capable colleague who cannot see your screen. "Invalid input" costs a wasted turn; "expected one of pending/shipped/delivered, got 'banana'" is fixed on the next call. The model is unusually good at recovering from a specific error — and helpless in the face of a vague one.

## How many tools

```typescript
type Tool = { name: string; tokens: number }

const tools: Tool[] = [
  { name: "read_file", tokens: 120 },
  { name: "write_file", tokens: 140 },
  { name: "search_files", tokens: 180 },
  { name: "run_command", tokens: 200 },
  { name: "list_directory", tokens: 110 },
]

const total = tools.reduce((sum, t) => sum + t.tokens, 0)
console.log(`${tools.length} tools = ${total} tokens, on EVERY request`)

// A hypothetical over-specified surface.
const many = Array.from({ length: 60 }, (_, i) => ({ name: `tool_${i}`, tokens: 150 }))
console.log(`${many.length} tools = ${many.reduce((s, t) => s + t.tokens, 0)} tokens per request`)
console.log("…and 60 similar descriptions to choose between")
```

Two costs grow with the tool count: tokens on every request, and the model's difficulty in choosing. The usual answer is fewer, more general tools — `run_command` covers a hundred one-off utilities — with specific tools reserved for operations that need guard rails, structure or a constrained schema.

**Tool search** is the escape hatch when the surface genuinely is large: mark tools `defer_loading: true` and add a search tool, so definitions load on demand rather than on every request.

## Tools that are hard to misuse

```typescript
type Order = { id: string; status: string; total: number }
const db: Order[] = [
  { id: "A-1", status: "pending", total: 50 },
  { id: "A-2", status: "shipped", total: 120 },
]

// Destructive, unbounded, unconfirmable.
function deleteOrders(filter: string): string {
  return `deleted everything matching '${filter}' — and you cannot tell what that was`
}

// Same capability, made safe: explicit ids, a dry run, and a report.
function cancelOrders(ids: string[], dryRun: boolean): string {
  const found = db.filter((o) => ids.includes(o.id))
  const missing = ids.filter((id) => !db.some((o) => o.id === id))

  const lines = [
    dryRun ? "DRY RUN — nothing changed" : "cancelled",
    `matched: ${found.map((o) => o.id).join(", ") || "(none)"}`,
    missing.length ? `not found: ${missing.join(", ")}` : "",
  ].filter(Boolean)

  return lines.join("\n")
}

console.log(cancelOrders(["A-1", "A-9"], true))
console.log("---")
console.log(cancelOrders(["A-1"], false))
```

Three properties worth building in: take explicit identifiers rather than a filter, support a dry run, and report exactly what happened including what did *not* match.

## Returning results

```typescript
const rows = [
  { id: 1, name: "Ada", role: "engineer", email: "ada@example.com", createdAt: "2026-01-01" },
  { id: 2, name: "Grace", role: "admiral", email: "grace@example.com", createdAt: "2026-01-02" },
]

// Everything, always.
console.log("raw:", JSON.stringify(rows).length, "chars")

// What was asked for, plus how to get more.
const projected = rows.map((r) => ({ id: r.id, name: r.name }))
console.log("projected:", JSON.stringify(projected).length, "chars")
console.log(
  JSON.stringify({
    results: projected,
    total: rows.length,
    note: "Fields available: id, name, role, email, createdAt. Pass fields=[…] for more.",
  }),
)
```

**Reference:** [Tool use overview](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview) and [How to implement tool use](https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use).
