---
title: Arrays, any & functions
section: 2 · Everyday Types
---

An array type is the element type followed by `[]`. `Array<number>` means exactly the same thing: pick whichever reads better to you.

```typescript
const scores: number[] = [90, 85, 77]
const names: Array<string> = ["Ada", "Grace"]
scores.push(100)
console.log(scores, names)
```

The element type is enforced on every change:

```typescript
const scores: number[] = [90, 85, 77]
scores.push("A") // error! Argument of type 'string' is not assignable to parameter of type 'number'.
```

## any

`any` switches type checking off for a value. You can call it, read any property, assign it anywhere. The compiler trusts you completely, so this compiles and then crashes when it runs:

```typescript
const obj: any = { x: 0 }
obj.foo() // error! Compiles, then fails at runtime: obj.foo is not a function
```

When TypeScript can't work out a type it falls back to `any`. Strict mode's `noImplicitAny` turns that silent fallback into an error, so `any` only appears where you wrote it.

## Function parameters and return values

Annotate each parameter after its name, and the return type after the parameter list:

```typescript
function greet(name: string): string {
  return "Hello, " + name.toUpperCase() + "!!"
}

console.log(greet("Ada"))
```

You rarely need the return annotation, since TypeScript infers it from your `return` statements. Writing one anyway makes the compiler check the body against your intent:

```typescript
function getFavoriteNumber(): number {
  return "26" // error! Type 'string' is not assignable to type 'number'.
}
```

An `async` function returns a promise, so its return type is `Promise<T>`:

```typescript
async function getFavoriteNumber(): Promise<number> {
  return 26
}

console.log(await getFavoriteNumber())
```

## Contextual typing

Callbacks usually need no annotations. TypeScript knows `names` is a `string[]`, so it knows what `forEach` passes in: `s` is a `string`.

```typescript
const names = ["Alice", "Bob", "Eve"]
names.forEach((s) => {
  console.log(s.toUpperCase())
})
```

> 💡 **Tip:** annotate the parameters of functions you declare. Let inference handle variables and callbacks.

## Challenge

> 🎯 **Challenge:** `total` has no types, so strict mode rejects it. Annotate `prices` as an array of numbers, make it return a `number`, and have it return the sum of the prices (`0` for an empty array).

```typescript starter
export function total(prices) {
  return 0
}

console.log(total([4.5, 3, 2.5]))
```

```typescript solution
export function total(prices: number[]): number {
  let sum = 0
  for (const price of prices) sum += price
  return sum
}

console.log(total([4.5, 3, 2.5]))
```

```typescript check
expect(lesson.total([4.5, 3, 2.5]) === 10, "total([4.5, 3, 2.5]) should be 10")
expect(lesson.total([1, 2, 3, 4]) === 10, "total([1, 2, 3, 4]) should be 10")
expect(lesson.total([]) === 0, "total([]) should be 0")
```

**Reference:** [Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html) in the TypeScript Handbook.
