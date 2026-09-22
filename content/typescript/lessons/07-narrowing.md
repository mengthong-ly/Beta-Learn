---
title: Narrowing
section: 3 · Narrowing
---

A union type says "one of these". To use the value you need to know *which* one. You check it with ordinary JavaScript, and TypeScript follows your `if`s and `return`s to **narrow** the type in each branch.

## typeof

`typeof` returns one of `"string"`, `"number"`, `"bigint"`, `"boolean"`, `"symbol"`, `"undefined"`, `"object"` or `"function"`, and TypeScript understands every one:

```typescript
function padLeft(padding: number | string, input: string): string {
  if (typeof padding === "number") {
    return " ".repeat(padding) + input // padding is a number here
  }
  return padding + input // so it must be a string here
}

console.log(padLeft(4, "Hi") + "|")
console.log(padLeft(">> ", "Hi"))
```

Watch out: `typeof null` is `"object"`, a JavaScript accident. TypeScript knows, and keeps `null` in the narrowed type:

```typescript
function printAll(strs: string | string[] | null) {
  if (typeof strs === "object") {
    for (const s of strs) console.log(s) // error! 'strs' is possibly 'null'.
  }
}
```

## Truthiness

`0`, `NaN`, `""`, `0n`, `null` and `undefined` are falsy. Checking a value's truthiness first removes `null` and `undefined`:

```typescript
function printAll(strs: string | string[] | null) {
  if (strs && typeof strs === "object") {
    for (const s of strs) console.log(s)
  } else if (typeof strs === "string") {
    console.log(strs)
  }
}

printAll(["a", "b"])
printAll("c")
printAll(null)
```

> ⚠️ **Gotcha:** a truthiness check also throws away `""` and `0`, which are often real values.

## Equality

`===`, `!==` and `switch` narrow too. `x != null` is a handy one: loose equality removes **both** `null` and `undefined`.

```typescript
function double(value: number | null | undefined) {
  if (value != null) {
    return value * 2 // value is a number here
  }
  return 0
}

console.log(double(21), double(null), double(undefined))
```

## in and instanceof

`"prop" in obj` narrows to the union members that have that property. `x instanceof C` narrows to class instances:

```typescript
type Fish = { swim: () => void }
type Bird = { fly: () => void }

function move(animal: Fish | Bird) {
  if ("swim" in animal) return animal.swim()
  return animal.fly()
}

function logValue(x: Date | string) {
  if (x instanceof Date) console.log(x.toISOString())
  else console.log(x.toUpperCase())
}

move({ swim: () => console.log("splash") })
logValue(new Date(Date.UTC(2026, 0, 15)))
logValue("hello")
```

Narrowing never lets you break the **declared** type. A variable declared as `string | number` can hold either as you reassign it, but not a `boolean`:

```typescript
let x = Math.random() < 0.5 ? 10 : "hello world!" // string | number
x = 1
x = "goodbye!"
x = true // error! Type 'boolean' is not assignable to type 'string | number'.
```

## Challenge

> 🎯 **Challenge:** Finish `formatValue` so that:
>
> - `null` or `undefined` → `"none"`
> - a `Date` → its `toISOString()` cut to the first 10 characters (`"2026-01-15"`)
> - a number → `toFixed(1)` (`3.14159` → `"3.1"`)
> - a string → trimmed (`"  hi "` → `"hi"`)

```typescript starter
export function formatValue(x: string | number | Date | null | undefined): string {
  return String(x)
}

console.log(formatValue(3.14159), formatValue(null))
```

```typescript solution
export function formatValue(x: string | number | Date | null | undefined): string {
  if (x == null) return "none"
  if (x instanceof Date) return x.toISOString().slice(0, 10)
  if (typeof x === "number") return x.toFixed(1)
  return x.trim()
}

console.log(formatValue(3.14159), formatValue(null))
```

```typescript check
expect(lesson.formatValue(null) === "none", 'null should give "none"')
expect(lesson.formatValue(undefined) === "none", 'undefined should give "none"')
expect(lesson.formatValue(new Date(Date.UTC(2026, 0, 15))) === "2026-01-15", 'The date should give "2026-01-15"')
expect(lesson.formatValue(3.14159) === "3.1", '3.14159 should give "3.1"')
expect(lesson.formatValue("  hi ") === "hi", 'Strings should be trimmed')
```

**Reference:** [Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) in the TypeScript Handbook.
