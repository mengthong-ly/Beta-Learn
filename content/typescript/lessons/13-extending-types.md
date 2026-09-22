---
title: Extending & generic types
section: 5 · Object Types
---

## Extending interfaces

`extends` copies members from other types into a new interface. You can extend several at once:

```typescript
interface Colorful {
  color: string
}
interface Circle {
  radius: number
}
interface ColorfulCircle extends Colorful, Circle {}

const cc: ColorfulCircle = { color: "red", radius: 42 }
console.log(cc)
```

## Intersection types

`A & B` builds a type with **all** the members of both, without declaring a new interface:

```typescript
interface Colorful {
  color: string
}
interface Circle {
  radius: number
}

function draw(circle: Colorful & Circle) {
  console.log(`A ${circle.color} circle, radius ${circle.radius}`)
}

draw({ color: "blue", radius: 7 })
```

The two differ when members clash. An interface that redeclares a property with a different type is an error on the spot. An intersection silently gives that property the type `never`, so you only find out when you try to use it.

```typescript
interface Person {
  name: string
}
interface Person {
  name: number // error! Subsequent property declarations must have the same type.
}
```

## Generic object types

A box that holds a string, a box that holds a number... Rather than one interface for each, give the interface a **type parameter**. `Box<string>` is then a box whose `contents` is a `string`:

```typescript
interface Box<Type> {
  contents: Type
}

function setContents<Type>(box: Box<Type>, newContents: Type) {
  box.contents = newContents
}

const box: Box<string> = { contents: "hello" }
setContents(box, "world")
console.log(box.contents.toUpperCase())
```

Type aliases can be generic too, which makes small reusable helper types:

```typescript
type OrNull<Type> = Type | null
type OneOrMany<Type> = Type | Type[]

const tags: OrNull<OneOrMany<string>> = ["ts", "js"]
console.log(tags)
```

## Challenge

> 🎯 **Challenge:** Declare a generic type `Timestamped<T>`: everything in `T` plus `createdAt: number` (use `&`). Then make `stamp` return a **new** object with `value`'s properties and the `createdAt`, without changing `value`.

```typescript starter
// declare Timestamped<T> here

export function stamp<T extends object>(value: T, createdAt: number): Timestamped<T> {
  return value
}

const s = stamp({ name: "Ada" }, 1000)
console.log(s)
```

```typescript solution
type Timestamped<T> = T & { createdAt: number }

export function stamp<T extends object>(value: T, createdAt: number): Timestamped<T> {
  return { ...value, createdAt }
}

const s = stamp({ name: "Ada" }, 1000)
console.log(s)
```

```typescript check
const s = lesson.stamp({ name: "Ada", age: 36 }, 1000)
const name: string = s.name
expect(name === "Ada" && s.age === 36, "Keep every property of value")
expect(s.createdAt === 1000, "Add createdAt")
const original = { id: 1 }
lesson.stamp(original, 5)
expect(!("createdAt" in original), "Return a new object instead of changing value")
```

**Reference:** [Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html) in the TypeScript Handbook.
