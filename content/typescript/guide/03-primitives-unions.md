---
title: Primitives, literals & unions
section: Guide Book
summary: The seven primitives, how literal types are born and widened, and why a union is only as useful as the way you narrow it.
---
## The primitives

```typescript
const s: string = "text"
const n: number = 3.14          // one number type: no int/float split
const b: boolean = true
const big: bigint = 9007199254740993n
const sym: symbol = Symbol("key")
const u: undefined = undefined
const nul: null = null

console.log(typeof s, typeof n, typeof b, typeof big, typeof sym, typeof u, typeof nul)
```

Note the last one: `typeof null` is `"object"`, a JavaScript bug from 1995 that can never be fixed. TypeScript knows and handles it, but `typeof x === "object"` never excludes `null` for you.

> ⚠️ Write `string`, `number`, `boolean` — lowercase. The capitalised `String`, `Number` and `Boolean` are the wrapper *object* types, and almost nothing you want accepts them interchangeably.

## `number` is a double

There is no integer type. Every number is an IEEE-754 double, with the consequences that implies.

```typescript
console.log(0.1 + 0.2)                        // 0.30000000000000004
console.log(0.1 + 0.2 === 0.3)                // false
console.log(Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON) // the right comparison

console.log(Number.MAX_SAFE_INTEGER)          // 9007199254740991
console.log(9007199254740993)                 // ...loses precision
console.log(9007199254740993n)                // bigint keeps it
```

> 🧭 **Scenario:** An API returns 64-bit database ids. JavaScript rounds anything past 2^53, so two different records quietly become the same id. The fix is to transport ids as **strings**, or to parse them as `bigint` — never as `number`.

## Literal types

A literal type is a type with exactly one value. `const` produces one; `let` widens to the primitive.

```typescript
const exact = "red"      // type: "red"
let widened = "red"      // type: string

const nums = [1, 2, 3]   // number[] — array contents always widen
const frozen = [1, 2, 3] as const  // readonly [1, 2, 3]

console.log(exact, widened, nums.length, frozen.length)
```

```typescript
let mode: "on" | "off" = "on"
mode = "off"
console.log(mode)

mode = "maybe" // error! Type '"maybe"' is not assignable to type '"on" | "off"'.
```

### Widening bites in objects

An object's properties are mutable, so their literal types widen — which breaks assignment to a union type.

```typescript
type Request = { url: string; method: "GET" | "POST" }

const config = { url: "/api", method: "GET" }   // method: string, not "GET"

const req: Request = config // error! Type 'string' is not assignable to type '"GET" | "POST"'.
```

Three fixes, in increasing order of preference:

```typescript
type Request = { url: string; method: "GET" | "POST" }

const a = { url: "/api", method: "GET" as const }     // pin one property
const b = { url: "/api", method: "GET" } as const     // pin the whole object
const c: Request = { url: "/api", method: "GET" }     // annotate the destination

console.log(a.method, b.method, c.method)
```

> 💡 **Tip:** `satisfies` gives you both — the check *and* the narrow inferred type.

```typescript
type Request = { url: string; method: "GET" | "POST" }

const req = { url: "/api", method: "GET" } satisfies Request

// Checked against Request, but req.method is "GET" — not "GET" | "POST".
const pinned: "GET" = req.method
console.log(pinned, req.url)
```

## Unions

A union is "one of these". You cannot use a member until you know which one.

```typescript
type Id = string | number

function describe(id: Id): string {
  if (typeof id === "string") {
    return `string of length ${id.length}`
  }
  return `number: ${id.toFixed(2)}`
}

console.log(describe("abc"))
console.log(describe(42))
```

```typescript
type Id = string | number

function bad(id: Id) {
  return id.toFixed(2) // error! Property 'toFixed' does not exist on type 'string | number'.
}
```

Only what *every* member has is available without narrowing:

```typescript
type Id = string | number

function show(id: Id): string {
  return id.toString()   // both have toString
}

console.log(show("abc"), show(42))
```

## Unions of objects, and why a tag helps

```typescript
type Loading = { status: "loading" }
type Success = { status: "success"; data: string[] }
type Failure = { status: "error"; message: string }

type State = Loading | Success | Failure

function render(state: State): string {
  switch (state.status) {
    case "loading":
      return "…"
    case "success":
      return `${state.data.length} results`
    case "error":
      return `Error: ${state.message}`
  }
}

console.log(render({ status: "loading" }))
console.log(render({ status: "success", data: ["a", "b"] }))
console.log(render({ status: "error", message: "offline" }))
```

That shared, literal-typed `status` property makes this a **discriminated union** — the single most useful pattern in TypeScript. The compiler uses it to narrow, and to prove the `switch` is exhaustive.

> 🔍 **Behind the scenes: why the tag must be a literal type**
>
> Narrowing on `state.status` works because each member's `status` has a *single-value* type. If `status` were `string`, the compiler would learn nothing from comparing it — `"success"` would be one of infinitely many possibilities. This is also why a boolean tag works (`{ ok: true } | { ok: false }`): `true` and `false` are literal types too.

## Intersections

`A & B` means "both at once". Useful for composing, sharp edges when the parts conflict.

```typescript
type HasId = { id: number }
type HasName = { name: string }

type Entity = HasId & HasName

const e: Entity = { id: 1, name: "Ada" }
console.log(e.id, e.name)

// Conflicting primitive members produce never — a type with no values:
type Impossible = { v: string } & { v: number }
type V = Impossible["v"]   // never
```

```typescript
type Impossible = { v: string } & { v: number }

const x: Impossible = { v: "anything" } // error! Type 'string' is not assignable to type 'never'.
```

## `null`, `undefined` and `strictNullChecks`

With `strict` on, `null` and `undefined` are separate types that must be handled.

```typescript
function find(names: string[], q: string): string | undefined {
  return names.find((n) => n === q)
}

const found = find(["Ada"], "Grace")

console.log(found?.toUpperCase() ?? "not found")   // optional chaining + nullish coalescing
console.log(found?.length)                          // undefined, no throw

if (found !== undefined) {
  console.log(found.toUpperCase())                  // narrowed to string
}
```

> ⚠️ `??` falls back only on `null`/`undefined`; `||` falls back on every falsy value. `count || 10` turns a legitimate `0` into `10`. `count ?? 10` does not.

```typescript
const count = 0
console.log(count || 10)   // 10 — probably a bug
console.log(count ?? 10)   // 0  — probably right
```

**Reference:** [Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html) in the TypeScript Handbook.
