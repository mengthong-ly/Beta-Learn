---
title: How TypeScript runs your code
section: Guide Book
summary: TypeScript is a checker bolted onto a translator — and every type you write is deleted before anything runs.
---
TypeScript is two things wearing one name:

1. a **type checker** that reads your code and complains, and
2. a **translator** that deletes the types and emits JavaScript.

They are independent. The translator emits JavaScript even when the checker found errors, and the checker never runs at run time. Everything confusing about TypeScript follows from that split.

```text
main.ts ──► parse ──► bind ──► CHECK ──► emit ──► main.js ──► the JS engine runs it
                              (errors           (types
                               reported          deleted)
                               here)
```

## Types are erased

There is no type information at run time. None. A type annotation is a note to the compiler that is deleted before execution.

```typescript
interface User {
  name: string
  age: number
}

type Colour = "red" | "green"

function greet(u: User): string {
  return `Hello, ${u.name}`
}

// Everything above compiles to: one function, and nothing else.
console.log(greet({ name: "Ada", age: 36 }))
console.log(typeof greet)
console.log("User" in globalThis)   // false — the interface does not exist at run time
```

> 🔍 **Behind the scenes: which constructs survive erasure?**
>
> `interface`, `type`, annotations, generics, `as`, `satisfies` and `declare` are erased completely — they emit nothing. `class`, `enum` and `namespace` emit real JavaScript objects, because they have run-time behaviour. That asymmetry is why you can write `new User()` for a class but not for an interface, and why a `const enum` behaves differently from a normal one.

```typescript
class Point {
  constructor(public x: number, public y: number) {}
}

enum Direction {
  Up,
  Down,
}

console.log(typeof Point)              // "function" — classes are real
console.log(typeof Direction)          // "object"   — enums are real
console.log(Direction.Up, Direction[0]) // 0 'Up' — enums map both ways
```

## The checker cannot protect run-time data

This is the single most important consequence. A type annotation is a *claim*, and TypeScript believes it. If data arrives from a network, a file or a form, the annotation is a hope.

```typescript
// Pretend this came from fetch().
const raw: string = '{"name":"Ada","age":"thirty-six"}'

const user = JSON.parse(raw) as { name: string; age: number }

console.log(typeof user.age)          // "string" — the type said number
console.log(user.age * 2)             // NaN, and TypeScript is perfectly happy
```

The fix is a run-time check that *also* narrows the type — a type predicate:

```typescript
type User = { name: string; age: number }

function isUser(v: unknown): v is User {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as Record<string, unknown>).name === "string" &&
    typeof (v as Record<string, unknown>).age === "number"
  )
}

for (const raw of ['{"name":"Ada","age":36}', '{"name":"Ada","age":"36"}']) {
  const parsed: unknown = JSON.parse(raw)
  if (isUser(parsed)) {
    console.log("valid:", parsed.name, parsed.age * 2)
  } else {
    console.log("rejected:", raw)
  }
}
```

> 🧭 **Scenario:** An API changes `id` from a number to a string. Every type in the codebase still says `number`, the build is green, and the bug shows up as `id.toFixed is not a function` in production. Types describe intent at the boundary; only a parse-and-validate step describes reality.

## Errors do not stop the emit

By default `tsc` writes JavaScript even for a file it rejects. This is deliberate — it keeps a large migration runnable while you fix things — and it is why "it compiled" is not the same as "it type-checks".

```typescript
const n: number = "not a number" // error! Type 'string' is not assignable to type 'number'.
console.log(n)
```

The example above is marked as an error deliberately: it is what a failed check looks like. `noEmitOnError: true` in `tsconfig.json` turns the emit off when checking fails.

## Inference: most types you never write

The checker works out types from the values. Annotate boundaries — parameters, exported returns, empty containers — and let inference do the rest.

```typescript
let count = 0            // inferred: number
const name = "Ada"       // inferred: "Ada" — a literal type, because const
let mutable = "Ada"      // inferred: string — because let can be reassigned
const nums = [1, 2, 3]   // inferred: number[]
const pair = [1, "a"]    // inferred: (string | number)[], NOT a tuple

function double(n: number) {
  return n * 2           // return type inferred: number
}

console.log(count, name, mutable, nums.length, pair.length, double(21))
```

> 💡 **Tip:** Annotating `const name: string = "Ada"` is worse than writing nothing — it *widens* the inferred literal type `"Ada"` to `string` and throws away information. Let inference win unless you need to widen on purpose.

## Where the checker gets its knowledge

Built-in types come from the `lib.*.d.ts` files — declaration files that describe JavaScript itself with no implementation. `lib.esnext.d.ts` describes the language, `lib.dom.d.ts` describes the browser.

```typescript
// Every one of these is described in a lib file, not implemented in TypeScript.
console.log([1, 2, 3].at(-1))
console.log(Object.groupBy([1, 2, 3, 4], (n) => (n % 2 ? "odd" : "even")))
console.log(structuredClone({ a: { b: 1 } }))
console.log(new Intl.NumberFormat("en-GB").format(1234567.891))
```

Choosing the wrong `lib` is the cause of "Property 'at' does not exist on type 'number[]'" — the method exists in your runtime, but the compiler was told to describe an older one.

## In this course

Your code is compiled by a real TypeScript 6 compiler running in your browser, with `strict: true`, then executed in a sandboxed frame. Type errors are reported before anything runs — exactly as `tsc` would.

**Reference:** [The TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) and [TypeScript for JavaScript Programmers](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html).
