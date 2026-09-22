---
title: Primitives & inference
section: 2 · Everyday Types
---

JavaScript has three very common primitives, `string`, `number` and `boolean`, and each has a TypeScript type of the same name. A **type annotation** goes after the name, never before it:

```typescript
let myName: string = "Alice"
let age: number = 36 // no int or float: every number is a number
let isAdmin: boolean = false
console.log(myName, age, isAdmin)
```

Always write the lowercase types. `String`, `Number` and `Boolean` are legal but mean special built-in object types you'll rarely want.

## Inference

Most of the time you don't need annotations: TypeScript **infers** a variable's type from its initial value.

```typescript
let greeting = "Hello" // inferred as string
greeting = "Hi"
console.log(greeting.toUpperCase())
```

Once a type is known, the compiler stops you mixing it up. Press Run on this one: the compiler rejects it before anything runs.

```typescript
let count = 1
count = "two" // error! Type 'string' is not assignable to type 'number'.
```

## Challenge

> 🎯 **Challenge:** Declare `language` (a `string`, `"TypeScript"`), `version` (a `number`, `7`) and `typed` (a `boolean`, `true`), then log `TypeScript 7 true`.

```typescript starter
// declare language, version and typed here

```

```typescript solution
export const language: string = "TypeScript"
export const version: number = 7
export const typed: boolean = true
console.log(language, version, typed)
```

```typescript check
expect(output[0] === "TypeScript 7 true", "Log exactly: TypeScript 7 true")
```

**Reference:** [Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html) in the TypeScript Handbook.
