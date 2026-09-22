---
title: Objects & unions
section: 2 · Everyday Types
---

An **object type** lists the properties a value must have and the type of each. Separate them with `;` or `,`.

```typescript
function printCoord(pt: { x: number; y: number }) {
  console.log(`x is ${pt.x}, y is ${pt.y}`)
}

printCoord({ x: 3, y: 7 })
```

Leave one out and the call is rejected:

```typescript
function printCoord(pt: { x: number; y: number }) {}

printCoord({ x: 3 }) // error! Property 'y' is missing in type '{ x: number; }'
```

## Optional properties

A `?` after the name makes a property optional. Its value might be `undefined`, so TypeScript makes you check before using it. Optional chaining (`?.`) is the short way:

```typescript
function printName(obj: { first: string; last?: string }) {
  if (obj.last !== undefined) {
    console.log(obj.first, obj.last.toUpperCase())
  } else {
    console.log(obj.first)
  }
  console.log(obj.last?.toUpperCase())
}

printName({ first: "Bob" })
printName({ first: "Alice", last: "Alisson" })
```

## Union types

A **union** `A | B` is a value that can be *any one* of those types:

```typescript
function printId(id: number | string) {
  console.log("Your ID is: " + id)
}

printId(101)
printId("202")
```

You can only do what's valid for *every* member. Strings have `toUpperCase`, numbers don't, so this is rejected:

```typescript
function printId(id: number | string) {
  console.log(id.toUpperCase()) // error! Property 'toUpperCase' does not exist on type 'string | number'.
}
```

## Narrowing a union

Check which member you have, and inside that branch TypeScript **narrows** the type for you. `typeof` works for primitives, `Array.isArray` for arrays:

```typescript
function welcome(x: string[] | string) {
  if (Array.isArray(x)) {
    console.log("Hello, " + x.join(" and ")) // x is string[] here
  } else {
    console.log("Welcome, lone traveler " + x) // x is string here
  }
}

welcome(["Ada", "Bo"])
welcome("Cy")
```

> 💡 **Tip:** if every member has the method (arrays and strings both have `slice`), you can call it without narrowing.

## Challenge

> 🎯 **Challenge:** `formatId` gets a `number | string`. Narrow it: numbers become `#` plus the number padded to 4 digits (`7` → `"#0007"`, use `String(id).padStart(4, "0")`), strings are upper-cased (`"ab12"` → `"AB12"`).

```typescript starter
export function formatId(id: number | string): string {
  return id.toUpperCase()
}

console.log(formatId(7), formatId("ab12"))
```

```typescript solution
export function formatId(id: number | string): string {
  if (typeof id === "number") {
    return "#" + String(id).padStart(4, "0")
  }
  return id.toUpperCase()
}

console.log(formatId(7), formatId("ab12"))
```

```typescript check
expect(lesson.formatId(7) === "#0007", 'formatId(7) should be "#0007"')
expect(lesson.formatId(1234) === "#1234", 'formatId(1234) should be "#1234"')
expect(lesson.formatId("ab12") === "AB12", 'formatId("ab12") should be "AB12"')
```

**Reference:** [Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html) in the TypeScript Handbook.
