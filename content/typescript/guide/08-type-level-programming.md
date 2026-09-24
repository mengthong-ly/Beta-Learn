---
title: Type-level programming
section: Guide Book
summary: `keyof`, `typeof`, indexed access, mapped types, conditional types, `infer` and template literal types — the language inside the language.
---
TypeScript's type system is itself a small functional language: it has values (types), functions (generics), branching (conditional types) and iteration (mapped types). This chapter is that language.

## `keyof` and indexed access

```typescript
type User = { id: number; name: string; active: boolean }

type UserKey = keyof User          // "id" | "name" | "active"
type Name = User["name"]           // string
type Any = User[keyof User]        // number | string | boolean

const k: UserKey = "name"
const n: Name = "Ada"
const a: Any = true

console.log(k, n, a)
```

## `typeof`: from a value to its type

The *type-level* `typeof` is unrelated to the run-time operator — it reads the inferred type of a binding.

```typescript
const defaults = {
  retries: 3,
  timeout: 1000,
  verbose: false,
}

type Config = typeof defaults        // { retries: number; timeout: number; verbose: boolean }

function configure(c: Config): string {
  return `${c.retries} retries, ${c.timeout}ms`
}

console.log(configure(defaults))
console.log(configure({ retries: 1, timeout: 50, verbose: true }))
```

Combined with `as const` this turns data into types:

```typescript
const ROLES = ["admin", "editor", "viewer"] as const

type Role = (typeof ROLES)[number]   // "admin" | "editor" | "viewer"

function can(role: Role): boolean {
  return role !== "viewer"
}

console.log(ROLES.map((r) => `${r}:${can(r)}`).join(" "))
```

> 💡 **Tip:** This is the cleanest way to keep a runtime list and a type in sync. One array, `as const`, and the type is derived — so adding a role in one place updates both.

## Mapped types

A mapped type builds a new object type by walking the keys of another.

```typescript
type User = { id: number; name: string }

type MyPartial<T> = { [K in keyof T]?: T[K] }
type MyReadonly<T> = { readonly [K in keyof T]: T[K] }
type Nullable<T> = { [K in keyof T]: T[K] | null }

const patch: MyPartial<User> = { name: "Ada" }
const frozen: MyReadonly<User> = { id: 1, name: "Ada" }
const nulls: Nullable<User> = { id: null, name: "Ada" }

console.log(patch.name, frozen.id, nulls.id)
```

Modifiers can be *removed* with `-`:

```typescript
type Frozen = { readonly a: number; readonly b?: string }

type Thawed<T> = { -readonly [K in keyof T]-?: T[K] }

const t: Thawed<Frozen> = { a: 1, b: "required now" }
t.a = 2
console.log(t)
```

Keys can be renamed with `as`:

```typescript
type User = { id: number; name: string }

type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K]
}

const api: Getters<User> = {
  getId: () => 1,
  getName: () => "Ada",
}

console.log(api.getId(), api.getName())
```

## Template literal types

String types you can build and pattern-match.

```typescript
type Method = "get" | "post"
type Resource = "users" | "posts"

type Route = `/${Resource}`
type Endpoint = `${Method} ${Route}`

const e: Endpoint = "post /users"
console.log(e)

type EventName<T extends string> = `on${Capitalize<T>}`
const handler: EventName<"click"> = "onClick"
console.log(handler)
```

The built-in string transformers are `Uppercase`, `Lowercase`, `Capitalize` and `Uncapitalize`.

## Conditional types

`A extends B ? X : Y` — branching at the type level.

```typescript
type IsString<T> = T extends string ? "yes" : "no"

type A = IsString<"hello">   // "yes"
type B = IsString<42>        // "no"

const a: A = "yes"
const b: B = "no"
console.log(a, b)

type Unwrap<T> = T extends Promise<infer U> ? U : T

type C = Unwrap<Promise<number>>   // number
type D = Unwrap<string>            // string

const c: C = 1
const d: D = "x"
console.log(c, d)
```

`infer` introduces a type variable that the compiler fills in from the match. It is how `ReturnType`, `Parameters` and `Awaited` are written:

```typescript
type MyReturnType<T> = T extends (...args: never[]) => infer R ? R : never
type MyParameters<T> = T extends (...args: infer P) => unknown ? P : never

function makeUser(id: number, name: string) {
  return { id, name, createdAt: "2026-01-01" }
}

type User = MyReturnType<typeof makeUser>
type Args = MyParameters<typeof makeUser>

const u: User = { id: 1, name: "Ada", createdAt: "2026-01-01" }
const args: Args = [1, "Ada"]

console.log(u.createdAt, args[1])
console.log(makeUser(...args))
```

## Distribution over unions

A conditional type applied to a *naked* type parameter distributes over each union member separately. This surprises people once and then becomes a tool.

```typescript
type ToArray<T> = T extends unknown ? T[] : never

type R = ToArray<string | number>   // string[] | number[] — NOT (string | number)[]

const r: R = ["a", "b"]
console.log(r)

// Wrapping in a tuple switches distribution off:
type ToArrayNoDist<T> = [T] extends [unknown] ? T[] : never
type S = ToArrayNoDist<string | number>   // (string | number)[]

const s: S = ["a", 1]
console.log(s)
```

Distribution is how `Exclude` and `Extract` work:

```typescript
type MyExclude<T, U> = T extends U ? never : T
type MyExtract<T, U> = T extends U ? T : never

type Role = "admin" | "editor" | "viewer"

type Writers = MyExclude<Role, "viewer">      // "admin" | "editor"
type Viewer = MyExtract<Role, "viewer">       // "viewer"

const w: Writers = "editor"
const v: Viewer = "viewer"
console.log(w, v)
```

> 🔍 **Behind the scenes: why `never` disappears**
>
> `MyExclude` maps each member to either itself or `never`, then unions the results — and `never` in a union contributes nothing, so it vanishes. `"admin" | never | "editor"` collapses to `"admin" | "editor"`. The same property makes `never` the natural "remove this" marker in mapped types with `as` key remapping.

```typescript
type User = { id: number; name: string; password: string }

type Public<T> = {
  [K in keyof T as K extends "password" ? never : K]: T[K]
}

const u: Public<User> = { id: 1, name: "Ada" }
console.log(Object.keys(u))
```

## Putting it together

A type-safe deep-readonly, in four lines:

```typescript
type DeepReadonly<T> = T extends (infer U)[]
  ? readonly DeepReadonly<U>[]
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T

type Config = {
  name: string
  servers: { host: string; ports: number[] }[]
}

const cfg: DeepReadonly<Config> = {
  name: "prod",
  servers: [{ host: "a", ports: [80, 443] }],
}

console.log(cfg.servers[0]!.ports[1])
```

```typescript
type DeepReadonly<T> = T extends (infer U)[]
  ? readonly DeepReadonly<U>[]
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T

const cfg: DeepReadonly<{ a: { b: number } }> = { a: { b: 1 } }
cfg.a.b = 2 // error! Cannot assign to 'b' because it is a read-only property.
```

> ⚠️ Type-level code is real code with no tests and no debugger. Keep it shallow, name the intermediate types, and prefer a slightly repetitive but obvious type over a clever one. A type nobody can read is worse than a type nobody wrote.

**Reference:** [Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html) and [Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html).
