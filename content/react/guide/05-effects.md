---
title: Effects
section: Guide Book
summary: What `useEffect` is for, the dependency array, cleanup, and the many cases where the right answer is no effect at all.
---
An Effect synchronises your component with something **outside** React — a subscription, a browser API, a network connection. It is not a lifecycle hook and it is not the place to compute things.

## The shape

```tsx
import { useEffect, useState } from "react"

export default function App() {
  const [ticks, setTicks] = useState(0)

  useEffect(() => {
    // setup: runs after the commit
    const id = setInterval(() => setTicks((t) => t + 1), 1000)

    // cleanup: runs before the next setup, and on unmount
    return () => clearInterval(id)
  }, []) // dependencies: [] means "after mount only"

  return <p>ticks: {ticks}</p>
}
```

Three parts, and the third decides everything:

| Dependencies | Setup runs |
| --- | --- |
| omitted | after **every** render |
| `[]` | once, after the first render |
| `[a, b]` | when `a` or `b` changes (compared with `Object.is`) |

## Cleanup is not optional

Every subscription, timer, listener and connection must be undone. React calls the cleanup before re-running the Effect *and* on unmount.

```tsx
import { useEffect, useState } from "react"

function connect(room: string) {
  return {
    connect: () => console.log(`connecting to ${room}`),
    disconnect: () => console.log(`disconnecting from ${room}`),
  }
}

export default function App() {
  const [room, setRoom] = useState("general")

  useEffect(() => {
    const connection = connect(room)
    connection.connect()
    return () => connection.disconnect() // ← without this, connections leak
  }, [room])

  return (
    <div>
      <p>room: {room}</p>
      <button onClick={() => setRoom("random")}>switch room</button>
    </div>
  )
}
```

> 🔍 **Behind the scenes: StrictMode runs your Effect twice on purpose**
>
> In development React mounts, unmounts and remounts every component once — so setup → cleanup → setup. It looks like a bug and it is a test: an Effect that survives that cycle intact is an Effect with correct cleanup. An Effect that does not will double-subscribe, double-fetch or double-count, which is exactly what would happen in production the first time a user navigated away and back.

## Races in data fetching

An Effect that fetches must handle the response arriving after the input changed.

```tsx
import { useEffect, useState } from "react"

async function search(query: string): Promise<string[]> {
  return [`result for ${query}`]
}

export default function App() {
  const [query, setQuery] = useState("react")
  const [results, setResults] = useState<string[]>([])

  useEffect(() => {
    let stale = false

    search(query).then((rows) => {
      if (!stale) setResults(rows) // ignore a response that arrived late
    })

    return () => {
      stale = true
    }
  }, [query])

  return (
    <div>
      <p>query: {query}</p>
      <ul>
        {results.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <button onClick={() => setQuery("vue")}>change query</button>
    </div>
  )
}
```

Without the `stale` flag, typing "r", "re", "rea" fires three requests and the slowest one wins — so the box shows results for "r" while the input says "rea".

> 💡 **Tip:** In an application, use a framework's loader or a data library (TanStack Query, SWR, a router's `loader`) rather than writing this by hand. They handle races, caching, deduplication and refetching, all of which you would otherwise reimplement per component.

## You probably do not need an Effect

This is the highest-value section in the chapter. Most Effects in real codebases should not exist.

### Computing during render

```tsx
import { useState } from "react"

export default function App() {
  const [first, setFirst] = useState("Ada")
  const [last, setLast] = useState("Lovelace")

  // NOT an Effect + state. Just compute it.
  const full = `${first} ${last}`

  return (
    <div>
      <p>{full}</p>
      <button onClick={() => setFirst("Grace")}>change first</button>
      <button onClick={() => setLast("Hopper")}>change last</button>
    </div>
  )
}
```

An Effect that reads state and sets other state costs an extra render every time, and the intermediate render shows stale data.

### Filtering and sorting

```tsx
import { useState } from "react"

export default function App() {
  const [items] = useState(["banana", "apple", "cherry"])
  const [query, setQuery] = useState("")

  const visible = items.filter((i) => i.includes(query)).toSorted()

  return (
    <div>
      <p>query: "{query}"</p>
      <ul>
        {visible.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
      <button onClick={() => setQuery("an")}>filter to "an"</button>
      <button onClick={() => setQuery("")}>clear</button>
    </div>
  )
}
```

### Resetting state when a prop changes

Do not write an Effect that clears state. Give the component a `key` and let React recreate it.

```tsx
import { useState } from "react"

function ProfileForm({ userId }: { userId: string }) {
  const [draft, setDraft] = useState("")

  return (
    <div>
      <p>editing {userId}</p>
      <p>draft: "{draft}"</p>
      <button onClick={() => setDraft("typed something")}>type</button>
    </div>
  )
}

export default function App() {
  const [userId, setUserId] = useState("u1")

  return (
    <div>
      {/* key changes → React unmounts and remounts → state resets, no Effect needed */}
      <ProfileForm key={userId} userId={userId} />
      <button onClick={() => setUserId((u) => (u === "u1" ? "u2" : "u1"))}>switch user</button>
    </div>
  )
}
```

### Responding to an event

```tsx
import { useState } from "react"

export default function App() {
  const [items, setItems] = useState<string[]>([])

  // The logic belongs in the handler — the place that KNOWS what happened.
  function handleAdd(name: string) {
    setItems((list) => [...list, name])
    console.log("analytics: item added", name) // not an Effect on items.length
  }

  return (
    <div>
      <p>{items.length} items</p>
      <button onClick={() => handleAdd(`item ${items.length + 1}`)}>add</button>
    </div>
  )
}
```

> ⚠️ The distinguishing question: **did this happen because the user did something, or because the component is now on screen?** A user action belongs in an event handler. Only "this component is displayed, so something outside React must be kept in sync" belongs in an Effect.

## When an Effect is right

```tsx
import { useEffect, useState } from "react"

export default function App() {
  const [width, setWidth] = useState(0)
  const [title, setTitle] = useState("Guide")

  // Subscribing to a browser API — genuinely external.
  useEffect(() => {
    function onResize() {
      setWidth(window.innerWidth)
    }
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  // Synchronising an external system (document.title) with React state.
  useEffect(() => {
    document.title = title
  }, [title])

  return (
    <div>
      <p>window width: {width}</p>
      <p>document.title is kept in sync with: {title}</p>
      <button onClick={() => setTitle("Changed")}>change title</button>
    </div>
  )
}
```

Legitimate Effects: subscriptions, timers, `document`/`window`, analytics on *display*, connecting to a non-React widget, and manual DOM measurement.

## Dependency lint rules are right more often than you

```tsx
import { useEffect, useState } from "react"

export default function App() {
  const [count, setCount] = useState(0)
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    // Every value from the component that the Effect reads must be listed.
    setLog((l) => [...l, `count is now ${count}`])
  }, [count])

  return (
    <div>
      <p>count: {count}</p>
      <ul>
        {log.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
    </div>
  )
}
```

Suppressing the exhaustive-deps warning nearly always hides a stale closure. If a dependency causes an unwanted re-run, the fix is to remove the dependency — move the value inside the Effect, into a ref, or into an updater function — not to lie about it.

**Reference:** [Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects) and [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) on react.dev.
