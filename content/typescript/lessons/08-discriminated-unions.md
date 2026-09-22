---
title: Type guards & discriminated unions
section: 3 · Narrowing
---

## Type predicates

You can write your own narrowing check. Give the function the return type `pet is Fish`, a **type predicate**, and TypeScript narrows whatever you pass it whenever it returns `true`:

```typescript
type Fish = { name: string; swim: () => void }
type Bird = { name: string; fly: () => void }

function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined
}

const zoo: (Fish | Bird)[] = [
  { name: "Nemo", swim: () => {} },
  { name: "Tweety", fly: () => {} },
  { name: "Dory", swim: () => {} },
]

const fish: Fish[] = zoo.filter(isFish) // filter narrows with it too
console.log(fish.map((f) => f.name))
```

## Discriminated unions

Here's a tempting way to model shapes, with optional fields for each kind. It doesn't work: TypeScript can't tell that a circle always has a `radius`.

```typescript
interface Shape {
  kind: "circle" | "square"
  radius?: number
  sideLength?: number
}

function getArea(shape: Shape) {
  return Math.PI * shape.radius ** 2 // error! 'shape.radius' is possibly 'undefined'.
}
```

Instead, make one type per kind, each with the **same property** holding a different literal. That shared property is the *discriminant*. Checking it narrows to exactly one member:

```typescript
interface Circle {
  kind: "circle"
  radius: number
}
interface Square {
  kind: "square"
  sideLength: number
}
type Shape = Circle | Square

function getArea(shape: Shape) {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2 // shape is a Circle
    case "square":
      return shape.sideLength ** 2 // shape is a Square
  }
}

console.log(getArea({ kind: "square", sideLength: 3 }))
console.log(getArea({ kind: "circle", radius: 1 }).toFixed(2))
```

## never and exhaustiveness

`never` is the type with no values. After every case is handled, nothing is left, so the value's type in `default` is `never`. Assign it to a `never` variable, and the day someone adds a new shape, the compiler points you to every `switch` that forgot it:

```typescript
interface Circle { kind: "circle"; radius: number }
interface Square { kind: "square"; sideLength: number }
interface Triangle { kind: "triangle"; sideLength: number }
type Shape = Circle | Square | Triangle

function getArea(shape: Shape) {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2
    case "square":
      return shape.sideLength ** 2
    default:
      const unreachable: never = shape // error! Type 'Triangle' is not assignable to type 'never'.
      return unreachable
  }
}
```

## Challenge

> 🎯 **Challenge:** A `Rect` shape was added, and the exhaustiveness check caught it. Add the missing case so `perimeter` handles rectangles: `2 × (width + height)`.

```typescript starter
interface Circle { kind: "circle"; radius: number }
interface Square { kind: "square"; sideLength: number }
interface Rect { kind: "rect"; width: number; height: number }
type Shape = Circle | Square | Rect

export function perimeter(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return 2 * Math.PI * shape.radius
    case "square":
      return 4 * shape.sideLength
    default:
      const unreachable: never = shape
      return unreachable
  }
}

console.log(perimeter({ kind: "rect", width: 2, height: 3 }))
```

```typescript solution
interface Circle { kind: "circle"; radius: number }
interface Square { kind: "square"; sideLength: number }
interface Rect { kind: "rect"; width: number; height: number }
type Shape = Circle | Square | Rect

export function perimeter(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return 2 * Math.PI * shape.radius
    case "square":
      return 4 * shape.sideLength
    case "rect":
      return 2 * (shape.width + shape.height)
    default:
      const unreachable: never = shape
      return unreachable
  }
}

console.log(perimeter({ kind: "rect", width: 2, height: 3 }))
```

```typescript check
expect(lesson.perimeter({ kind: "rect", width: 2, height: 3 }) === 10, "A 2 × 3 rect has perimeter 10")
expect(lesson.perimeter({ kind: "square", sideLength: 2 }) === 8, "A square with side 2 has perimeter 8")
expect(Math.abs(lesson.perimeter({ kind: "circle", radius: 1 }) - 2 * Math.PI) < 1e-9, "A circle of radius 1 has perimeter 2π")
```

**Reference:** [Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) in the TypeScript Handbook.
