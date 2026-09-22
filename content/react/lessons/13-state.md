---
title: "State: a component's memory"
section: 3 · Adding Interactivity
---

Components often need to *remember* things: the current slide, what's typed in a box, what's in the cart. That memory is called **state**.

## Why a plain variable doesn't work

This gallery keeps its position in a local variable. Click **Next**: nothing happens.

```tsx
const sculptures = [
  { name: "Homenaje a la Neurocirugía", artist: "Marta Colvin Andrade" },
  { name: "Floralis Genérica", artist: "Eduardo Catalano" },
  { name: "Eternal Presence", artist: "John Woodrow Wilson" },
]

export default function Gallery() {
  let index = 0

  function handleClick() {
    index = index + 1 // changes the variable, but nobody re-renders
  }

  const sculpture = sculptures[index]
  return (
    <>
      <button onClick={handleClick}>Next</button>
      <h2>
        <i>{sculpture.name}</i> by {sculpture.artist}
      </h2>
    </>
  )
}
```

Two things go wrong:

1. **Local variables don't survive between renders.** Each render starts from scratch, so `index` is `0` again.
2. **Changing a local variable doesn't trigger a render.** React has no idea anything changed.

## `useState`

To update a component you need to **retain** data between renders and **trigger** a new render. The `useState` Hook does both:

```tsx
import { useState } from "react"

const sculptures = [
  { name: "Homenaje a la Neurocirugía", artist: "Marta Colvin Andrade" },
  { name: "Floralis Genérica", artist: "Eduardo Catalano" },
  { name: "Eternal Presence", artist: "John Woodrow Wilson" },
]

export default function Gallery() {
  const [index, setIndex] = useState(0)
  const [showMore, setShowMore] = useState(false)

  const sculpture = sculptures[index]
  return (
    <>
      <button onClick={() => setIndex((index + 1) % sculptures.length)}>Next</button>
      <h2>
        <i>{sculpture.name}</i> by {sculpture.artist}
      </h2>
      <h3>
        ({index + 1} of {sculptures.length})
      </h3>
      <button onClick={() => setShowMore(!showMore)}>{showMore ? "Hide" : "Show"} details</button>
      {showMore && <p>Sculpture #{index + 1} of this small collection.</p>}
    </>
  )
}
```

`useState(0)` returns a pair, which you unpack with array destructuring: the current value and a **setter** function. Name them `[something, setSomething]` by convention.

Here's what happens:

1. **First render:** `useState(0)` returns `[0, setIndex]`, and React remembers `0`.
2. **You click:** `setIndex(1)` tells React to remember `1`, and triggers another render.
3. **Next render:** React sees `useState(0)` again, but it remembers you set it to `1`, so it returns `[1, setIndex]`.

A component can have as many state variables as it needs, of any type.

## Hooks

Functions that start with `use` are **Hooks**. They're only available while React is rendering, and let you "hook into" React features.

> ⚠️ **Gotcha:** call Hooks only at the **top level** of your component or your own Hooks. Never inside conditions, loops or nested functions.

> 🔍 **Behind the scenes: how React knows which state is which**
>
> You never give `useState` a name. Instead, React relies on the **call order**. For each component, it keeps a list of state pairs and a counter that starts at `0` before each render. Every `useState` call returns the next pair and moves the counter along. That's why Hooks must run in the same order on every render.

## State is private

State belongs to one component **instance** on the screen. Render `<Gallery />` twice and each copy has its own, completely separate state. A parent can't read or change a child's state either.

## Challenge

> 🎯 **Challenge:** Clicking **Next** on the last sculpture crashes the gallery. Add a **Previous** button, and disable each button at its end: **Previous** on the first sculpture, **Next** on the last.

```tsx starter
import { useState } from "react"

const sculptures = [
  { name: "Homenaje a la Neurocirugía", artist: "Marta Colvin Andrade" },
  { name: "Floralis Genérica", artist: "Eduardo Catalano" },
  { name: "Eternal Presence", artist: "John Woodrow Wilson" },
]

export default function Gallery() {
  const [index, setIndex] = useState(0)
  const sculpture = sculptures[index]
  return (
    <>
      <button onClick={() => setIndex(index + 1)}>Next</button>
      <h2>
        <i>{sculpture.name}</i> by {sculpture.artist}
      </h2>
      <h3>
        ({index + 1} of {sculptures.length})
      </h3>
    </>
  )
}
```

```tsx solution
import { useState } from "react"

const sculptures = [
  { name: "Homenaje a la Neurocirugía", artist: "Marta Colvin Andrade" },
  { name: "Floralis Genérica", artist: "Eduardo Catalano" },
  { name: "Eternal Presence", artist: "John Woodrow Wilson" },
]

export default function Gallery() {
  const [index, setIndex] = useState(0)
  const sculpture = sculptures[index]
  return (
    <>
      <button onClick={() => setIndex(index - 1)} disabled={index === 0}>
        Previous
      </button>
      <button onClick={() => setIndex(index + 1)} disabled={index === sculptures.length - 1}>
        Next
      </button>
      <h2>
        <i>{sculpture.name}</i> by {sculpture.artist}
      </h2>
      <h3>
        ({index + 1} of {sculptures.length})
      </h3>
    </>
  )
}
```

```tsx check
const button = (label: string) => $$("button").find((b) => b.textContent.trim() === label) as HTMLButtonElement | undefined
const prev = button("Previous")
const next = button("Next")
expect(prev && next, "Show a Previous and a Next button")
expect(prev!.disabled, "Previous should be disabled on the first sculpture")
await click(next!)
await click(next!)
expect($("h3")?.textContent === "(3 of 3)", "Next should move through the sculptures")
expect(next!.disabled, "Next should be disabled on the last sculpture")
await click(prev!)
expect($("h3")?.textContent === "(2 of 3)", "Previous should go back one sculpture")
```

**Reference:** [State: A Component's Memory](https://react.dev/learn/state-a-components-memory) on react.dev.
