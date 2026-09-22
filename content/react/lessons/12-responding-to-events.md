---
title: Responding to events
section: 3 · Adding Interactivity
---

An **event handler** is a function React calls when something happens: a click, a key press, a form submit. To add one, define a function inside your component and pass it as a prop, like `onClick`, on a JSX tag.

By convention, handlers are named `handle` plus the event: `handleClick`, `handleMouseEnter`.

```tsx
import { useState } from "react"

export default function Button() {
  const [message, setMessage] = useState("Not clicked yet")

  function handleClick() {
    setMessage("You clicked me!")
  }

  return (
    <>
      <button onClick={handleClick}>Click me</button>
      <p>{message}</p>
    </>
  )
}
```

> 💡 **Tip:** The official docs use `alert()` in these examples, but browsers block alerts inside ThongLearn's sandboxed preview. So these examples show a message on screen with `useState`, which you met in the Quick Start and learn properly in the next lesson.

## Pass the function, don't call it

The function you pass must be *passed*, not *called*:

| Passing (correct) | Calling (wrong) |
|---|---|
| `onClick={handleClick}` | `onClick={handleClick()}` |
| `onClick={() => setMessage("Hi")}` | `onClick={setMessage("Hi")}` |

With parentheses, the function runs **during rendering**, before anyone clicks. Wrapping it in an arrow function (an **inline handler**) creates a new function that React calls later.

## Handlers can read props

A handler is declared inside the component, so it sees the component's props. That lets a parent pass a handler down to a child as a prop. By convention, handler *props* start with `on` followed by a capital letter, and you can pick app-specific names like `onPlayMovie`:

```tsx
import { useState, type ReactNode } from "react"

function Button({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return <button onClick={onClick}>{children}</button>
}

function Toolbar({ onPlayMovie, onUploadImage }: { onPlayMovie: () => void; onUploadImage: () => void }) {
  return (
    <div>
      <Button onClick={onPlayMovie}>Play Movie</Button>
      <Button onClick={onUploadImage}>Upload Image</Button>
    </div>
  )
}

export default function App() {
  const [status, setStatus] = useState("Idle")
  return (
    <>
      <Toolbar onPlayMovie={() => setStatus("Playing!")} onUploadImage={() => setStatus("Uploading!")} />
      <p>{status}</p>
    </>
  )
}
```

Use the right HTML tag for the job: handle clicks on a `<button>`, not a `<div>`, so you get built-in behavior like keyboard navigation.

## Events bubble up

An event starts at the element you clicked and then **propagates** (bubbles) up the tree, calling each parent's handler too. All events propagate in React except `onScroll`. Click a button below and watch both counters:

```tsx
import { useState } from "react"

export default function Toolbar() {
  const [toolbarClicks, setToolbarClicks] = useState(0)
  const [plays, setPlays] = useState(0)
  return (
    <div style={{ padding: 16, background: "#eef" }} onClick={() => setToolbarClicks(toolbarClicks + 1)}>
      <button onClick={() => setPlays(plays + 1)}>Play Movie</button>
      <p>Play clicks: {plays}</p>
      <p>Toolbar clicks: {toolbarClicks}</p>
    </div>
  )
}
```

Every handler receives an **event object**, usually called `e`. Calling `e.stopPropagation()` stops the event from reaching parent handlers. Passing a handler down as a prop and calling it explicitly after `stopPropagation()` makes it clear exactly what runs.

> 🔍 **Behind the scenes: the capture phase**
>
> Events actually travel in three phases: first **down** the tree calling every `onClickCapture` handler, then the clicked element's `onClick`, then **up** calling every parent's `onClick`. Capture handlers run even if a child stops propagation. They're useful for code like routers or analytics, but you probably won't need them in app code.

## Preventing default behavior

Some events have browser defaults: submitting a `<form>` reloads the page. `e.preventDefault()` turns that off. It's a different thing from `stopPropagation()`, which only stops parent *handlers*.

```tsx
import { useState } from "react"

export default function Signup() {
  const [sent, setSent] = useState(false)
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setSent(true)
      }}
    >
      <input />
      <button>Send</button>
      {sent && <p>Submitting!</p>}
    </form>
  )
}
```

Unlike rendering, event handlers **don't need to be pure**. They're the best place for side effects, like changing state in response to a click.

## Challenge

> 🎯 **Challenge:** Wire up `ColorSwitch`: clicking its button should call `onChangeColor`. The click must **not** bubble up to the `<div>`, which counts clicks on the page. Use `e.stopPropagation()`.

```tsx starter
import { useState } from "react"

function ColorSwitch({ onChangeColor }: { onChangeColor: () => void }) {
  return <button>Change color</button>
}

const colors = ["white", "lightblue", "pink", "lightyellow"]

export default function App() {
  const [clicks, setClicks] = useState(0)
  const [color, setColor] = useState(0)

  return (
    <div id="page" style={{ backgroundColor: colors[color], padding: 24 }} onClick={() => setClicks(clicks + 1)}>
      <ColorSwitch onChangeColor={() => setColor((color + 1) % colors.length)} />
      <p>Clicks on the page: {clicks}</p>
    </div>
  )
}
```

```tsx solution
import { useState } from "react"

function ColorSwitch({ onChangeColor }: { onChangeColor: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onChangeColor()
      }}
    >
      Change color
    </button>
  )
}

const colors = ["white", "lightblue", "pink", "lightyellow"]

export default function App() {
  const [clicks, setClicks] = useState(0)
  const [color, setColor] = useState(0)

  return (
    <div id="page" style={{ backgroundColor: colors[color], padding: 24 }} onClick={() => setClicks(clicks + 1)}>
      <ColorSwitch onChangeColor={() => setColor((color + 1) % colors.length)} />
      <p>Clicks on the page: {clicks}</p>
    </div>
  )
}
```

```tsx check
const page = $("#page") as HTMLElement
await click($("button"))
expect(page.style.backgroundColor === "lightblue", "Clicking the button should call onChangeColor")
expect($("p")?.textContent === "Clicks on the page: 0", "The button click must not bubble up to the page's counter")
await click($("p"))
expect($("p")?.textContent === "Clicks on the page: 1", "Clicks elsewhere on the page should still be counted")
```

**Reference:** [Responding to Events](https://react.dev/learn/responding-to-events) on react.dev.
