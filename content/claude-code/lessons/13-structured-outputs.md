---
title: Structured outputs
section: 3 · Tool Use
---

Sooner or later you want Claude's answer as **data**, not prose. You might be pulling fields out of an email, sorting support tickets, or filling a form. Asking "reply in JSON" usually works, but not always. The docs warn that without structured outputs, Claude "can generate malformed JSON responses or invalid tool inputs that break your applications."

**Structured outputs** fix this with grammar-constrained sampling: the model can only produce tokens that fit your JSON Schema. There are two features:

| Feature | Where it goes | What it controls |
| --- | --- | --- |
| **JSON outputs** | `output_config.format` on the request | The format of Claude's **reply** (what Claude says) |
| **Strict tool use** | `strict: true` on a tool definition | The **arguments** of a tool call (how Claude calls your functions) |

You can use either one, or both in the same request.

## JSON outputs

Add `output_config.format` with `type: "json_schema"` and your schema. The reply's text block is then valid JSON that matches the schema:

```typescript-snippet
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()

const response = await client.messages.create({
  model: "claude-opus-5",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Extract the contact: Jane Doe, jane@example.com" }],
  output_config: {
    format: {
      type: "json_schema",
      schema: {
        type: "object",
        properties: { name: { type: "string" }, email: { type: "string" } },
        required: ["name", "email"],
        additionalProperties: false,
      },
    },
  },
})
```

> 💡 **Tip:** Older code may use an `output_format` parameter. It has moved to `output_config.format`, and no beta header is needed anymore.

In TypeScript you rarely write that schema by hand. The SDK has a zod helper: describe the shape with zod, call `client.messages.parse()`, and read the typed result from `parsed_output`:

```typescript-snippet
import Anthropic from "@anthropic-ai/sdk"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { z } from "zod"

const client = new Anthropic()
const Contact = z.object({ name: z.string(), email: z.string() })

const response = await client.messages.parse({
  model: "claude-opus-5",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Extract the contact: Jane Doe, jane@example.com" }],
  output_config: { format: zodOutputFormat(Contact) },
})

console.log(response.parsed_output) // typed as { name: string; email: string }
```

One zod schema gives you three things: the TypeScript type (`z.infer`), a runtime validator (`safeParse`), and a JSON Schema (`z.toJSONSchema`). This part runs locally, no key needed:

```typescript
import { z } from "zod"

const Contact = z.object({
  name: z.string().describe("Full name"),
  email: z.string(),
  role: z.enum(["customer", "vendor"]),
})
type Contact = z.infer<typeof Contact>

const jane: Contact = { name: "Jane Doe", email: "jane@example.com", role: "customer" }
console.log(JSON.stringify(z.toJSONSchema(Contact), null, 2))
console.log(Contact.safeParse(jane).success)
```

Note that zod object schemas come out with `additionalProperties: false`. Structured outputs require that setting on objects.

## Strict tool use

Tool calls have the same problem. Without strict mode, the docs say Claude might send `"2"` where you need the number `2`, or leave out a required field. Add `strict: true` at the top level of the tool definition (next to `name`, `description` and `input_schema`), and set `additionalProperties: false`:

```typescript-snippet
const response = await client.messages.create({
  model: "claude-opus-5",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Search for flights to Tokyo departing June 1, 2026" }],
  tools: [
    {
      name: "search_flights",
      strict: true,
      input_schema: {
        type: "object",
        properties: {
          destination: { type: "string" },
          departure_date: { type: "string", format: "date" },
          passengers: { type: "integer", enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
        },
        required: ["destination", "departure_date"],
        additionalProperties: false,
      },
    },
  ],
})
```

Now every `tool_use` block's `input` follows the schema, and its `name` is always one of your tools. The "missing parameter" errors from lesson 11 can't happen.

## Which one to use

| You want... | Use |
| --- | --- |
| The final answer as a fixed JSON shape (extraction, classification, reports) | JSON outputs |
| Claude to call your functions with correctly typed arguments | Strict tool use |
| An agent that calls tools **and** ends with a structured answer | Both |

Some limits to know. Only part of JSON Schema is supported. Recursive schemas, `minimum`/`maximum`, `minLength`/`maxLength`, and `additionalProperties` set to anything other than `false` are **not** supported, and using them returns a 400 error. The first request with a new schema is also slower while the grammar compiles. After that, the compiled grammar is cached for 24 hours from its last use.

## Still validate what you parse

Structured outputs make the model's JSON reliable, but you should still validate in code. The JSON might come from a model call that didn't use `output_config`, from an older log, or from a response that stopped early (always check `stop_reason` first). Parsing with zod gives you typed data on success, and clear, per-field messages on failure:

