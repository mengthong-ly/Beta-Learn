---
title: Readonly arrays & tuples
section: 5 · Object Types
---

`string[]` is shorthand for the generic type `Array<string>`. Its sibling `ReadonlyArray<string>`, or `readonly string[]`, is an array without the methods that change it. It's a promise from a function that it won't touch your array:

```typescript
function describe(values: readonly string[]) {
  const copy = values.slice() // reading is fine
  copy.push("!")
  console.log(values.length, copy)
}

describe(["a", "b"])
```

```typescript
function doStuff(values: readonly string[]) {
  values.push("hello!") // error! Property 'push' does not exist on type 'readonly string[]'.
}
```

A mutable array can go where a readonly one is expected, but not the other way round:

```typescript
let x: readonly string[] = []
let y: string[] = []
x = y // fine
y = x // error! The type 'readonly string[]' is 'readonly' and cannot be assigned to the mutable type 'string[]'.
```

## Tuples

A **tuple** is an array with a fixed length and a known type at each position. It's handy for returning a couple of values together:

```typescript
function show(pair: [string, number]) {
  const [name, score] = pair // name: string, score: number
  console.log(name.toUpperCase(), score.toFixed(1))
}

show(["ada", 9.5])
```

Reading past the end is caught:

```typescript
function show(pair: [string, number]) {
  const c = pair[2] // error! Tuple type '[string, number]' of length '2' has no element at index '2'.
}
```

## Optional and rest elements

A `?` marks an optional element (only at the end). A rest element `...T[]` allows any number of extra items:

```typescript
type Either2dOr3d = [number, number, number?]

function dims(coord: Either2dOr3d) {
  const [x, y, z] = coord // z: number | undefined
  console.log(`${coord.length}D:`, x, y, z ?? "-")
}

dims([1, 2])
dims([1, 2, 3])

type NameAgeFlags = [string, number, ...boolean[]]
const row: NameAgeFlags = ["world", 3, true, false, true]
console.log(row)
```

## Readonly tuples

`as const` on an array literal gives a **readonly tuple** of literal types. Accept `readonly [number, number]` so callers can pass one:

```typescript
const point = [3, 4] as const // readonly [3, 4]

function distanceFromOrigin([x, y]: readonly [number, number]) {
  return Math.sqrt(x ** 2 + y ** 2)
}

console.log(distanceFromOrigin(point))
```

## Challenge

> 🎯 **Challenge:** Make `minMax` take a **readonly** array of numbers and return a tuple `[min, max]` typed `[number, number]`. Hint: `Math.min(...nums)`.

```typescript starter
export function minMax(nums: number[]): number[] {
  return [0, 0]
}

console.log(minMax([3, 1, 4, 1, 5]))
```

```typescript solution
export function minMax(nums: readonly number[]): [number, number] {
  return [Math.min(...nums), Math.max(...nums)]
}

console.log(minMax([3, 1, 4, 1, 5]))
```

```typescript check
const [lo, hi]: [number, number] = lesson.minMax([3, 1, 4, 1, 5])
expect(lo === 1 && hi === 5, "minMax([3, 1, 4, 1, 5]) should be [1, 5]")
const data = [-2, 7, 0] as const
const r = lesson.minMax(data)
expect(r[0] === -2 && r[1] === 7, "minMax should accept a readonly array and give [-2, 7]")
```

**Reference:** [Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html) in the TypeScript Handbook.
