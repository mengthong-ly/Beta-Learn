---
title: JavaScript in JSX with curly braces
section: 2 · Describing the UI
---

Quotes pass a fixed string. Curly braces open a **window into JavaScript**: inside them, any JavaScript expression works, including variables and function calls.

```tsx
const today = new Date()

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date)
}

export default function TodoList() {
  const name = "Gregorio Y. Zara"
  return (
    <h1>
      {name}'s To Do List for {formatDate(today)}
    </h1>
  )
}
```

## Where braces work

You can use curly braces in only two places:

1. **As text** directly inside a tag: `<h1>{name}'s To Do List</h1>`. A tag name like `<{tag}>` does **not** work.
2. **As an attribute value**, right after the `=`: `src={avatar}`. Writing `src="{avatar}"` passes the literal text `"{avatar}"`.

```tsx
const avatar = "https://react.dev/images/docs/scientists/7vQD0fPs.jpg"
const description = "Gregorio Y. Zara"

export default function Avatar() {
  return <img className="avatar" src={avatar} alt={description} width={100} />
}
```

## Double curlies

To pass a JavaScript object in JSX, you wrap the object's own braces in the JSX braces: `{{ ... }}`. You'll see this most for inline styles. There's nothing special about it: it's just an object inside braces.

Inline style properties are written in **camelCase**: HTML's `background-color` becomes `backgroundColor`.

```tsx
const person = {
  name: "Gregorio Y. Zara",
  theme: { backgroundColor: "black", color: "pink" },
}

export default function TodoList() {
  return (
    <div style={person.theme}>
      <h1>{person.name}'s Todos</h1>
      <ul style={{ fontStyle: "italic", paddingBlock: 8 }}>
        <li>Improve the videophone</li>
        <li>Prepare aeronautics lectures</li>
      </ul>
    </div>
  )
}
```

Because JSX is this thin, you organize data and logic with plain JavaScript, and JSX just shows the result.

## Challenge

> 🎯 **Challenge:** The image URL is built from three parts: `baseUrl`, `person.imageId` and `person.imageSize`, followed by `.jpg`. Right now the markup passes them as a literal string, and the heading is hard-coded. Use curly braces so the `<img>` points at the real photo and the heading reads `Gregorio Y. Zara's Todos` from `person.name`.

```tsx starter
const baseUrl = "https://react.dev/images/docs/scientists/"
const person = {
  name: "Gregorio Y. Zara",
  imageId: "7vQD0fP",
  imageSize: "s",
  theme: { backgroundColor: "black", color: "pink" },
}

export default function TodoList() {
  return (
    <div style={person.theme}>
      <h1>Somebody's Todos</h1>
      <img src="{baseUrl}{person.imageId}{person.imageSize}.jpg" alt={person.name} />
    </div>
  )
}
```

```tsx solution
const baseUrl = "https://react.dev/images/docs/scientists/"
const person = {
  name: "Gregorio Y. Zara",
  imageId: "7vQD0fP",
  imageSize: "s",
  theme: { backgroundColor: "black", color: "pink" },
}

export default function TodoList() {
  return (
    <div style={person.theme}>
      <h1>{person.name}'s Todos</h1>
      <img src={baseUrl + person.imageId + person.imageSize + ".jpg"} alt={person.name} />
    </div>
  )
}
```

```tsx check
const src = $("img")?.getAttribute("src")
expect(src === "https://react.dev/images/docs/scientists/7vQD0fPs.jpg", `The src should be the full photo URL, got ${src}`)
expect($("h1")?.textContent === "Gregorio Y. Zara's Todos", "Build the heading from person.name")
```

**Reference:** [JavaScript in JSX with Curly Braces](https://react.dev/learn/javascript-in-jsx-with-curly-braces) on react.dev.