```typescript
import { z } from "zod"

const Reading = z.object({ city: z.string(), celsius: z.number() })

for (const text of ['{"city":"Paris","celsius":18}', '{"city":"Paris","celsius":"warm"}']) {
  const result = Reading.safeParse(JSON.parse(text))
  if (result.success) console.log("ok:", result.data.celsius + 1)
  else console.log(result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`))
}
```

## Challenge

> 🎯 **Challenge:** Finish `TicketSchema` (a `title` string, a `priority` of `"low" | "medium" | "high"`, a `tags` array of strings, and an `estimate_hours` number), then write `parseModelOutput(text)`. It returns `{ ok: true, data }` for valid JSON that fits the schema. Otherwise it returns `{ ok: false, errors }`: one message for text that isn't JSON (starting with `"Invalid JSON"`), or one `"path: message"` string per zod issue. The "model" here is a scripted stand-in that returns canned text.

```typescript starter
import { z } from "zod"

export const TicketSchema = z.object({
  title: z.string(),
  // add priority, tags and estimate_hours
})
export type Ticket = z.infer<typeof TicketSchema>

export type ParseResult = { ok: true; data: Ticket } | { ok: false; errors: string[] }

export function parseModelOutput(text: string): ParseResult {
  return { ok: false, errors: ["not implemented yet"] }
}

// Stand-in for a model reply's text block
const fakeReplies = [
  '{"title":"Login button broken","priority":"high","tags":["auth","ui"],"estimate_hours":3}',
  '{"title":"Typo on pricing page","priority":"urgent","tags":["copy"]}',
  "Sure! Here is the ticket you asked for.",
]
for (const reply of fakeReplies) console.log(JSON.stringify(parseModelOutput(reply)))
```

```typescript solution
import { z } from "zod"

export const TicketSchema = z.object({
  title: z.string(),
  priority: z.enum(["low", "medium", "high"]),
  tags: z.array(z.string()),
  estimate_hours: z.number(),
})
export type Ticket = z.infer<typeof TicketSchema>

export type ParseResult = { ok: true; data: Ticket } | { ok: false; errors: string[] }

export function parseModelOutput(text: string): ParseResult {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch (e) {
    return { ok: false, errors: [`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`] }
  }
  const result = TicketSchema.safeParse(json)
  if (result.success) return { ok: true, data: result.data }
  return { ok: false, errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) }
}

// Stand-in for a model reply's text block
const fakeReplies = [
  '{"title":"Login button broken","priority":"high","tags":["auth","ui"],"estimate_hours":3}',
  '{"title":"Typo on pricing page","priority":"urgent","tags":["copy"]}',
  "Sure! Here is the ticket you asked for.",
]
for (const reply of fakeReplies) console.log(JSON.stringify(parseModelOutput(reply)))
```

```typescript check
const p = lesson.parseModelOutput

const good = p('{"title":"Crash on save","priority":"medium","tags":["editor"],"estimate_hours":1.5}')
expect(good.ok, `Valid ticket JSON should give ok: true, got ${JSON.stringify(good)}`)
if (good.ok) {
  // Read through a loose type so an unfinished schema fails here, not at compile time.
  const d = good.data as { priority?: unknown; estimate_hours?: unknown; tags?: unknown[] }
  expect(d.priority === "medium" && d.estimate_hours === 1.5 && d.tags?.[0] === "editor", `data should hold the parsed ticket, got ${JSON.stringify(good.data)}`)
}

const notJson = p("Here you go: {title: oops}")
expect(!notJson.ok, "Text that isn't JSON must give ok: false (don't let JSON.parse throw)")
if (!notJson.ok) expect(notJson.errors.length === 1 && notJson.errors[0].startsWith("Invalid JSON"), `Expected one error starting with "Invalid JSON", got ${JSON.stringify(notJson.errors)}`)

const badPriority = p('{"title":"X","priority":"urgent","tags":[],"estimate_hours":2}')
expect(!badPriority.ok, 'priority "urgent" isn\'t low/medium/high, so it should give ok: false (is priority a z.enum?)')
if (!badPriority.ok) expect(badPriority.errors.length === 1 && badPriority.errors[0].startsWith("priority"), `Expected one error starting with "priority", got ${JSON.stringify(badPriority.errors)}`)

const missing = p('{"title":"X","priority":"low","tags":["a"]}')
expect(!missing.ok, "A missing estimate_hours should give ok: false")
if (!missing.ok) expect(missing.errors.some((e) => e.startsWith("estimate_hours")), `Expected an error starting with "estimate_hours", got ${JSON.stringify(missing.errors)}`)

const badTag = p('{"title":"X","priority":"low","tags":["a",7],"estimate_hours":"two"}')
expect(!badTag.ok, "A number in tags and a string estimate should give ok: false")
if (!badTag.ok) {
  expect(badTag.errors.length === 2, `Expected one error per problem (2), got ${JSON.stringify(badTag.errors)}`)
  expect(badTag.errors.some((e) => e.startsWith("tags.1")), `The bad tag's error should start with its path "tags.1", got ${JSON.stringify(badTag.errors)}`)
}
```

**Reference:** [Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) and [Strict tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/strict-tool-use) in the Claude API docs.
