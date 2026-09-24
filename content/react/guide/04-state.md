---
title: State & the render cycle
section: Guide Book
summary: Why state is a snapshot, how updates are batched and queued, updater functions, and where state should live.
---
## State is a snapshot, not a variable

`useState` returns the value **for this render**. It does not change when you call the setter — the setter schedules a *new render* with a new value.

```tsx
import { useState } from "react"

export default function App() {
  const [count, setCount] = useState(0)

  function handleClick() {
    setCount(count + 1)
    // `count` is still the old value here — this render's snapshot.
    console.log("after setCount, count is still", count)
  }

  return (
    <div>
      <p>count: {count}</p>
      <button onClick={handleClick}>+1</button>
    </div>
  )
}
```

> 🔍 **Behind the scenes: each render has its own everything**
>
> A component function runs from the top on every render. The `count` inside `handleClick` is the `count` from the render that created that handler — closed over, frozen, correct for that moment in time. This is not a quirk to work around; it is what makes event handlers predictable. A handler created during render #3 will always see render #3's state, even if it fires after render #7.

## Calling the setter three times does not add three

```tsx
import { useState } from "react"

export default function App() {
  const [count, setCount] = useState(0)

  function plusThreeWrong() {
    setCount(count + 1) // 0 + 1
    setCount(count + 1) // 0 + 1  — same snapshot
    setCount(count + 1) // 0 + 1
  } // result: 1

  function plusThreeRight() {
    setCount((c) => c + 1) // queued: take whatever is there, add 1
    setCount((c) => c + 1)
    setCount((c) => c + 1)
  } // result: 3

  return (
    <div>
      <p>count: {count}</p>
      <button onClick={plusThreeWrong}>+3 (wrong — gives +1)</button>
      <button onClick={plusThreeRight}>+3 (updater function)</button>
    </div>
  )
}
```

An **updater function** receives the pending value rather than the snapshot. Reach for it whenever the next state depends on the previous one.

## Batching

React groups every setter call inside one event into a single re-render.

```tsx
import { useState } from "react"

export default function App() {
  const [a, setA] = useState(0)
  const [b, setB] = useState(0)

  function updateBoth() {
    setA(1)
    setB(1)
    // One re-render, not two — and never a render where a=1 but b=0.
  }

  return (
    <div>
      <p>
        a: {a}, b: {b}
      </p>
      <button onClick={updateBoth}>set both</button>
    </div>
  )
}
```

Since React 18 this applies everywhere — timeouts, promises, native handlers — not just React events.

## Never mutate state

React compares the old value with the new one using `Object.is`. Mutating an object leaves the reference identical, so React concludes nothing changed.

```tsx
import { useState } from "react"

type Person = { name: string; address: { city: string } }

export default function App() {
  const [person, setPerson] = useState<Person>({
    name: "Ada",
    address: { city: "London" },
  })
  const [items, setItems] = useState(["one", "two"])

  function wrong() {
    person.name = "Grace" // same reference — no re-render
    items.push("three") // same array — no re-render
  }

  function right() {
    setPerson({ ...person, name: "Grace" })
    setPerson((p) => ({ ...p, address: { ...p.address, city: "Oxford" } }))
    setItems((list) => [...list, "three"])
  }

  return (
    <div>
      <p>
        {person.name} in {person.address.city}
      </p>
      <p>{items.join(", ")}</p>
      <button onClick={wrong}>mutate (nothing happens)</button>
      <button onClick={right}>replace (works)</button>
    </div>
  )
}
```

| Operation | Mutates — avoid | Returns a copy — use |
| --- | --- | --- |
| add | `push`, `unshift` | `[...arr, x]`, `[x, ...arr]` |
| remove | `pop`, `shift`, `splice` | `filter` |
| replace | `arr[i] = x` | `map` |
| sort / reverse | `sort`, `reverse` | `toSorted`, `toReversed`, or copy first |

```tsx
import { useState } from "react"

export default function App() {
  const [nums, setNums] = useState([3, 1, 2])

  const sorted = [...nums].sort((a, b) => a - b) // copy, then sort

  return (
    <div>
      <p>original: {nums.join(", ")}</p>
      <p>sorted copy: {sorted.join(", ")}</p>
      <button onClick={() => setNums((n) => n.map((x) => x * 2))}>double each</button>
      <button onClick={() => setNums((n) => n.filter((x) => x !== 1))}>remove 1</button>
    </div>
  )
}
```

