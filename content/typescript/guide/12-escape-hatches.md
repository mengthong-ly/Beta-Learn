---
title: Escape hatches & JavaScript interop
section: Guide Book
summary: `any`, assertions, non-null `!`, `satisfies` and branded types — when each is the right tool, and how to keep the unsafe part small.
---
Every escape hatch is a place where you overrule the compiler. Used deliberately and locally, they are essential. Used casually, they turn a typed codebase into an untyped one with extra syntax.

## The ladder

From safest to least safe:

| Tool | Says | Safety |
| --- | --- | --- |
| `unknown` + narrowing | "I do not know yet; I will check" | full |
| `satisfies` | "check this, but keep the narrow type" | full |
| type predicate / assertion fn | "here is my proof" | you supply it |
| `as` | "trust me about this type" | none |
| `!` | "trust me, not null" | none |
| `any` | "stop checking here" | none, and it spreads |
| `@ts-ignore` | "stop checking this line" | none, and it hides future errors |

Always climb as high as you can.

## `as` — a type assertion, not a cast

`as` changes nothing at run time. No conversion, no validation.

```typescript
const value: unknown = "42"

const s = value as string        // compile-time only
console.log(s.toUpperCase())

const n = value as number        // also allowed: unknown asserts to anything
console.log(typeof n)            // "string" — nothing was converted
console.log(n.toFixed)           // undefined: the method does not exist
```

From `unknown` every assertion is permitted — that is what `unknown` is for. Between two *known* and unrelated types, the compiler pushes back:

```typescript
const value = "42"               // string, not unknown

const n = value as number // error! Conversion of type 'string' to type 'number' may be a mistake.
```

```typescript
const value = "42"

const n = value as unknown as number   // the double assertion, for unrelated types
console.log(typeof n, n.toFixed)       // "string" undefined
```

Routing through `unknown` defeats that last check. Writing `as unknown as X` should feel uncomfortable, because it is the point at which nothing at all is verified.

> ⚠️ The most common `as` in real code is `JSON.parse(x) as User`. That is a hope, not a type. Parse into `unknown` and validate — with a predicate, or a schema library — at the one place the data enters.

## `!` — non-null assertion

```typescript
const nums = [1, 2, 3]

const found = nums.find((n) => n > 1)
console.log(found!.toFixed(1))        // "I know there is a match"

const map = new Map([["a", 1]])
console.log(map.get("a")! + 1)
```

Each `!` is a claim the compiler cannot check. When the claim is cheap to verify, verify instead:

```typescript
const map = new Map([["a", 1]])

const v = map.get("b")
if (v === undefined) {
  console.log("missing, handled")
} else {
  console.log(v + 1)
}

console.log(map.get("b") ?? 0)        // or just supply a default
```

## `satisfies` — check without widening

The newest and most under-used of these. It validates a value against a type while keeping the value's own, narrower inferred type.

```typescript
type Config = Record<string, string | number>

const withAnnotation: Config = { host: "localhost", port: 8080 }
const withSatisfies = { host: "localhost", port: 8080 } satisfies Config

// Annotated: every value is string | number, so this needs a check.
console.log(typeof withAnnotation.port)

// satisfies: port is still number.
console.log(withSatisfies.port.toFixed(0))
```

```typescript
type Config = Record<string, string | number>
const c: Config = { host: "localhost", port: 8080 }

console.log(c.port.toFixed(0)) // error! Property 'toFixed' does not exist on type 'string | number'.
```

It also catches typos that `as` would wave through:

```typescript
type Routes = Record<"home" | "about", string>

const routes = {
  home: "/",
  about: "/about",
} satisfies Routes

console.log(routes.home, routes.about)
```

```typescript
type Routes = Record<"home" | "about", string>

const routes = {
  home: "/",
  abuot: "/about", // error! Object literal may only specify known properties
} satisfies Routes
```

> 💡 **Tip:** The rule of thumb: `satisfies` when you want the check *and* the specific type; a plain annotation when you want the value to be treated as the general type; `as` when you have given up on both.

## `any` and how to contain it

`any` is contagious. Every property, call result and array element of an `any` is also `any`, and it flows outward silently.

```typescript
const data: any = { user: { name: "Ada" } }

const name = data.user.name        // any
const len = name.length            // any
const wrong: number = len          // no error — any is assignable to everything

console.log(wrong, typeof wrong)   // "number", but it is a number by accident
```

`unknown` stops the spread at the boundary:

```typescript
const data: unknown = { user: { name: "Ada" } }

function hasName(v: unknown): v is { user: { name: string } } {
  return (
    typeof v === "object" &&
    v !== null &&
    "user" in v &&
    typeof (v as { user?: { name?: unknown } }).user?.name === "string"
  )
}

if (hasName(data)) {
  console.log(data.user.name.toUpperCase())   // fully typed from here
} else {
  console.log("unexpected shape")
}
```

## Branded types: nominal typing on demand

Structural typing means two `string`s are interchangeable — including a user id and an order id. A **brand** makes them distinct without any run-time cost.

```typescript
declare const brand: unique symbol
type Brand<T, B> = T & { readonly [brand]: B }

type UserId = Brand<string, "UserId">
type OrderId = Brand<string, "OrderId">

function userId(s: string): UserId {
  return s as UserId       // the one assertion, in one place
}
function orderId(s: string): OrderId {
  return s as OrderId
}

function loadUser(id: UserId): string {
  return `user ${id}`
}

console.log(loadUser(userId("u-1")))
console.log(typeof userId("u-1"))    // "string" — nothing exists at run time
```

```typescript
declare const brand: unique symbol
type Brand<T, B> = T & { readonly [brand]: B }
type UserId = Brand<string, "UserId">

function loadUser(id: UserId): string {
  return `user ${id}`
}

loadUser("u-1") // error! Type 'string' is not assignable to type 'UserId'.
```

> 🧭 **Scenario:** A function takes `(userId: string, orderId: string)` and somebody swaps the arguments. Nothing fails — the types match, the query returns nothing, and the bug surfaces as an empty page. Brands turn that into a compile error, and they cost exactly one `as` per constructor.

## Interop with untyped JavaScript

```typescript
// A module with no types would be `any`. Wrap it once, narrowly:
type LegacyApi = {
  fetchAll(): Promise<unknown[]>
}

function adapt(raw: unknown): LegacyApi {
  const api = raw as LegacyApi
  return {
    fetchAll: () => api.fetchAll(),
  }
}

const fake = { fetchAll: async () => [1, 2, 3] }
const api = adapt(fake)

api.fetchAll().then((rows) => console.log(rows.length))
```

The pattern that keeps a codebase honest: **one unsafe boundary function**, typed inputs and outputs, and no `any` past it.

> ⚠️ `skipLibCheck` and an `@types` package that is out of date will happily describe a library that no longer behaves that way. Declaration files are documentation with a compiler attached — they can be wrong, and nothing checks them against the implementation.

**Reference:** [Type assertions](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions) and [the `satisfies` operator](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html).
