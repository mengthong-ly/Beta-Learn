---
title: Property modifiers
section: 5 · Object Types
---

Each property in an object type can say more than its type: whether it's optional, whether it can be reassigned, and what the unknown keys look like.

## Optional properties with defaults

An optional property may be `undefined`. Destructuring with a default gives you a plain value to work with:

```typescript
interface PaintOptions {
  shape: string
  xPos?: number
  yPos?: number
}

function paintShape({ shape, xPos = 0, yPos = 0 }: PaintOptions) {
  console.log(`${shape} at (${xPos}, ${yPos})`) // xPos and yPos are numbers
}

paintShape({ shape: "circle" })
paintShape({ shape: "square", xPos: 5 })
```

## readonly

`readonly` stops a property from being reassigned. Like every type, it's checked by the compiler only and has no effect at runtime.

```typescript
interface SomeType {
  readonly prop: string
}

function doSomething(obj: SomeType) {
  obj.prop = "hello" // error! Cannot assign to 'prop' because it is a read-only property.
}
```

It's shallow: the property can't point somewhere new, but the object it holds can still change inside.

```typescript
interface Home {
  readonly resident: { name: string; age: number }
}

const home: Home = { resident: { name: "Ada", age: 36 } }
home.resident.age++ // fine: resident itself wasn't reassigned
console.log(home.resident.age)
```

## Index signatures

When you don't know the property names ahead of time, but you know what the values look like, use an **index signature**. `[player: string]: number` means "any string key holds a number":

```typescript
interface Scores {
  [player: string]: number
}

const scores: Scores = { ada: 10 }
scores.grace = 7
scores["linus"] = 3
console.log(scores)
```

Every named property then has to match the index signature too:

```typescript
interface NumberDictionary {
  [index: string]: number
  length: number // fine
  name: string // error! Property 'name' of type 'string' is not assignable to 'string' index type 'number'.
}
```

## Excess property checks

An object literal written straight into a typed spot gets an extra check: properties the type doesn't know about are flagged, since they're usually typos.

```typescript
interface SquareConfig {
  color?: string
  width?: number
}

function createSquare(config: SquareConfig) {
  return config
}

createSquare({ colour: "red", width: 100 }) // error! 'colour' does not exist in type 'SquareConfig'. Did you mean to write 'color'?
```

> 💡 **Tip:** the check only applies to fresh object literals. Assign the object to a variable first and it's skipped, which also means the `colour` typo slips through.

## Challenge

> 🎯 **Challenge:** Give `WordCounts` an index signature (any string key holds a `number`). Then make `countWords` count each word of `text.split(" ")`, so `"the cat and the hat"` gives `{ the: 2, cat: 1, and: 1, hat: 1 }`.

```typescript starter
interface WordCounts {
  // add an index signature here
}

export function countWords(text: string): WordCounts {
  const counts: WordCounts = {}
  // count each word here
  return counts
}

console.log(countWords("the cat and the hat"))
```

```typescript solution
interface WordCounts {
  [word: string]: number
}

export function countWords(text: string): WordCounts {
  const counts: WordCounts = {}
  for (const word of text.split(" ")) {
    counts[word] = (counts[word] ?? 0) + 1
  }
  return counts
}

console.log(countWords("the cat and the hat"))
```

```typescript check
const c = lesson.countWords("the cat and the hat")
expect(c["the"] === 2, '"the" appears twice')
expect(c["cat"] === 1 && c["hat"] === 1, '"cat" and "hat" appear once')
expect(c["dog"] === undefined, "Words that never appear shouldn't be keys")
expect(Object.keys(lesson.countWords("a b a")).length === 2, '"a b a" has 2 distinct words')
```

**Reference:** [Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html) in the TypeScript Handbook.
