---
title: Refs & escaping React
section: Guide Book
summary: A mutable box that survives renders without causing them — for DOM nodes, timers, previous values and anything React should not manage.
---
## A ref is a box

`useRef` returns an object with one mutable property: `current`. Changing it does **not** trigger a render, and it survives every render.

```tsx
import { useRef, useState } from "react"

export default function App() {
  const renderCount = useRef(0)
  const [, forceRender] = useState(0)

  renderCount.current++

  return (
    <div>
      <p>renders so far: {renderCount.current}</p>
      <button onClick={() => forceRender((n) => n + 1)}>re-render</button>
    </div>
  )
}
```

| | `useState` | `useRef` |
| --- | --- | --- |
| Triggers a re-render | yes | **no** |
| Survives renders | yes | yes |
| Read during render | always safe | avoid — it may be stale or mutated |
| Use for | anything on screen | anything *not* on screen |

## Refs on DOM nodes

Pass a ref to a host element and React sets `current` to the DOM node at commit time.

```tsx
import { useRef } from "react"

export default function App() {
  const inputRef = useRef<HTMLInputElement>(null)

  function focusInput() {
    inputRef.current?.focus()
    inputRef.current?.select()
  }

  return (
    <div>
      <input ref={inputRef} defaultValue="click the button" />
      <button onClick={focusInput}>focus and select</button>
    </div>
  )
}
```

> ⚠️ `ref.current` is `null` during the first render — the DOM node does not exist yet. It is set before Effects run and cleared on unmount, which is why `?.` (or a null check) belongs on every access.

The legitimate uses are the ones React has no API for: focus, text selection, scrolling, measuring, and playing media.

```tsx
import { useRef } from "react"

export default function App() {
  const listRef = useRef<HTMLUListElement>(null)

  function scrollToBottom() {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }

  return (
    <div>
      <ul ref={listRef} style={{ maxHeight: 80, overflow: "auto" }}>
        {Array.from({ length: 10 }, (_, i) => (
          <li key={i}>row {i + 1}</li>
        ))}
      </ul>
      <button onClick={scrollToBottom}>scroll to bottom</button>
    </div>
  )
}
```

## `ref` is a normal prop now

In React 19, function components receive `ref` in props — `forwardRef` is no longer needed.

```tsx
import { useRef } from "react"

function TextField({ label, ref }: { label: string; ref?: React.Ref<HTMLInputElement> }) {
  return (
    <p>
      <label>
        {label} <input ref={ref} />
      </label>
    </p>
  )
}

export default function App() {
  const ref = useRef<HTMLInputElement>(null)

  return (
    <div>
      <TextField label="Name" ref={ref} />
      <button onClick={() => ref.current?.focus()}>focus the field</button>
    </div>
  )
}
```

> 🔍 **Behind the scenes: why `forwardRef` existed**
>
> `ref` and `key` used to be plucked out of props by React before your component ever saw them, so a wrapper component could not pass `ref` through — hence `forwardRef`, which existed purely to hand it over. React 19 makes `ref` an ordinary prop for function components, so the wrapper is gone. `forwardRef` still works, and class components still use the old mechanism.

## Callback refs

A function ref is called with the node on mount and — in React 19 — its return value is used as cleanup.

```tsx
import { useState } from "react"

export default function App() {
  const [width, setWidth] = useState(0)

  return (
    <div>
      <div
        ref={(node) => {
          if (node) setWidth(node.offsetWidth)
          return () => setWidth(0) // cleanup when it unmounts
        }}
      >
        measured on mount
      </div>
      <p>width: {width}px</p>
    </div>
  )
}
```

Callback refs are how you collect a ref per item in a list, which `useRef` alone cannot do.

```tsx
import { useRef } from "react"

const rows = ["alpha", "beta", "gamma"]

export default function App() {
  const nodes = useRef(new Map<string, HTMLLIElement>())

  function scrollTo(name: string) {
    nodes.current.get(name)?.scrollIntoView({ block: "nearest" })
  }

  return (
    <div>
      <ul>
        {rows.map((name) => (
          <li
            key={name}
            ref={(node) => {
              const map = nodes.current
              if (node) map.set(name, node)
              return () => map.delete(name)
            }}
          >
            {name}
          </li>
        ))}
      </ul>
      <button onClick={() => scrollTo("gamma")}>scroll to gamma</button>
    </div>
  )
}
```

## Refs for values, not just nodes

Anything that must persist without affecting the UI belongs in a ref.

```tsx
import { useEffect, useRef, useState } from "react"

export default function App() {
  const [count, setCount] = useState(0)
  const previous = useRef<number | undefined>(undefined)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    previous.current = count
  }, [count])

  function debouncedBump() {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCount((c) => c + 1), 300)
  }

  return (
    <div>
      <p>
        count: {count}, previous: {previous.current ?? "—"}
      </p>
      <button onClick={debouncedBump}>bump (debounced 300ms)</button>
    </div>
  )
}
```

A timer id in state would cause a pointless re-render every time it changed; in a ref it is invisible, which is exactly right.

## Do not read or write refs during render

```tsx
import { useRef, useState } from "react"

export default function App() {
  const ref = useRef(0)
  const [n, setN] = useState(0)

  // ✗ reading ref.current here makes the render impure and the output
  //   unpredictable under Concurrent rendering.
  // ✓ read and write it in event handlers and Effects instead.

  function handleClick() {
    ref.current += 1
    setN(ref.current) // put it in state when it should be on screen
  }

  return (
    <div>
      <p>n: {n}</p>
      <button onClick={handleClick}>bump</button>
    </div>
  )
}
```

The rule follows from purity: React may call your component twice, or call it and discard the result. A ref mutated during render would count those throwaway renders.

## `flushSync` when you need the DOM now

```tsx
import { useRef, useState } from "react"
import { flushSync } from "react-dom"

export default function App() {
  const [items, setItems] = useState(["one"])
  const listRef = useRef<HTMLUListElement>(null)

  function addAndScroll() {
    // Without flushSync, the DOM has not been updated yet when we scroll,
    // so the new item is not there to scroll to.
    flushSync(() => {
      setItems((l) => [...l, `item ${l.length + 1}`])
    })
    listRef.current?.lastElementChild?.scrollIntoView({ block: "nearest" })
  }

  return (
    <div>
      <ul ref={listRef} style={{ maxHeight: 60, overflow: "auto" }}>
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
      <button onClick={addAndScroll}>add and scroll to it</button>
    </div>
  )
}
```

> ⚠️ `flushSync` forces a synchronous render and commit, opting out of batching and concurrency. It is the right tool for "update the DOM, then measure or scroll" and the wrong tool for everything else.

## The escape hatch rule

Refs let you step outside React's model, so the cost is that React no longer knows what you did. Reach for one when the alternative would be storing something in state that nothing renders, or when you need a DOM API React does not wrap. Everything the user can see should still be state.

**Reference:** [Referencing Values with Refs](https://react.dev/learn/referencing-values-with-refs) and [Manipulating the DOM with Refs](https://react.dev/learn/manipulating-the-dom-with-refs).