## Initialiser functions

The argument to `useState` is evaluated on **every** render, even though only the first result is used. Pass a function to run it once.

```tsx
import { useState } from "react"

function expensiveDefault(): string[] {
  // Imagine parsing something large.
  return Array.from({ length: 3 }, (_, i) => `item ${i + 1}`)
}

export default function App() {
  const [eager] = useState(expensiveDefault()) // runs every render
  const [lazy] = useState(expensiveDefault) // runs once — note: no ()

  return (
    <div>
      <p>eager: {eager.join(", ")}</p>
      <p>lazy: {lazy.join(", ")}</p>
    </div>
  )
}
```

## Structuring state

```tsx
import { useState } from "react"

export default function App() {
  // Avoid: two pieces that must agree
  const [items, setItems] = useState(["a", "b"])
  const [selectedItem, setSelectedItem] = useState("a") // can go stale

  // Prefer: one source of truth, derive the rest
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selected = items[selectedIndex]

  // Also avoid: state that is a pure function of other state
  const count = items.length // not useState — just compute it

  return (
    <div>
      <p>
        selected: {selected} ({count} items)
      </p>
      <button onClick={() => setSelectedIndex((i) => (i + 1) % items.length)}>next</button>
    </div>
  )
}
```

Three rules that prevent most state bugs:

1. **Do not duplicate.** If a value can be computed from props or other state, compute it during render.
2. **Group what changes together.** Two values always updated in the same event belong in one object.
3. **Avoid contradictions.** `isLoading` + `isError` + `isSuccess` can express impossible states; one `status: "loading" | "error" | "success"` cannot.

```tsx
import { useState } from "react"

type Status = { tag: "idle" } | { tag: "loading" } | { tag: "ok"; data: string } | { tag: "error"; message: string }

export default function App() {
  const [status, setStatus] = useState<Status>({ tag: "idle" })

  return (
    <div>
      <p>
        {status.tag === "idle" && "Nothing yet"}
        {status.tag === "loading" && "Loading…"}
        {status.tag === "ok" && `Got: ${status.data}`}
        {status.tag === "error" && `Failed: ${status.message}`}
      </p>
      <button onClick={() => setStatus({ tag: "loading" })}>load</button>
      <button onClick={() => setStatus({ tag: "ok", data: "some data" })}>succeed</button>
      <button onClick={() => setStatus({ tag: "error", message: "offline" })}>fail</button>
    </div>
  )
}
```

## Lifting state up

When two components need the same value, move it to their nearest common parent.

```tsx
import { useState } from "react"

function Panel({ title, isOpen, onShow }: { title: string; isOpen: boolean; onShow: () => void }) {
  return (
    <section>
      <h3>{title}</h3>
      {isOpen ? <p>Contents of {title}</p> : <button onClick={onShow}>Show</button>}
    </section>
  )
}

export default function App() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <div>
      <Panel title="First" isOpen={openIndex === 0} onShow={() => setOpenIndex(0)} />
      <Panel title="Second" isOpen={openIndex === 1} onShow={() => setOpenIndex(1)} />
    </div>
  )
}
```

The panels became **controlled**: they hold no state and do exactly what the parent says. That is what makes "only one open at a time" expressible at all.

## `useReducer` when the transitions have rules

```tsx
import { useReducer } from "react"

type State = { count: number; history: number[] }
type Action = { type: "inc" } | { type: "dec" } | { type: "reset" }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "inc":
      return { count: state.count + 1, history: [...state.history, state.count + 1] }
    case "dec":
      return { count: Math.max(0, state.count - 1), history: [...state.history, state.count - 1] }
    case "reset":
      return { count: 0, history: [] }
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, { count: 0, history: [] })

  return (
    <div>
      <p>count: {state.count}</p>
      <p>history: {state.history.join(" → ") || "(empty)"}</p>
      <button onClick={() => dispatch({ type: "inc" })}>+</button>
      <button onClick={() => dispatch({ type: "dec" })}>−</button>
      <button onClick={() => dispatch({ type: "reset" })}>reset</button>
    </div>
  )
}
```

A reducer is a pure function, so it can be unit-tested with no React at all — which is the real argument for it once the rules get interesting.

**Reference:** [State as a Snapshot](https://react.dev/learn/state-as-a-snapshot) and [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure) on react.dev.
