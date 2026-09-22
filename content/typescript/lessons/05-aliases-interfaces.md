---
title: Type aliases & interfaces
section: 2 · Everyday Types
---

Writing `{ x: number; y: number }` everywhere gets old fast. A **type alias** gives any type a name:

```typescript
type Point = {
  x: number
  y: number
}
type ID = number | string // aliases can name unions too

function printCoord(pt: Point) {
  console.log(`(${pt.x}, ${pt.y})`)
}

printCoord({ x: 100, y: 100 })
const id: ID = "abc-1"
console.log(id)
```

An alias is *only* a name. `type Email = string` doesn't create a new kind of string: any string still fits.

## Interfaces

An **interface** is another way to name an object type:

```typescript
interface Point {
  x: number
  y: number
}

function printCoord(pt: Point) {
  console.log(`(${pt.x}, ${pt.y})`)
}

const origin = { x: 0, y: 0 } // never mentions Point
printCoord(origin)
```

`origin` was never declared as a `Point`, yet it's accepted. TypeScript only cares about the **shape**: it has an `x` and a `y` that are numbers, so it fits. This is called structural typing.

## Extending

An interface grows with `extends`. A type alias does the same job with an **intersection** (`&`), which combines two types into one:

```typescript
interface Animal {
  name: string
}
interface Bear extends Animal {
  honey: boolean
}

type Fish = Animal & { fins: number }

const bear: Bear = { name: "Pooh", honey: true }
const fish: Fish = { name: "Nemo", fins: 3 }
console.log(bear.name, bear.honey, fish.name, fish.fins)
```

## The main difference

Declaring the same interface twice **merges** the two, adding fields to it. A type alias can't be reopened after it's created:

```typescript
interface Settings {
  theme: string
}
interface Settings {
  fontSize: number
}

const s: Settings = { theme: "dark", fontSize: 14 } // needs both fields
console.log(s)
```

```typescript
type Settings = { theme: string }
type Settings = { fontSize: number } // error! Duplicate identifier 'Settings'.
```

> 💡 **Tip:** the Handbook's advice is to use `interface` until you need something only `type` can do, like naming a union.

## Challenge

> 🎯 **Challenge:** Declare an interface `CartItem` that extends `Product` with a `quantity: number`. Then make `lineTotal` return price × quantity.

```typescript starter
interface Product {
  name: string
  price: number
}

// declare CartItem here

export function lineTotal(item: CartItem): number {
  return 0
}

console.log(lineTotal({ name: "Pen", price: 2, quantity: 3 }))
```

```typescript solution
interface Product {
  name: string
  price: number
}

interface CartItem extends Product {
  quantity: number
}

export function lineTotal(item: CartItem): number {
  return item.price * item.quantity
}

console.log(lineTotal({ name: "Pen", price: 2, quantity: 3 }))
```

```typescript check
expect(lesson.lineTotal({ name: "Pen", price: 2, quantity: 3 }) === 6, "A pen at 2 × 3 should total 6")
expect(lesson.lineTotal({ name: "Mug", price: 4.5, quantity: 2 }) === 9, "A mug at 4.5 × 2 should total 9")
```

**Reference:** [Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html) in the TypeScript Handbook.
