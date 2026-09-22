---
title: Function types
section: 4 · More on Functions
---

Functions are values: you pass them around as callbacks. A **function type expression** describes one, and it looks like an arrow function:

```typescript
function greeter(fn: (a: string) => void) {
  fn("Hello, World")
}

function printToConsole(s: string) {
  console.log(s)
}

greeter(printToConsole)
```

`(a: string) => void` means "a function that takes one `string` and returns nothing useful". The parameter name is required: `(string) => void` would mean a parameter *named* `string` of type `any`. Pass a function with the wrong shape and it's rejected:

```typescript
function greeter(fn: (a: string) => void) {
  fn("Hello, World")
}

greeter((n: number) => {}) // error! Types of parameters 'n' and 'a' are incompatible.
```

Name the type with an alias when you reuse it: `type GreetFunction = (a: string) => void`.

## Call signatures

A function that also carries properties is described with a **call signature** inside an object type. Note the `:` before the return type, not `=>`:

```typescript
type DescribableFunction = {
  description: string
  (someArg: number): boolean
}

function doSomething(fn: DescribableFunction) {
  console.log(fn.description + " returned " + fn(6))
}

function myFunc(someArg: number) {
  return someArg > 3
}
myFunc.description = "default description"
doSomething(myFunc)
```

## Optional, default and rest parameters

`x?: T` makes a parameter optional, so inside it's `T | undefined`. A default value (`x = 10`) makes it optional too, but inside it's always a `T`. A rest parameter collects the remaining arguments into an array:

```typescript
function greet(name: string, greeting = "Hello", punctuation?: string) {
  return `${greeting}, ${name}${punctuation ?? "!"}`
}

function multiply(n: number, ...m: number[]) {
  return m.map((x) => n * x)
}

console.log(greet("Ada"), greet("Bo", "Hi", "?"))
console.log(multiply(10, 1, 2, 3, 4))
```

> ⚠️ **Gotcha:** don't mark a *callback's* parameter optional unless you really call it without that argument. `index?: number` forces every callback to handle `undefined`:

```typescript
function myForEach(arr: number[], callback: (arg: number, index?: number) => void) {
  for (let i = 0; i < arr.length; i++) callback(arr[i], i)
}

myForEach([1, 2, 3], (a, i) => console.log(i.toFixed())) // error! 'i' is possibly 'undefined'.
```

## Destructuring parameters

The type goes after the whole pattern, not inside it:

```typescript
type ABC = { a: number; b: number; c: number }

function sum({ a, b, c }: ABC) {
  console.log(a + b + c)
}

sum({ a: 1, b: 2, c: 3 })
```

## Challenge

> 🎯 **Challenge:** Declare a type alias `Transform` for "a function that takes a number and returns a number". Then make `applyAll` pass `value` through every function in `fns`, in order, and return the result.

```typescript starter
// declare Transform here

export function applyAll(value: number, ...fns: Transform[]): number {
  return value
}

console.log(applyAll(2, (n) => n + 1, (n) => n * 10))
```

```typescript solution
type Transform = (n: number) => number

export function applyAll(value: number, ...fns: Transform[]): number {
  let result = value
  for (const fn of fns) result = fn(result)
  return result
}

console.log(applyAll(2, (n) => n + 1, (n) => n * 10))
```

```typescript check
expect(lesson.applyAll(2, (n) => n + 1, (n) => n * 10) === 30, "applyAll(2, +1, ×10) should be 30")
expect(lesson.applyAll(2, (n) => n * 10, (n) => n + 1) === 21, "The functions run in order: ×10 then +1 gives 21")
expect(lesson.applyAll(5) === 5, "With no functions, return the value unchanged")
```

**Reference:** [More on Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html) in the TypeScript Handbook.
