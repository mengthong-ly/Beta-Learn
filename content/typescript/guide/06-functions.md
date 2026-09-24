---
title: Functions
section: Guide Book
summary: Parameter and return typing, optional and rest parameters, overloads, `this`, and how contextual typing saves you from annotating callbacks.
---
## Annotating

Annotate parameters. Let the return type be inferred unless you want the compiler to hold you to a contract.

```typescript
function add(a: number, b: number): number {
  return a + b
}

const multiply = (a: number, b: number) => a * b       // return inferred: number

const divide: (a: number, b: number) => number = (a, b) => a / b   // params inferred

console.log(add(2, 3), multiply(2, 3), divide(6, 3))
```

> 💡 **Tip:** An explicit return type on an exported function is worth the keystrokes. Without one, a mistake inside the body silently changes the function's public type and the error surfaces at some distant call site instead of here.

## Optional, default and rest parameters

```typescript
function greet(name: string, greeting = "Hello", punct?: string): string {
  return `${greeting}, ${name}${punct ?? "!"}`
}

console.log(greet("Ada"))
console.log(greet("Ada", "Hi"))
console.log(greet("Ada", "Hi", "?"))

function sum(...nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0)
}

console.log(sum(1, 2, 3), sum(...[4, 5, 6]))

function tag(name: string, ...rest: [className: string, id?: string]): string {
  const [className, id] = rest
  return `${name}.${className}${id ? `#${id}` : ""}`
}

console.log(tag("div", "card"), tag("div", "card", "main"))
```

Optional parameters must come after required ones, and `punct?: string` is exactly `string | undefined` at the type level.

## Contextual typing

When a function is passed somewhere with a known shape, its parameters are typed for you.

```typescript
const nums = [1, 2, 3]

console.log(nums.map((n) => n * 2))              // n: number, no annotation needed
console.log(nums.filter((n) => n > 1))
console.log(nums.reduce((acc, n) => acc + n, 0)) // acc and n both number

type Handler = (event: { type: string; at: number }) => void

const log: Handler = (e) => console.log(e.type, e.at)  // e is typed from Handler
log({ type: "click", at: 1 })
```

> 🔍 **Behind the scenes: contextual typing flows inward**
>
> The compiler types an expression using the type expected at its position. That is why `nums.map((n) => …)` needs no annotation but `const f = (n) => …` is an error under `noImplicitAny` — there is no context to flow from. Extracting a callback into a named variable is the usual way people accidentally lose their inferred parameter types.

## Overloads

One implementation, several public signatures. The implementation signature is not callable — only the overloads are.

```typescript
function parse(input: string): string[]
function parse(input: string, asNumbers: true): number[]
function parse(input: string, asNumbers?: boolean): string[] | number[] {
  const parts = input.split(",").map((s) => s.trim())
  return asNumbers ? parts.map(Number) : parts
}

const words = parse("a, b, c")          // string[]
const nums = parse("1, 2, 3", true)     // number[]

console.log(words.map((w) => w.toUpperCase()))
console.log(nums.reduce((a, b) => a + b, 0))
```

> ⚠️ Prefer a union or a generic when one exists. Overloads have no relationship to the implementation beyond your promise: `function f(x: string): number` over a body returning a string compiles fine and lies to every caller.

A union parameter is usually clearer:

```typescript
function area(shape: { kind: "circle"; r: number } | { kind: "square"; side: number }): number {
  return shape.kind === "circle" ? Math.PI * shape.r ** 2 : shape.side ** 2
}

console.log(area({ kind: "circle", r: 2 }).toFixed(2))
console.log(area({ kind: "square", side: 4 }))
```

## `this`

A fake first parameter named `this` types the receiver. It is erased like every other annotation.

```typescript
type Counter = {
  count: number
  increment(this: Counter, by: number): number
}

const c: Counter = {
  count: 0,
  increment(by) {
    this.count += by
    return this.count
  },
}

console.log(c.increment(5), c.increment(3))
```

Arrow functions have no `this` of their own — they capture the enclosing one, which is usually what you want in a callback:

```typescript
class Timer {
  private ticks = 0

  start(): number[] {
    const results: number[] = []
    const ids = [1, 2, 3]
    ids.forEach(() => {
      this.ticks++            // arrow: `this` is the Timer
      results.push(this.ticks)
    })
    return results
  }
}

console.log(new Timer().start())
```

## Functions that never return

```typescript
function fail(message: string): never {
  throw new Error(message)
}

function parsePort(v: string): number {
  const n = Number(v)
  if (!Number.isInteger(n)) fail(`Not a port: ${v}`)
  return n                       // narrowed: fail() cannot return
}

console.log(parsePort("8080"))

try {
  parsePort("abc")
} catch (e) {
  console.log((e as Error).message)
}
```

> 🔍 **Behind the scenes: `never` is what makes the code after a throw unreachable**
>
> Because `fail()` is typed `never`, the compiler knows the `if` branch cannot fall through — so it does not complain that `parsePort` might return `undefined`. Type the helper as `void` instead and the same code stops compiling. This is also how `process.exit()` and `assert.fail()` behave correctly in flow analysis.

## Callable and constructable types

```typescript
type Formatter = {
  (value: number): string      // callable
  locale: string               // ...with properties
}

const gbp = ((value: number) => `£${value.toFixed(2)}`) as Formatter
gbp.locale = "en-GB"

console.log(gbp(9.5), gbp.locale)

type PointCtor = new (x: number, y: number) => { x: number; y: number }

class Point {
  constructor(public x: number, public y: number) {}
}

const Ctor: PointCtor = Point
console.log(new Ctor(1, 2))
```

**Reference:** [More on Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html) in the TypeScript Handbook.
