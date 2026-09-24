---
title: Objects, interfaces & type aliases
section: Guide Book
summary: Optional and readonly members, index signatures, when to reach for `interface` over `type`, and how declaration merging works.
---
## Describing an object

Two syntaxes, almost interchangeable:

```typescript
interface User {
  readonly id: number
  name: string
  email?: string        // optional: string | undefined
}

type Product = {
  readonly sku: string
  price: number
  tags?: string[]
}

const u: User = { id: 1, name: "Ada" }
const p: Product = { sku: "A-1", price: 9.99 }

console.log(u.name, u.email ?? "(no email)")
console.log(p.sku, p.tags?.length ?? 0)
```

## `readonly` is compile-time only

It stops *you* from assigning. It does not freeze anything at run time, and it does not survive into a mutable alias.

```typescript
type Config = { readonly url: string }

const c: Config = { url: "/api" }
console.log(c.url)

const mutable: { url: string } = c   // readonly is not checked here
mutable.url = "/changed"
console.log(c.url)                    // "/changed" — same object
```

```typescript
type Config = { readonly url: string }
const c: Config = { url: "/api" }

c.url = "/changed" // error! Cannot assign to 'url' because it is a read-only property.
```

> 💡 **Tip:** `Object.freeze()` is the run-time counterpart, and TypeScript types it well: `Object.freeze(obj)` returns `Readonly<T>`, so you get both guarantees from one call.

## Optional versus `| undefined`

They are not the same thing. `x?: number` means the key may be **missing**; `x: number | undefined` means the key must be **present**, holding `undefined`.

```typescript
type A = { x?: number }              // may be absent
type B = { x: number | undefined }   // must be present, may be undefined

const a: A = {}                      // fine
const b: B = { x: undefined }        // must write it out

console.log("x" in a, "x" in b)
console.log(Object.keys(a).length, Object.keys(b).length)
```

> 💡 **Tip:** By default `x?: number` also permits an explicit `{ x: undefined }`, so the two types are closer than they look. The `exactOptionalPropertyTypes` flag — not included in `strict` — separates them properly: with it on, an optional property may be absent but may not be explicitly `undefined`.

```typescript
type B = { x: number | undefined }
const b: B = {} // error! Property 'x' is missing in type '{}'.
```

## Index signatures

For objects whose keys are not known ahead of time.

```typescript
type Scores = { [name: string]: number }

const scores: Scores = { ada: 10, grace: 12 }
scores.linus = 8

for (const [name, score] of Object.entries(scores)) {
  console.log(name, score)
}

console.log(scores.nobody)        // typed number — but undefined at run time!
```

> ⚠️ An index signature lies by default: `scores.nobody` is typed `number` but is actually `undefined`. `noUncheckedIndexedAccess` fixes it by adding `| undefined` to every indexed read — one of the highest-value non-default flags.

`Record<K, V>` is the same idea with a nicer name, and it can restrict the keys:

```typescript
type Role = "admin" | "editor" | "viewer"

const permissions: Record<Role, string[]> = {
  admin: ["read", "write", "delete"],
  editor: ["read", "write"],
  viewer: ["read"],
}

for (const role of Object.keys(permissions) as Role[]) {
  console.log(role, permissions[role].join("/"))
}
```

Because every key must be listed, adding `"owner"` to `Role` breaks the object until you handle it — the same exhaustiveness guarantee a `switch` gives you.

## `interface` or `type`?

They overlap almost completely. The real differences:

| | `interface` | `type` |
| --- | --- | --- |
| Object shapes | yes | yes |
| Unions, tuples, primitives, conditionals | no | yes |
| Extending | `extends` | `&` |
| Declaration merging | **yes** | no |
| Error messages | often shorter, keeps the name | can expand to the full shape |

```typescript
interface Animal {
  name: string
}
interface Dog extends Animal {
  breed: string
}

type Shape = { kind: "circle" } | { kind: "square" }   // only `type` can do this
type Pair = [number, string]                            // and this
type Maybe<T> = T | null                                // and this

const d: Dog = { name: "Rex", breed: "corgi" }
const shapes: Shape[] = [{ kind: "circle" }, { kind: "square" }]
const pair: Pair = [1, "a"]
const m: Maybe<string> = null

console.log(d.breed, shapes.length, pair[1], m)
```

> 🔍 **Behind the scenes: declaration merging**
>
> Two `interface` declarations with the same name in the same scope merge into one. This looks like a footgun, and for your own code it mostly is — but it is the mechanism that lets you add a property to an existing library's types without forking them. `type` deliberately forbids it: a duplicate `type` name is an error, which is usually what you want inside an application.

```typescript
interface Window {
  myAppVersion: string
}
interface Window {
  myAppFlags: string[]
}

// Both declarations merged into one type.
const w: Window = { myAppVersion: "1.0", myAppFlags: ["beta"] }
console.log(w.myAppVersion, w.myAppFlags)
```

> 💡 **Tip:** A reasonable default: `interface` for object shapes that others may extend, `type` for everything else. Consistency matters more than the choice.

## Nesting and reuse

```typescript
interface Address {
  street: string
  city: string
}

interface Company {
  name: string
  address: Address
  employees: Array<{ name: string; role: string }>
}

const acme: Company = {
  name: "Acme",
  address: { street: "1 Main St", city: "Springfield" },
  employees: [
    { name: "Ada", role: "engineer" },
    { name: "Grace", role: "admiral" },
  ],
}

console.log(acme.address.city)
console.log(acme.employees.map((e) => `${e.name} (${e.role})`).join(", "))
```

## The built-in transformers

TypeScript ships utility types that build new object types from existing ones. These cover most day-to-day needs.

```typescript
interface User {
  id: number
  name: string
  email: string
}

type PartialUser = Partial<User>                 // every property optional
type UserId = Pick<User, "id">                   // keep some
type NoEmail = Omit<User, "email">               // drop some
type RequiredUser = Required<Partial<User>>      // back to all required
type FrozenUser = Readonly<User>

const patch: PartialUser = { name: "Ada" }
const key: UserId = { id: 1 }
const lite: NoEmail = { id: 1, name: "Ada" }

console.log(patch.name, key.id, lite.name)

function update(user: User, changes: Partial<User>): User {
  return { ...user, ...changes }
}

console.log(update({ id: 1, name: "Ada", email: "a@x.com" }, { name: "Grace" }))
```

> ⚠️ `Omit` does not check that the key exists — `Omit<User, "emial">` silently produces `User` unchanged. `Pick` does check. If a typo in `Omit` would be costly, write `Omit<User, keyof User & "email">` or add a test.

**Reference:** [Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html) and [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html).
