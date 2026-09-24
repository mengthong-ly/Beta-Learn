---
title: Narrowing & control-flow analysis
section: Guide Book
summary: How the compiler follows your `if`s to work out what a value is — every narrowing tool, and the places the analysis gives up.
---
TypeScript reads your control flow. At every point in the program it tracks what each variable *could* be, and ordinary JavaScript checks shrink that set. This is **control-flow analysis**, and it is why well-typed TypeScript needs so few annotations inside a function.

## `typeof`

```typescript
function format(v: string | number | boolean): string {
  if (typeof v === "string") return v.toUpperCase()
  if (typeof v === "number") return v.toFixed(2)
  return v ? "yes" : "no"      // only boolean is left
}

console.log(format("abc"), format(3.14159), format(true))
```

The one trap: `typeof null === "object"`.

```typescript
function count(v: string[] | null): number {
  if (typeof v === "object") {
    return v.length // error! 'v' is possibly 'null'.
  }
  return 0
}
```

## Truthiness

Handy, and dangerous for anything that can legitimately be `0` or `""`.

```typescript
function greet(name: string | null | undefined): string {
  if (!name) return "Hello, stranger"
  return `Hello, ${name}`      // narrowed to string
}

console.log(greet("Ada"), "|", greet(null), "|", greet(""))
```

```typescript
function describe(n: number | undefined): string {
  if (!n) return "missing"            // 0 lands here too — probably a bug
  return `got ${n}`
}

function better(n: number | undefined): string {
  if (n === undefined) return "missing"
  return `got ${n}`
}

console.log(describe(0), "vs", better(0))
```

## Equality

Comparing two values narrows **both** of them.

```typescript
function compare(a: string | number, b: string | boolean): void {
  if (a === b) {
    // The only type both could be is string:
    console.log(a.toUpperCase(), b.toUpperCase())
  }
}

compare("same", "same")

function handle(v: string | null | undefined): string {
  if (v != null) return v.toUpperCase()   // != null removes BOTH null and undefined
  return "nothing"
}

console.log(handle("x"), handle(null), handle(undefined))
```

> 💡 **Tip:** `v != null` (loose `!=`) is the one place loose equality earns its keep: it excludes `null` *and* `undefined` in one check, and TypeScript understands it exactly.

## `in`

```typescript
type Fish = { swim: () => string }
type Bird = { fly: () => string }

function move(animal: Fish | Bird): string {
  if ("swim" in animal) return animal.swim()
  return animal.fly()
}

console.log(move({ swim: () => "swimming" }))
console.log(move({ fly: () => "flying" }))
```

## `instanceof`

```typescript
function describe(v: Date | string): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return v
}

console.log(describe(new Date("2026-01-15T00:00:00Z")))
console.log(describe("not a date"))

function report(e: unknown): string {
  if (e instanceof Error) return `${e.name}: ${e.message}`
  return `Non-error thrown: ${String(e)}`
}

try {
  throw new TypeError("bad input")
} catch (e) {
  console.log(report(e))
}

try {
  throw "a bare string"
} catch (e) {
  console.log(report(e))
}
```

> ⚠️ A `catch` variable is `unknown` under `useUnknownInCatchVariables` (part of `strict`), and that is correct: JavaScript lets you `throw` anything. Always narrow before touching `.message`.

## Discriminated unions

The workhorse. A shared property with literal types lets the compiler pick one member.

```typescript
type Result =
  | { ok: true; value: number }
  | { ok: false; error: string }

function unwrap(r: Result): number {
  if (r.ok) return r.value      // narrowed by a boolean literal
  throw new Error(r.error)
}

console.log(unwrap({ ok: true, value: 42 }))

try {
  unwrap({ ok: false, error: "nope" })
} catch (e) {
  console.log((e as Error).message)
}
```

## Type predicates

When the check is too complex for the compiler to follow, write a function that returns `v is T`.

```typescript
type Fish = { swim: () => string }
type Bird = { fly: () => string }

function isFish(pet: Fish | Bird): pet is Fish {
  return typeof (pet as Fish).swim === "function"
}

const zoo: (Fish | Bird)[] = [
  { swim: () => "splash" },
  { fly: () => "flap" },
]

const fish = zoo.filter(isFish)      // Fish[], not (Fish | Bird)[]
console.log(fish.length, fish[0]!.swim())
```

> 🔍 **Behind the scenes: a predicate is an unchecked promise**
>
> The compiler does **not** verify that the body of `isFish` actually proves `pet is Fish`. `function isFish(p: unknown): p is Fish { return true }` compiles, and every caller then trusts it. A type predicate moves the burden of proof from the compiler to you — which is exactly what makes it useful and exactly why the body deserves care.

## Assertion functions

Like a predicate, but it narrows by *throwing* instead of returning a boolean.

```typescript
function assertIsString(v: unknown): asserts v is string {
  if (typeof v !== "string") throw new TypeError(`Expected string, got ${typeof v}`)
}

function shout(v: unknown): string {
  assertIsString(v)
  return v.toUpperCase()     // narrowed from here on
}

console.log(shout("hello"))

try {
  shout(42)
} catch (e) {
  console.log((e as Error).message)
}
```

> ⚠️ An assertion function must have an **explicit type annotation** at its declaration. `const assertIsString = (v: unknown): asserts v is string => {…}` fails with "Assertions require every name in the call target to be declared with an explicit type annotation".

## Where the analysis gives up

Narrowing is per-variable and per-flow. Two situations reset it.

### Function boundaries

```typescript
function process(v: string | null): void {
  if (v === null) return

  // v is string here...
  const later = () => {
    console.log(v.toUpperCase())  // ...and still string: v is a const parameter
  }
  later()
}

process("ok")
```

But a `let` that a callback could reassign is not narrowable across the boundary:

```typescript
let value: string | null = "start"

function reset() {
  value = null
}

if (value !== null) {
  reset()
  console.log(value.toUpperCase()) // error! 'value' is possibly 'null'.
}
```

### Property narrowing survives calls — and that is unsound

Narrowing a *property* is kept across an arbitrary function call, even though the call could have reassigned it:

```typescript
type Box = { v: string | null }

function useIt(box: Box, run: () => void): void {
  if (box.v !== null) {
    run()                     // run() may well have set box.v = null
    console.log(box.v.length) // error! compiles, then throws at run time
  }
}

const box: Box = { v: "hello" }
useIt(box, () => {
  box.v = null
})
```

That example compiles cleanly and then throws `Cannot read properties of null` when it runs. The compiler was happy; the program was not.

> 🔍 **Behind the scenes: why not invalidate on every call?**
>
> Soundness here would mean discarding every property narrowing at every function call, since any call *might* mutate any reachable object. In practice that makes ordinary code unwritable — you would re-check `this.name` after each call in a method. TypeScript chose usability, and documents the gap. The habit that closes it costs one line:

```typescript
type Box = { v: string | null }

function useIt(box: Box, run: () => void): void {
  const v = box.v             // copy first
  if (v !== null) {
    run()
    console.log(v.length)     // safe: nothing else can reach this local
  }
}

const box: Box = { v: "hello" }
useIt(box, () => {
  box.v = null
})
```

Narrow a local `const`, not a property, whenever anything in between could run.

**Reference:** [Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) in the TypeScript Handbook.
