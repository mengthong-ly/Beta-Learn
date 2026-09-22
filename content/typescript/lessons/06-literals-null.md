---
title: Literal types & null
section: 2 · Everyday Types
---

A type can be one *exact* value. `let` can change later, so TypeScript infers the general type. `const` can't, so it infers the **literal type**:

```typescript
let changing = "Hello World" // type: string
changing = "Olá Mundo"

const constant = "Hello World" // type: "Hello World"
console.log(changing, constant)
```

One literal on its own isn't much use. A union of them is: a parameter that accepts only a fixed set of values.

```typescript
function printText(s: string, alignment: "left" | "right" | "center") {
  console.log(`${s} (${alignment})`)
}

printText("Hello, world", "left")
```

A typo is caught at the call:

```typescript
function printText(s: string, alignment: "left" | "right" | "center") {}

printText("G'day, mate", "centre") // error! Argument of type '"centre"' is not assignable to parameter of type '"center" | "left" | "right"'.
```

`boolean` itself is just the union `true | false`.

## as const

Object properties can be reassigned, so their literals widen: `method: "GET"` becomes a plain `string`, and a function that wants `"GET" | "POST"` rejects it. Add `as const` and the whole object keeps its literal types:

```typescript
function handleRequest(url: string, method: "GET" | "POST") {
  console.log(method, url)
}

const req = { url: "https://example.com", method: "GET" } as const
handleRequest(req.url, req.method)
```

## Type assertions

Sometimes you know more than the compiler. `as` tells it which type to use. `JSON.parse` returns `any`, so asserting its shape is common:

```typescript
const user = JSON.parse('{"name":"Ada"}') as { name: string }
console.log(user.name.toUpperCase())
```

An assertion is erased before the code runs: nothing checks it at runtime, so a wrong one is a bug waiting to happen. TypeScript does block assertions that can't possibly be right:

```typescript
const x = "hello" as number // error! Conversion of type 'string' to type 'number' may be a mistake
```

## null and undefined

With `strictNullChecks` (part of `strict`), `null` and `undefined` aren't hidden inside every type. If a value can be `null`, its type says so, and you must check before using it:

```typescript
function shout(x: string | null) {
  return x.toUpperCase() // error! 'x' is possibly 'null'.
}
```

```typescript
function shout(x: string | null) {
  if (x === null) return "(silence)"
  return x.toUpperCase()
}

console.log(shout("hi"), shout(null))
```

A postfix `!` asserts "this isn't null or undefined". Like `as`, it does nothing at runtime, so use it only when you're sure:

```typescript
const big = [3, 1, 2].find((n) => n > 2)! // find returns number | undefined
console.log(big.toFixed(1))
```

## Challenge

> 🎯 **Challenge:** Make `parseAlign` return `"left"`, `"right"` or `"center"` when the input matches one of them, ignoring case (`"LEFT"` → `"left"`), and `null` for anything else.

```typescript starter
type Align = "left" | "right" | "center"

export function parseAlign(s: string): Align | null {
  return s
}

console.log(parseAlign("LEFT"), parseAlign("centre"))
```

```typescript solution
type Align = "left" | "right" | "center"

export function parseAlign(s: string): Align | null {
  const lower = s.toLowerCase()
  if (lower === "left" || lower === "right" || lower === "center") return lower
  return null
}

console.log(parseAlign("LEFT"), parseAlign("centre"))
```

```typescript check
expect(lesson.parseAlign("LEFT") === "left", 'parseAlign("LEFT") should be "left"')
expect(lesson.parseAlign("Center") === "center", 'parseAlign("Center") should be "center"')
expect(lesson.parseAlign("right") === "right", 'parseAlign("right") should be "right"')
expect(lesson.parseAlign("centre") === null, 'parseAlign("centre") should be null')
```

**Reference:** [Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html) in the TypeScript Handbook.
