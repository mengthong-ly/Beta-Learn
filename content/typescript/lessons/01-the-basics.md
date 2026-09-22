---
title: The compiler
section: 1 · The Basics
---

JavaScript only finds out what a value is when the code runs. TypeScript is a **static type checker**: it reads your code *before* it runs and stops you when something can't work. Every example in this course goes through the real `tsc` compiler first, and only runs if it passes.

```typescript
const message = "hello!"
console.log(message.toUpperCase())
```

Try calling the string instead. The compiler refuses, and nothing runs:

```typescript
const message = "hello!"
message() // error! This expression is not callable. Type 'String' has no call signatures.
```

## Bugs that don't throw

Plenty of JavaScript bugs never crash. They just quietly give you `undefined` or the wrong answer. TypeScript flags those too, like a typo in a method name:

```typescript
const announcement = "Hello World!"
console.log(announcement.toLocaleLowercase()) // error! Did you mean 'toLocaleLowerCase'?
```

Or a function you forgot to call:

```typescript
function flipCoin() {
  return Math.random < 0.5 // error! Operator '<' cannot be applied to types '() => number' and 'number'.
}
```

## Explicit types

You can say what a parameter must be with a **type annotation**. Now every call is checked against it:

```typescript
function greet(person: string, date: Date) {
  console.log(`Hello ${person}, it's ${date.getFullYear()}!`)
}

greet("Maddison", new Date(2026, 0, 15))
```

`Date()` without `new` returns a string, not a `Date`, and the compiler notices:

```typescript
function greet(person: string, date: Date) {
  console.log(`Hello ${person}, it's ${date.getFullYear()}!`)
}

greet("Maddison", Date()) // error! Argument of type 'string' is not assignable to parameter of type 'Date'.
```

## Types are erased

Annotations only exist for the checker. `tsc` removes them when it writes the JavaScript file, so they never change what your program does at runtime:

```text
function greet(person, date) {
  console.log(`Hello ${person}, it's ${date.getFullYear()}!`)
}
```

## Strict mode

This course compiles with `strict` on, which switches on the stricter checks. Two you'll meet all the time: **noImplicitAny** rejects parameters whose type TypeScript can't work out, and **strictNullChecks** makes you handle `null` and `undefined` yourself.

```typescript
function greet(person, date) {} // error! Parameter 'person' implicitly has an 'any' type.
```

> 💡 **Tip:** a red error isn't a failure. It's the compiler finding a bug before your users do.

## Challenge

> 🎯 **Challenge:** The compiler rejects this program. Fix the bugs it reports, one at a time, so it logs `Hello Maddison, it is 2026!`.

```typescript starter
function greet(person: string, year: number) {
  return `Hello ${person}, it is ${year}!`
}

const launch = new Date(2026, 0, 15)
console.log(greet("Maddison", launch.getFullyear))
```

```typescript solution
function greet(person: string, year: number) {
  return `Hello ${person}, it is ${year}!`
}

const launch = new Date(2026, 0, 15)
console.log(greet("Maddison", launch.getFullYear()))
```

```typescript check
expect(output[0] === "Hello Maddison, it is 2026!", "Log exactly: Hello Maddison, it is 2026!")
```

**Reference:** [The Basics](https://www.typescriptlang.org/docs/handbook/2/basic-types.html) in the TypeScript Handbook.
