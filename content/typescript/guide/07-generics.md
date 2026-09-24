---
title: Generics
section: Guide Book
summary: Type parameters, constraints, inference, defaults — and the rule for when a generic is actually earning its complexity.
---
A generic is a type with a hole in it. The caller fills the hole, and the relationship between input and output is preserved.

```typescript
function first<T>(items: T[]): T | undefined {
  return items[0]
}

const n = first([1, 2, 3])          // number | undefined
const s = first(["a", "b"])         // string | undefined

console.log(n, s?.toUpperCase())
```

Without the type parameter you would need `any[]` (no safety) or one function per type (no reuse).

## Inference

You almost never write the type argument. The compiler works it out from the values.

```typescript
function pair<A, B>(a: A, b: B): [A, B] {
  return [a, b]
}

const p = pair("id", 42)            // [string, number]
console.log(p[0].toUpperCase(), p[1].toFixed(1))

const explicit = pair<string, boolean>("flag", true)   // when you want to be sure
console.log(explicit)
```

## Constraints

`extends` restricts what may fill the hole — and gives you access to what you constrained.

```typescript
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b
}

console.log(longest("apple", "fig"))
console.log(longest([1, 2, 3], [1]))

const bad = longest(10, 20) // error! Argument of type 'number' is not assignable to parameter of type '{ length: number; }'.
```

The most useful constraint in practice is `keyof`:

```typescript
function pluck<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

const user = { id: 1, name: "Ada", active: true }

console.log(pluck(user, "name").toUpperCase())   // string
console.log(pluck(user, "id").toFixed(0))        // number
```

```typescript
function pluck<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

const user = { id: 1, name: "Ada" }
pluck(user, "email") // error! Argument of type '"email"' is not assignable to parameter of type '"id" | "name"'.
```

> 🔍 **Behind the scenes: why `K extends keyof T` and not just `keyof T`**
>
> If the parameter were `key: keyof T`, the return type could only be `T[keyof T]` — the union of *every* property type. `pluck(user, "name")` would come back as `string | number | boolean`. Capturing the specific key in its own type parameter `K` is what lets the return type be `T[K]` — the type of *that* property. Generic parameters are how you keep a relationship between two values, not just a constraint on one.

## Defaults

```typescript
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E }

const a: Result<number> = { ok: true, value: 1 }
const b: Result<number, string> = { ok: false, error: "nope" }

console.log(a.ok && a.value, b.ok === false && b.error)

function make<T = string>(v?: T): T | undefined {
  return v
}

console.log(make(), make(7))
```

## Generic classes and interfaces

```typescript
class Stack<T> {
  private items: T[] = []

  push(item: T): this {
    this.items.push(item)
    return this
  }

  pop(): T | undefined {
    return this.items.pop()
  }

  get size(): number {
    return this.items.length
  }
}

const s = new Stack<string>()
s.push("a").push("b")
console.log(s.pop(), s.size)

const nums = new Stack<number>()
nums.push(1).push(2)
console.log(nums.pop()! + 10)
```

```typescript
interface Repository<T, Id = number> {
  find(id: Id): T | undefined
  all(): readonly T[]
}

type User = { id: number; name: string }

const users: Repository<User> = {
  find: (id) => (id === 1 ? { id: 1, name: "Ada" } : undefined),
  all: () => [{ id: 1, name: "Ada" }],
}

console.log(users.find(1)?.name, users.all().length)
```

## Inference from more than one place

When a type parameter appears twice, the compiler must reconcile both.

```typescript
function zip<T>(a: T[], b: T[]): [T, T][] {
  return a.map((v, i) => [v, b[i]!])
}

console.log(zip([1, 2], [3, 4]))
console.log(zip(["a"], ["b"]))

// Mixed inputs widen T to a union rather than failing:
console.log(zip<number | string>([1], ["a"]))
```

## When a generic is not worth it

A type parameter used **once** is almost always a disguised `any`.

```typescript
// Pointless: T appears once, so it constrains nothing.
function logIt<T>(v: T): void {
  console.log(v)
}

// Same behaviour, honest signature:
function logIt2(v: unknown): void {
  console.log(v)
}

logIt(1)
logIt2(1)
```

> 💡 **Tip:** The test: does the type parameter appear in **at least two** positions — two parameters, or a parameter and the return type? If not, it is not relating anything, and `unknown` says what you mean.

## `const` type parameters

By default an argument widens on the way in. `const T` preserves the literal shape without the caller writing `as const`.

```typescript
function routes<const T extends readonly string[]>(paths: T): T {
  return paths
}

const r = routes(["/", "/about"])   // readonly ["/", "/about"], not string[]
const one: "/about" = r[1]

console.log(one, r.length)
```

## A worked example

Putting constraints, `keyof` and inference together — a typed `groupBy`:

```typescript
function groupBy<T, K extends PropertyKey>(
  items: readonly T[],
  key: (item: T) => K,
): Record<K, T[]> {
  const out = {} as Record<K, T[]>
  for (const item of items) {
    const k = key(item)
    ;(out[k] ??= []).push(item)
  }
  return out
}

const people = [
  { name: "Ada", role: "engineer" as const },
  { name: "Grace", role: "admiral" as const },
  { name: "Linus", role: "engineer" as const },
]

const byRole = groupBy(people, (p) => p.role)

console.log(byRole.engineer.map((p) => p.name))
console.log(byRole.admiral.length)
```

**Reference:** [Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html) in the TypeScript Handbook.
