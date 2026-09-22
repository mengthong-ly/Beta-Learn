---
title: Passing props
section: 2 · Describing the UI
---

Components talk to each other with **props**. A parent passes information to a child by giving it props, the way you give attributes to an HTML tag. Unlike HTML attributes, a prop can be any JavaScript value: a string, a number, an object, an array, even a function.

## Pass them, then read them

Passing a prop looks like an attribute. Reading it happens in the child's parameter list, using **destructuring**:

```tsx
type Person = { name: string; imageId: string }

function getImageUrl(person: Person) {
  return "https://react.dev/images/docs/scientists/" + person.imageId + "s.jpg"
}

function Avatar({ person, size }: { person: Person; size: number }) {
  return <img className="avatar" src={getImageUrl(person)} alt={person.name} width={size} height={size} />
}

export default function Profile() {
  return (
    <div>
      <Avatar person={{ name: "Lin Lanying", imageId: "1bX5QH6" }} size={100} />
      <Avatar person={{ name: "Katsuko Saruhashi", imageId: "YfeOqp2" }} size={60} />
    </div>
  )
}
```

A component receives a single argument, the `props` object. `function Avatar({ person, size })` is just shorthand for reading `props.person` and `props.size`.

> ⚠️ **Gotcha:** don't forget the braces inside the parentheses. `function Avatar(person, size)` is wrong: the first argument is the whole props object, and there is no second one.

## Default values

Give a prop a fallback with `=` in the destructuring. The default is used only when the prop is **missing** or `undefined`. Passing `null` or `0` does *not* trigger it.

```tsx-snippet
function Avatar({ person, size = 100 }) {
  // ...
}
```

## Forwarding props

When a component passes all its props straight through, spread syntax saves typing:

```tsx-snippet
function Profile(props) {
  return (
    <div className="card">
      <Avatar {...props} />
    </div>
  )
}
```

Use it with restraint. If you spread props in every other component, something is wrong.

## Children

JSX nested inside a component's tag arrives as a special prop called `children`. Think of it as a hole the parent can fill with any JSX:

```tsx
import type { ReactNode } from "react"

function Card({ children }: { children: ReactNode }) {
  return <div style={{ border: "1px solid gray", borderRadius: 8, padding: 12 }}>{children}</div>
}

export default function Profile() {
  return (
    <Card>
      <h2>Katsuko Saruhashi</h2>
      <p>Geochemist</p>
    </Card>
  )
}
```

## Props are read-only

Props can differ from one render to the next, but a component never changes its own props. They're an immutable snapshot. When something needs to change in response to the user, the component asks its parent for *new* props, or uses **state**, which is coming up soon.

## Challenge

> 🎯 **Challenge:** Two things are broken. `Card` ignores what's nested inside it, so nothing shows up. And the second `Avatar` has no `size`. Make `Card` render its `children`, and give `size` a default of `100`.

```tsx starter
import type { ReactNode } from "react"

type Person = { name: string; imageId: string }

function Avatar({ person, size }: { person: Person; size?: number }) {
  const src = "https://react.dev/images/docs/scientists/" + person.imageId + "s.jpg"
  return <img className="avatar" src={src} alt={person.name} width={size} height={size} />
}

function Card({ children }: { children: ReactNode }) {
  return <div className="card"></div>
}

export default function Profile() {
  return (
    <Card>
      <Avatar person={{ name: "Katsuko Saruhashi", imageId: "YfeOqp2" }} size={80} />
      <Avatar person={{ name: "Aklilu Lemma", imageId: "OKS67lh" }} />
    </Card>
  )
}
```

```tsx solution
import type { ReactNode } from "react"

type Person = { name: string; imageId: string }

function Avatar({ person, size = 100 }: { person: Person; size?: number }) {
  const src = "https://react.dev/images/docs/scientists/" + person.imageId + "s.jpg"
  return <img className="avatar" src={src} alt={person.name} width={size} height={size} />
}

function Card({ children }: { children: ReactNode }) {
  return <div className="card">{children}</div>
}

export default function Profile() {
  return (
    <Card>
      <Avatar person={{ name: "Katsuko Saruhashi", imageId: "YfeOqp2" }} size={80} />
      <Avatar person={{ name: "Aklilu Lemma", imageId: "OKS67lh" }} />
    </Card>
  )
}
```

```tsx check
const imgs = $$(".card img")
expect(imgs.length === 2, "Card should render both avatars passed as children")
expect(imgs[0].getAttribute("width") === "80", "The first avatar keeps size 80")
expect(imgs[1].getAttribute("width") === "100", "An avatar without a size should default to 100")
```

**Reference:** [Passing Props to a Component](https://react.dev/learn/passing-props-to-a-component) on react.dev.
