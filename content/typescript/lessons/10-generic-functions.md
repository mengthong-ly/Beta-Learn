---
title: Generic functions
section: 4 · More on Functions
---

What type does "the first element of an array" have? It depends on the array. A **type parameter** in angle brackets links the input type to the output type:

```typescript
function firstElement<Type>(arr: Type[]): Type | undefined {
  return arr[0]
}

const s = firstElement(["a", "b", "c"]) // s: string | undefined
const n = firstElement([1, 2, 3]) // n: number | undefined
console.log(s?.toUpperCase(), n?.toFixed(1))
```

You never wrote `firstElement<string>`. TypeScript **inferred** `Type` from the argument. It works with several type parameters too:

```typescript
function map<Input, Output>(arr: Input[], func: (arg: Input) => Output): Output[] {
  return arr.map(func)
}

const parsed = map(["1", "2", "3"], (n) => parseInt(n)) // Input = string, Output = number
console.log(parsed)
```

## Constraints

Inside a generic function, `Type` could be *anything*, so you can't assume it has any properties. `extends` adds a **constraint**: `Type` must be something with a `length`.

```typescript
function longest<Type extends { length: number }>(a: Type, b: Type) {
  return a.length >= b.length ? a : b
}

console.log(longest([1, 2], [1, 2, 3])) // Type = number[]
console.log(longest("alice", "bob"))
```

Numbers have no `length`, so they don't meet the constraint:

```typescript
function longest<Type extends { length: number }>(a: Type, b: Type) {
  return a.length >= b.length ? a : b
}

longest(10, 100) // error! Argument of type 'number' is not assignable to parameter of type '{ length: number; }'.
```

## Specifying type arguments

Sometimes inference picks a type you didn't mean. Here it infers `Type = number` from the first array, then rejects the string:

```typescript
function combine<Type>(arr1: Type[], arr2: Type[]): Type[] {
  return arr1.concat(arr2)
}

combine([1, 2, 3], ["hello"]) // error! Type 'string' is not assignable to type 'number'.
```

Spell the type argument out and it works:

```typescript
function combine<Type>(arr1: Type[], arr2: Type[]): Type[] {
  return arr1.concat(arr2)
}

console.log(combine<string | number>([1, 2, 3], ["hello"]))
```

> 💡 **Tip:** a type parameter should relate two things, usually an input and the output. If it appears only once, you probably don't need it: `greet<S extends string>(s: S)` is just `greet(s: string)`.

## Challenge

> 🎯 **Challenge:** `longestOf` should return the item with the greatest `length` (or `undefined` for an empty array), and keep the item's type: a `string[]` in means a `string` out. The compiler rejects `.length` on a bare `T`. Add a constraint to fix it.

```typescript starter
export function longestOf<T>(items: T[]): T | undefined {
  let best = items[0]
  for (const item of items) {
    if (item.length > best.length) best = item
  }
  return best
}

console.log(longestOf(["a", "abc", "ab"]))
```

```typescript solution
export function longestOf<T extends { length: number }>(items: T[]): T | undefined {
  let best = items[0]
  for (const item of items) {
    if (item.length > best.length) best = item
  }
  return best
}

console.log(longestOf(["a", "abc", "ab"]))
```

```typescript check
const word: string | undefined = lesson.longestOf(["a", "abc", "ab"])
expect(word === "abc", 'longestOf(["a", "abc", "ab"]) should be "abc"')
expect(lesson.longestOf([[1], [1, 2], [3, 4]])?.join() === "1,2", "Works on arrays too, and keeps the first on a tie")
expect(lesson.longestOf([]) === undefined, "An empty array gives undefined")
```

**Reference:** [More on Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html) in the TypeScript Handbook.
