---
title: Defining tools
section: 3 · Tool Use
---

On its own, Claude can only write text. **Tool use** (also called function calling) lets it ask *your code* to do something: look up the weather, query a database, read a file. You describe each tool, Claude decides when a tool fits the request, and it replies with a structured call that your application runs.

Every tool starts as a plain object with three parts:

| Field | What it is |
| --- | --- |
| `name` | The tool's name. It must match the regex `^[a-zA-Z0-9_-]{1,128}$`. |
| `description` | Plain text: what the tool does, when to use it, and how it behaves. |
| `input_schema` | A [JSON Schema](https://json-schema.org/) object describing the tool's parameters. |

There are optional fields too, such as `input_examples` (sample inputs) and `strict` (you'll meet it in lesson 13).

```typescript
type Tool = {
  name: string
  description: string
  input_schema: {
    type: "object"
    properties: Record<string, { type: string; description?: string; enum?: string[] }>
    required?: string[]
  }
}

const getWeather: Tool = {
  name: "get_weather",
  description: "Get the current weather in a given location",
  input_schema: {
    type: "object",
    properties: {
      location: { type: "string", description: "The city and state, e.g. San Francisco, CA" },
      unit: {
        type: "string",
        enum: ["celsius", "fahrenheit"],
        description: "The unit of temperature, either 'celsius' or 'fahrenheit'",
      },
    },
    required: ["location"],
  },
}

console.log(JSON.stringify(getWeather, null, 2))
```

This is the official docs' example. `location` is required. `unit` is optional, but if Claude sends it, it must be one of the two `enum` values.

## Names

Names can use letters, digits, `_` and `-` only, with 1 to 128 characters. No spaces and no dots:

```typescript
const NAME = /^[a-zA-Z0-9_-]{1,128}$/

for (const name of ["get_weather", "github_list_prs", "search-flights", "get weather", "db.query", ""]) {
  console.log(name === "" ? "(empty)" : name, NAME.test(name) ? "ok" : "invalid")
}
```

When your tools come from several services, the docs suggest a service prefix such as `github_list_prs` or `slack_send_message`. That way Claude never has to guess which `list` or `send` you mean.

## Descriptions matter most

The docs call detailed descriptions "by far the most important factor in tool performance." A good description covers:

- what the tool does
- when to use it, and when not to
- what each parameter means and how it changes the result
- caveats and limits, such as what the tool does *not* return

Aim for at least 3–4 sentences per tool, and more for complex ones. Compare these two:

```json
{
  "name": "get_stock_price",
  "description": "Gets the stock price for a ticker.",
  "input_schema": {
    "type": "object",
    "properties": { "ticker": { "type": "string" } },
    "required": ["ticker"]
  }
}
```

```json
{
  "name": "get_stock_price",
  "description": "Retrieves the current stock price for a given ticker symbol. The ticker symbol must be a valid symbol for a publicly traded company on a major US stock exchange like NYSE or NASDAQ. The tool will return the latest trade price in USD. It should be used when the user asks about the current or most recent price of a specific stock. It will not provide any other information about the stock or company.",
  "input_schema": {
    "type": "object",
    "properties": {
      "ticker": { "type": "string", "description": "The stock ticker symbol, e.g. AAPL for Apple Inc." }
    },
    "required": ["ticker"]
  }
}
```

The first one leaves Claude guessing: which exchanges, which currency, and whether it also returns company news. The second answers all of that.

The docs give a few more tips:

- **Use fewer tools that do more.** One `pull_request` tool with an `action` parameter is easier for Claude to pick than separate `create_pr`, `review_pr` and `merge_pr` tools.
- **Return only useful data.** Return stable IDs and the fields Claude needs for its next step. Bloated results waste context.
- **Use `input_examples` for tricky inputs.** Each example must be valid against your `input_schema`, or the API returns a 400 error.

> 💡 **Tip:** Write the description as if for a new teammate who can't see your code. If they would have to ask "what does this return?", the description isn't finished.

## Sending tools with a request

The definitions go in the `tools` array of a Messages API request. This is the real call with the official `@anthropic-ai/sdk` package. It needs an API key, so it's shown here but not run:

```typescript-snippet
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()

const response = await client.messages.create({
  model: "claude-opus-5",
  max_tokens: 1024,
  tools: [
    {
      name: "get_weather",
      description: "Get the current weather in a given location",
      input_schema: {
        type: "object",
        properties: {
          location: { type: "string", description: "The city and state, e.g. San Francisco, CA" },
        },
        required: ["location"],
      },
    },
  ],
  messages: [{ role: "user", content: "What's the weather like in San Francisco?" }],
})
```

The `tool_choice` field controls whether Claude uses the tools: `auto` (the default when tools are given) lets Claude decide, `any` means it must use one of them, `tool` forces one specific tool, and `none` means it can't use any.

## Client tools and server tools

Tools differ in **where the code runs**:

| | Client tools | Server tools |
| --- | --- | --- |
| Who runs them | Your application | Anthropic's infrastructure |
| Examples | Your own tools like `get_weather`; Anthropic-schema tools like `bash` and `text_editor` | `web_search`, `web_fetch`, `code_execution`, `tool_search` |
| How you declare them | `name` + `description` + `input_schema` (or a date-versioned `type` for Anthropic-schema tools) | A versioned `type`, e.g. `{ type: "web_search_20260209", name: "web_search" }` |
| What you do | Run the call and send back a `tool_result` | Nothing: the results come back in the same response |

This section is about client tools: you write the schema and your code does the work. The next lesson covers what happens when Claude calls one.

## Validating arguments

Claude's arguments normally follow your schema, but in normal (non-strict) mode that isn't guaranteed. The docs mention getting `"2"` instead of `2`, or a missing required field. Checking inputs before you run a tool is a good habit. Here's a small check for flat schemas:

```typescript
const schema = {
  properties: { location: { type: "string" }, days: { type: "integer" } },
  required: ["location"],
}

const input: Record<string, unknown> = { days: "3" }

for (const key of schema.required) {
  if (!(key in input)) console.log(`missing required "${key}"`)
}
console.log(typeof input.days === "number" ? "days ok" : `days should be an integer, got ${typeof input.days}`)
```

## Challenge

> 🎯 **Challenge:** Write `validateInput(schema, input)`. It returns an array of error messages, or `[]` when the input is valid. Report each missing `required` key, each value whose type doesn't match (`string`, `number`, `integer`, `boolean`), each value that isn't in its `enum`, and, when `additionalProperties` is `false`, each unknown key. Every message must contain the key's name.

```typescript starter
type Prop = { type: "string" | "number" | "integer" | "boolean"; description?: string; enum?: (string | number)[] }
export type InputSchema = {
  type: "object"
  properties: Record<string, Prop>
  required?: string[]
  additionalProperties?: boolean
}

export function validateInput(schema: InputSchema, input: Record<string, unknown>): string[] {
  const errors: string[] = []
  // check required keys, types, enums and unknown keys here
  return errors
}

const flights: InputSchema = {
  type: "object",
  properties: {
    destination: { type: "string" },
    passengers: { type: "integer", enum: [1, 2, 3, 4] },
  },
  required: ["destination"],
  additionalProperties: false,
}

console.log(validateInput(flights, { destination: "Tokyo", passengers: 2 }))
console.log(validateInput(flights, { passengers: "two", seat: "12A" }))
```

```typescript solution
type Prop = { type: "string" | "number" | "integer" | "boolean"; description?: string; enum?: (string | number)[] }
export type InputSchema = {
  type: "object"
  properties: Record<string, Prop>
  required?: string[]
  additionalProperties?: boolean
}

function hasType(value: unknown, type: Prop["type"]): boolean {
  if (type === "integer") return Number.isInteger(value)
  return typeof value === type
}

export function validateInput(schema: InputSchema, input: Record<string, unknown>): string[] {
  const errors: string[] = []
  for (const key of schema.required ?? []) {
    if (!(key in input)) errors.push(`missing required "${key}"`)
  }
  for (const [key, value] of Object.entries(input)) {
    const prop = schema.properties[key]
    if (!prop) {
      if (schema.additionalProperties === false) errors.push(`unknown key "${key}"`)
      continue
    }
    if (!hasType(value, prop.type)) {
      errors.push(`"${key}" should be ${prop.type}, got ${JSON.stringify(value)}`)
    } else if (prop.enum && !prop.enum.includes(value as string | number)) {
      errors.push(`"${key}" must be one of ${prop.enum.join(", ")}`)
    }
  }
  return errors
}

const flights: InputSchema = {
  type: "object",
  properties: {
    destination: { type: "string" },
    passengers: { type: "integer", enum: [1, 2, 3, 4] },
  },
  required: ["destination"],
  additionalProperties: false,
}

console.log(validateInput(flights, { destination: "Tokyo", passengers: 2 }))
console.log(validateInput(flights, { passengers: "two", seat: "12A" }))
```

```typescript check
const weather: import("./main.js").InputSchema = {
  type: "object",
  properties: {
    location: { type: "string" },
    unit: { type: "string", enum: ["celsius", "fahrenheit"] },
    days: { type: "integer" },
    alerts: { type: "boolean" },
  },
  required: ["location"],
}
const v = lesson.validateInput

expect(v(weather, { location: "Paris" }).length === 0, "A valid input should give [] (no errors)")
expect(v(weather, { location: "Paris", unit: "celsius", days: 3, alerts: true }).length === 0, "All four fields valid should give []")

const missing = v(weather, { unit: "celsius" })
expect(missing.length === 1 && missing[0].includes("location"), `A missing required "location" should give one error naming it, got ${JSON.stringify(missing)}`)

const wrongType = v(weather, { location: "Paris", days: "3" })
expect(wrongType.length === 1 && wrongType[0].includes("days"), `days: "3" (a string) should give one error naming "days", got ${JSON.stringify(wrongType)}`)

const notInt = v(weather, { location: "Paris", days: 2.5 })
expect(notInt.length === 1 && notInt[0].includes("days"), `days: 2.5 isn't an integer, expected one error naming "days", got ${JSON.stringify(notInt)}`)

const badEnum = v(weather, { location: "Paris", unit: "kelvin" })
expect(badEnum.length === 1 && badEnum[0].includes("unit"), `unit: "kelvin" isn't in the enum, expected one error naming "unit", got ${JSON.stringify(badEnum)}`)

expect(v(weather, { location: "Paris", extra: 1 }).length === 0, "Without additionalProperties: false, unknown keys are allowed")
const closed = v({ ...weather, additionalProperties: false }, { location: "Paris", extra: 1 })
expect(closed.length === 1 && closed[0].includes("extra"), `With additionalProperties: false, "extra" should give one error naming it, got ${JSON.stringify(closed)}`)
```

**Reference:** [Define tools](https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools) and [Tool use with Claude](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) in the Claude API docs.
