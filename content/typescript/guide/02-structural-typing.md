---
title: Structural typing & assignability
section: Guide Book
summary: TypeScript compares shapes, not names — plus the top and bottom types, excess property checks, and when the rules are deliberately unsound.
---
Most typed languages are **nominal**: a `User` is a `User` because it was declared as one. TypeScript is **structural**: a value is a `User` if it has the right shape, whatever it was called when it was made.

```typescript
interface Point {
  x: number
  y: number
}

class Vector {
  constructor(public x: number, public y: number) {}
}

function length(p: Point): number {
  return Math.hypot(p.x, p.y)
}

console.log(length({ x: 3, y: 4 }))        // an object literal
console.log(length(new Vector(3, 4)))      // a class that never heard of Point
console.log(length({ x: 3, y: 4, z: 9 } as Point))  // extra properties are fine
```

`Vector` does not `implement Point`. It does not need to. It has an `x: number` and a `y: number`, so it *is* a `Point`.

## Assignability: "is this shape at least that shape?"

`A` is assignable to `B` when `A` has everything `B` requires, with compatible types. Extra members are allowed — that is **width subtyping**.

```typescript
type Named = { name: string }
type Person = { name: string; age: number }

const person: Person = { name: "Ada", age: 36 }
const named: Named = person // fine: Person has everything Named needs

console.log(named.name)

const backwards: Person = named // error! Property 'age' is missing in type 'Named'.
```

> 🔍 **Behind the scenes: why "extra is fine" is the right default**
>
> A function that needs `{ name }` cannot be broken by a value that also has `age` — it will never look at `age`. Requiring an exact match would mean every function needed its own exactly-shaped input type, and passing a richer object anywhere would require stripping fields. Width subtyping is what makes structural typing usable.

## Excess property checks: the exception

The rule above has one deliberate hole. When you assign an **object literal** directly, TypeScript flags properties the target does not declare — because a literal written on the spot is almost always a typo rather than a deliberate wider value.

```typescript
type Options = { width: number; height?: number }

const a: Options = { width: 10, heigth: 20 } // error! 'heigth' does not exist in type 'Options'.
```

Assign it through a variable first, and the check does not apply — the value is no longer a fresh literal:

```typescript
type Options = { width: number; height?: number }

const raw = { width: 10, heigth: 20 }
const b: Options = raw // no error: raw is not a fresh object literal

console.log(b.width, (raw as { heigth: number }).heigth)
```

> ⚠️ This is worth internalising: the excess property check is a **lint rule for literals**, not part of assignability. It catches typos at the call site and nothing deeper. If you need real exactness, validate at run time.

## Top types: `unknown` and `any`

Both accept anything. Only one keeps you safe.

```typescript
let u: unknown = "hello"
let a: any = "hello"

console.log(a.toUpperCase())     // allowed — any turns checking OFF
// console.log(u.toUpperCase())  // rejected — unknown requires a check first

if (typeof u === "string") {
  console.log(u.toUpperCase())   // narrowed to string, now allowed
}

const n: number = a              // any is assignable to everything
console.log(n)
```

```typescript
let u: unknown = "hello"
const n: number = u // error! Type 'unknown' is not assignable to type 'number'.
```

> 💡 **Tip:** `unknown` is the correct type for anything crossing a boundary — `JSON.parse`, a `catch` variable, a message from a worker. It forces exactly one narrowing check at the edge and then gives you real types everywhere inside. `any` is a request to stop checking, and it spreads: every property of an `any` is also `any`.

## Bottom type: `never`

`never` is the type with no values. Nothing is assignable to it, and it is assignable to everything.

```typescript
function fail(message: string): never {
  throw new Error(message)
}

function forever(): never {
  while (true) {}
}

// never disappears from a union, because it contributes no values:
type A = string | never // just string

const s: A = "still a string"
console.log(s, typeof fail, typeof forever)
```

Its most useful job is **exhaustiveness checking**:

```typescript
type Shape =
  | { kind: "circle"; r: number }
  | { kind: "square"; side: number }

function area(s: Shape): number {
  switch (s.kind) {
    case "circle":
      return Math.PI * s.r ** 2
    case "square":
      return s.side ** 2
    default: {
      const exhaustive: never = s // fails to compile if a new kind is added
      return exhaustive
    }
  }
}

console.log(area({ kind: "circle", r: 1 }).toFixed(2))
console.log(area({ kind: "square", side: 3 }))
```

Add `{ kind: "triangle" }` to `Shape` and the `default` branch stops compiling — the compiler tells you every place that needs updating.

## `void` versus `undefined`

`void` means "the return value is not meaningful", not "returns undefined". A function returning something *is* assignable to a `void`-returning type.

```typescript
type Callback = () => void

const cb: Callback = () => 42 // allowed — the caller promises to ignore it

console.log(cb())             // 42 at run time, typed as void

const nums = [1, 2, 3]
const copy: number[] = []
nums.forEach((n) => copy.push(n)) // push returns number; forEach wants void
console.log(copy)
```

> 🔍 **Behind the scenes: why `void` is lenient here**
>
> If it were not, `forEach((n) => copy.push(n))` would be an error, because `Array.push` returns the new length. Every callback that happened to return something would need a block body and an explicit discard. The rule — "a function that returns more than required is still substitutable" — is standard function subtyping, and `void` at the return position simply means "I will not look".

## Functions: where the rules get subtle

Return types behave as you would expect — a more specific return is fine. Parameters are the surprising part, and TypeScript deliberately has **two** rules depending on how the function type was written.

A function type written as a **property** (`handle: (e) => void`) is checked *contravariantly* — the sound direction. A handler demanding more than the caller provides is rejected:

```typescript
type Listener = {
  handle: (e: { type: string }) => void
}

const needsMore = (e: { type: string; button: number }) => {
  console.log(e.type, e.button)
}

const l: Listener = { handle: needsMore } // error! Types of parameters 'e' and 'e' are incompatible.
```

The same thing written with **method syntax** (`handle(e): void`) is checked *bivariantly*, and the identical assignment is allowed:

```typescript
interface Listener {
  handle(e: { type: string }): void       // method syntax
}

const needsMore = (e: { type: string; button: number }) => {
  console.log(e.type, e.button ?? "(missing)")
}

const l: Listener = { handle: needsMore } // allowed — and unsound

l.handle({ type: "click" })               // e.button is undefined at run time
```

> 🔍 **Behind the scenes: two rules, one for compatibility**
>
> Bivariant parameters are unsound, and everybody knows it. `strictFunctionTypes` fixes it — but only for function *properties*, never for methods. The reason is `lib.dom.d.ts` and the array methods: `Array<Dog>` would stop being assignable to `Array<Animal>` under sound rules, because `push(x: Dog)` and `push(x: Animal)` are incompatible in the strict direction. Rather than break every existing codebase, TypeScript exempted method syntax. Write callback types as properties and you get the sound rule for free.

## Fewer parameters is always fine

```typescript
const nums = [10, 20, 30]

console.log(nums.map((n) => n * 2))            // ignores index and array
console.log(nums.map((n, i) => `${i}:${n}`))   // takes what it needs

function on(event: string, cb: (a: number, b: number) => void) {
  cb(1, 2)
}

on("tick", () => console.log("ignored both"))
on("tick", (a) => console.log("took one:", a))
```

A function that accepts fewer parameters can always stand in for one that accepts more — the extras are simply not read. This is why callbacks in TypeScript almost never need to list every parameter.

**Reference:** [Type Compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html) in the TypeScript Handbook.
