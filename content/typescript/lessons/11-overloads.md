---
title: Overloads & special types
section: 4 · More on Functions
---

Some functions can be called in a few distinct ways. **Overload signatures** list each way, and one implementation below them handles them all:

```typescript
function makeDate(timestamp: number): Date
function makeDate(m: number, d: number, y: number): Date
function makeDate(mOrTimestamp: number, d?: number, y?: number): Date {
  if (d !== undefined && y !== undefined) return new Date(y, mOrTimestamp, d)
  return new Date(mOrTimestamp)
}

console.log(makeDate(0).toISOString())
console.log(makeDate(0, 15, 2026).getFullYear())
```

Callers only see the overloads, never the implementation signature. So two arguments is an error, even though the implementation would accept it:

```typescript
function makeDate(timestamp: number): Date
function makeDate(m: number, d: number, y: number): Date
function makeDate(mOrTimestamp: number, d?: number, y?: number): Date {
  return new Date(mOrTimestamp)
}

makeDate(1, 3) // error! No overload expects 2 arguments, but overloads do exist that expect either 1 or 3 arguments.
```

> 💡 **Tip:** prefer a union parameter over overloads when you can. `len(x: any[] | string)` accepts a value that might be either. Two overloads for `string` and `any[]` would reject it.

## unknown

`unknown` is the safe version of `any`: it can hold anything, but you can't *do* anything with it until you narrow it.

```typescript
function f(a: unknown) {
  a.b() // error! 'a' is of type 'unknown'.
}
```

```typescript
function describe(value: unknown): string {
  if (typeof value === "string") return `a string of length ${value.length}`
  if (Array.isArray(value)) return `an array of ${value.length}`
  return typeof value
}

console.log(describe(JSON.parse('"hi"')), describe(JSON.parse("[1,2]")), describe(JSON.parse("3")))
```

## never

A function that always throws never returns, so its return type is `never`. TypeScript knows code after a call to it can't run:

```typescript
function fail(msg: string): never {
  throw new Error(msg)
}

function divide(a: number, b: number): number {
  if (b === 0) fail("can't divide by zero")
  return a / b
}

console.log(divide(10, 4))
try {
  divide(1, 0)
} catch (e) {
  console.log((e as Error).message)
}
```

## void, object and Function

`void` is the return type of a function that returns nothing. A function *declared* with `: void` can't return a value:

```typescript
function log(msg: string): void {
  return true // error! Type 'boolean' is not assignable to type 'void'.
}
```

But a callback *typed* as returning `void` may return something, which is just ignored. That's why `forEach((el) => dst.push(el))` is fine even though `push` returns a number:

```typescript
const dst: number[] = []
;[1, 2, 3].forEach((el) => dst.push(el))
console.log(dst)
```

Two more: lowercase `object` means "any non-primitive value" (use it, not `Object`). `Function` accepts any function but its calls return `any`, so prefer a real function type like `() => void`.

## Challenge

> 🎯 **Challenge:** `parse` turns a string into a number, or a string array into a number array. Its union return type means callers get `number | number[]` either way. Add two overload signatures so `parse("42")` is typed `number` and `parse(["1", "2"])` is typed `number[]`.

```typescript starter
export function parse(input: string | string[]): number | number[] {
  return Array.isArray(input) ? input.map(Number) : Number(input)
}

console.log(parse("42"), parse(["1", "2.5"]))
```

```typescript solution
export function parse(input: string): number
export function parse(input: string[]): number[]
export function parse(input: string | string[]): number | number[] {
  return Array.isArray(input) ? input.map(Number) : Number(input)
}

console.log(parse("42"), parse(["1", "2.5"]))
```

```typescript check
const one: number = lesson.parse("42")
const many: number[] = lesson.parse(["1", "2.5"])
expect(one === 42, 'parse("42") should be 42')
expect(many.join() === "1,2.5", 'parse(["1", "2.5"]) should be [1, 2.5]')
```

**Reference:** [More on Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html) in the TypeScript Handbook.
