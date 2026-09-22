---
title: Rendering lists
section: 2 · Describing the UI
---

To show a list, keep your data in an array and turn it into JSX with the array methods you already know: `map()` to transform each item, `filter()` to keep only some.

```tsx
const people = [
  { id: 0, name: "Creola Katherine Johnson", profession: "mathematician" },
  { id: 1, name: "Mario José Molina-Pasquel Henríquez", profession: "chemist" },
  { id: 2, name: "Mohammad Abdus Salam", profession: "physicist" },
  { id: 3, name: "Percy Lavon Julian", profession: "chemist" },
  { id: 4, name: "Subrahmanyan Chandrasekhar", profession: "astrophysicist" },
]

export default function List() {
  const chemists = people.filter((person) => person.profession === "chemist")
  const listItems = chemists.map((person) => (
    <li key={person.id}>
      <b>{person.name}:</b>
      {" " + person.profession}
    </li>
  ))
  return <ul>{listItems}</ul>
}
```

> ⚠️ **Gotcha:** an arrow function returns the expression right after `=>` automatically. But if you write `=> {`, it has a block body, and you must write `return` yourself. Otherwise `map()` gives you an array of `undefined`.

```tsx-snippet
const listItems = chemists.map((person) => {
  return <li key={person.id}>{person.name}</li>
})
```

## Keys

JSX elements directly inside a `map()` always need a `key`: a string or number that tells React which array item each element belongs to. When items move, get inserted or get deleted, the key lets React match them up.

Keys work like file names in a folder: the name identifies a file even after you re-sort the folder. Get them from your data:

- **Data from a database:** use its IDs, which are unique by nature.
- **Data you create locally:** use an incrementing counter or `crypto.randomUUID()` when you *create* the item.

Two rules:

1. Keys must be **unique among siblings**. The same key is fine in *different* arrays.
2. Keys must **not change**. Don't generate them while rendering.

> ⚠️ **Gotcha:** it's tempting to use the array index as the key, and that's exactly what React does if you don't pass one. But the index changes when items are inserted, deleted or reordered, which leads to subtle, confusing bugs. And `key={Math.random()}` is worse: keys never match between renders, so every component and DOM node is recreated each time.

Your component doesn't receive `key` as a prop: it's only a hint for React. If the component needs the ID, pass it separately: `<Profile key={id} userId={id} />`.

## Several nodes per item

The short `<>...</>` syntax can't take a key. When each item renders more than one node, use `<Fragment key={...}>`. It still leaves no trace in the DOM.

```tsx
import { Fragment } from "react"

const poem = [
  { id: 1, line: "I write, erase, rewrite" },
  { id: 2, line: "Erase again, and then" },
  { id: 3, line: "A poppy blooms." },
]

export default function Poem() {
  return (
    <article>
      {poem.map((item, i) => (
        <Fragment key={item.id}>
          {i > 0 && <hr />}
          <p>{item.line}</p>
        </Fragment>
      ))}
    </article>
  )
}
```

## Challenge

> 🎯 **Challenge:** Split the list in two: `#chemists` should list only the chemists, and `#others` everyone else. Give each `<li>` a key from the data.

```tsx starter
const people = [
  { id: 0, name: "Creola Katherine Johnson", profession: "mathematician" },
  { id: 1, name: "Mario José Molina-Pasquel Henríquez", profession: "chemist" },
  { id: 2, name: "Mohammad Abdus Salam", profession: "physicist" },
  { id: 3, name: "Percy Lavon Julian", profession: "chemist" },
  { id: 4, name: "Subrahmanyan Chandrasekhar", profession: "astrophysicist" },
]

export default function List() {
  const listItems = people.map((person) => (
    <li key={person.id}>
      <b>{person.name}:</b> {person.profession}
    </li>
  ))
  return (
    <article>
      <h2>Chemists</h2>
      <ul id="chemists">{listItems}</ul>
      <h2>Everyone else</h2>
      <ul id="others">{listItems}</ul>
    </article>
  )
}
```

```tsx solution
const people = [
  { id: 0, name: "Creola Katherine Johnson", profession: "mathematician" },
  { id: 1, name: "Mario José Molina-Pasquel Henríquez", profession: "chemist" },
  { id: 2, name: "Mohammad Abdus Salam", profession: "physicist" },
  { id: 3, name: "Percy Lavon Julian", profession: "chemist" },
  { id: 4, name: "Subrahmanyan Chandrasekhar", profession: "astrophysicist" },
]

type Person = (typeof people)[number]

function ListSection({ id, title, people }: { id: string; title: string; people: Person[] }) {
  return (
    <>
      <h2>{title}</h2>
      <ul id={id}>
        {people.map((person) => (
          <li key={person.id}>
            <b>{person.name}:</b> {person.profession}
          </li>
        ))}
      </ul>
    </>
  )
}

export default function List() {
  const chemists = people.filter((p) => p.profession === "chemist")
  const everyoneElse = people.filter((p) => p.profession !== "chemist")
  return (
    <article>
      <ListSection id="chemists" title="Chemists" people={chemists} />
      <ListSection id="others" title="Everyone else" people={everyoneElse} />
    </article>
  )
}
```

```tsx check
const chem = $$("#chemists li").map((li) => li.textContent)
const rest = $$("#others li").map((li) => li.textContent)
expect(chem.length === 2 && chem.every((t) => t.includes("chemist")), "#chemists should list exactly the two chemists")
expect(rest.length === 3 && rest.every((t) => !t.includes("chemist")), "#others should list the three non-chemists")
```

**Reference:** [Rendering Lists](https://react.dev/learn/rendering-lists) on react.dev.
