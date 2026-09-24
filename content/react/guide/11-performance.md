---
title: Performance
section: Guide Book
summary: What actually costs time, `memo`, `useMemo` and `useCallback` and when they help, plus the structural fixes that beat all of them.
---
## Measure before optimising

A re-render is a function call. Calling a function is fast. The costs that matter are:

| Cost | Typically |
| --- | --- |
| Rendering one component | microseconds |
| Rendering 10,000 components | milliseconds — and visible |
| Committing DOM changes | the expensive part |
| A layout-triggering read (`offsetHeight`) | forces the browser to reflow |
| Re-rendering because a parent did | usually free |

```tsx
export default function App() {
  return (
    <div>
      <h3>The order to try things</h3>
      <ol>
        <li>Profile. React DevTools' Profiler shows what actually re-rendered and why.</li>
        <li>Render fewer things — pagination, virtualisation, lazy loading.</li>
        <li>Move state down, or pass children, so fewer components re-render at all.</li>
        <li>Only then reach for memo, useMemo and useCallback.</li>
      </ol>
    </div>
  )
}
```

## Structural fix 1: move state down

If only one subtree cares about a piece of state, it does not belong at the top.

```tsx
import { useState } from "react"

function ExpensiveTree() {
  const rows = Array.from({ length: 20 }, (_, i) => `row ${i + 1}`)
  return (
    <ul>
      {rows.map((r) => (
        <li key={r}>{r}</li>
      ))}
    </ul>
  )
}

// The input's state lives with the input, so typing does not re-render the tree.
function SearchBox() {
  const [query, setQuery] = useState("")
  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search" />
      <p>searching for: {query}</p>
    </div>
  )
}

export default function App() {
  return (
    <div>
      <SearchBox />
      <ExpensiveTree />
    </div>
  )
}
```

## Structural fix 2: pass children

A component re-rendering does not re-render `children` it received as a prop — those elements were created by the *parent* and are unchanged.

```tsx
import { useState } from "react"

function Slow() {
  return <p>Rendered by App, passed through as children.</p>
}

function Counter({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
      {/* `children` is the same element object every time Counter re-renders */}
      {children}
    </div>
  )
}

export default function App() {
  return (
    <Counter>
      <Slow />
    </Counter>
  )
}
```

> 🔍 **Behind the scenes: why `children` escapes the re-render**
>
> `<Slow />` is created when **App** renders, not when `Counter` renders. Bumping `Counter`'s state re-runs `Counter`, but the `children` prop it receives is the exact same element object as last time. React compares them by identity, sees no change, and skips the subtree entirely. This is `memo` without the memo, and it costs nothing.

## `memo`

`memo` skips re-rendering a component when its props are shallow-equal to last time.

```tsx
import { memo, useState } from "react"

const Row = memo(function Row({ label }: { label: string }) {
  return <li>{label}</li>
})

export default function App() {
  const [count, setCount] = useState(0)
  const rows = ["alpha", "beta", "gamma"]

  return (
    <div>
      <p>count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
      <ul>
        {rows.map((r) => (
          <Row key={r} label={r} />
        ))}
      </ul>
    </div>
  )
}
```

> ⚠️ `memo` is defeated by a single unstable prop. An inline `onClick={() => …}`, an inline `style={{ … }}` or an inline array creates a new object every render, the shallow comparison fails, and you pay for the comparison *and* the render. `memo` on a component with object props and no `useCallback`/`useMemo` upstream is pure overhead.

## `useMemo`

Caches a computed value between renders.

```tsx
import { useMemo, useState } from "react"

export default function App() {
  const [n, setN] = useState(30)
  const [unrelated, setUnrelated] = useState(0)

  const primes = useMemo(() => {
    const out: number[] = []
    for (let i = 2; i <= n; i++) {
      if (out.every((p) => i % p !== 0)) out.push(i)
    }
    return out
  }, [n]) // recomputed only when n changes

  return (
    <div>
      <p>primes up to {n}: {primes.join(", ")}</p>
      <p>unrelated state: {unrelated}</p>
      <button onClick={() => setN((x) => x + 10)}>more primes</button>
      <button onClick={() => setUnrelated((x) => x + 1)}>
        bump unrelated (primes are not recomputed)
      </button>
    </div>
  )
}
```

Its second job is **identity stability** — keeping an object or array the same between renders so a `memo`'d child or a dependency array is not invalidated.

```tsx
import { memo, useMemo, useState } from "react"

const Chart = memo(function Chart({ config }: { config: { colour: string } }) {
  return <p>chart rendered with colour {config.colour}</p>
})

export default function App() {
  const [count, setCount] = useState(0)
  const [colour] = useState("steelblue")

  // Without useMemo this object is new on every render and memo never helps.
  const config = useMemo(() => ({ colour }), [colour])

  return (
    <div>
      <p>count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
      <Chart config={config} />
    </div>
  )
}
```

## `useCallback`

`useMemo` for functions. Same purpose: keep the identity stable.

```tsx
import { memo, useCallback, useState } from "react"

const Button = memo(function Button({ onClick, label }: { onClick: () => void; label: string }) {
  return <button onClick={onClick}>{label}</button>
})

export default function App() {
  const [count, setCount] = useState(0)
  const [other, setOther] = useState(0)

  // Stable identity: Button does not re-render when `other` changes.
  const increment = useCallback(() => setCount((c) => c + 1), [])

  return (
    <div>
      <p>
        count: {count}, other: {other}
      </p>
      <Button onClick={increment} label="+1" />
      <button onClick={() => setOther((o) => o + 1)}>bump other</button>
    </div>
  )
}
```

Note `setCount((c) => c + 1)` rather than `setCount(count + 1)` — the updater form means `count` is not a dependency, so the callback can have an empty dependency array and never change.

> 💡 **Tip:** The React Compiler, when enabled, inserts this memoisation automatically and more accurately than most hand-written attempts. Before adding a `useCallback`, check whether your build already has the compiler on — and whether the component was actually slow.

## Transitions

Mark an update as non-urgent so React can keep the interface responsive while it renders.

```tsx
import { useState, useTransition, useDeferredValue } from "react"

function Results({ query }: { query: string }) {
  const rows = Array.from({ length: 200 }, (_, i) => `${query} result ${i + 1}`)
  return <p>{rows.length} results for "{query}"</p>
}

export default function App() {
  const [query, setQuery] = useState("react")
  const [isPending, startTransition] = useTransition()
  const deferred = useDeferredValue(query)

  return (
    <div>
      <input
        value={query}
        onChange={(e) => {
          const next = e.target.value
          startTransition(() => setQuery(next))
        }}
      />
      {isPending ? <p>updating…</p> : null}
      <Results query={deferred} />
    </div>
  )
}
```

`useTransition` marks an update you control; `useDeferredValue` lets an expensive child lag behind a value you do not control. Both keep typing smooth when rendering is the bottleneck.

## Lazy loading

```tsx
import { Suspense, useState } from "react"

function Heavy() {
  return <p>A component that would be in its own bundle chunk.</p>
}

export default function App() {
  const [show, setShow] = useState(true)

  // In an app: const Heavy = lazy(() => import("./Heavy"))
  return (
    <div>
      <button onClick={() => setShow((s) => !s)}>toggle</button>
      <Suspense fallback={<p>loading…</p>}>{show ? <Heavy /> : null}</Suspense>
    </div>
  )
}
```

`lazy()` plus `Suspense` splits code at the component boundary — usually the biggest single win on first load, and one that needs no memoisation at all.

## The list that is actually slow

```tsx
import { useState } from "react"

const ALL = Array.from({ length: 1000 }, (_, i) => `item ${i + 1}`)

export default function App() {
  const [page, setPage] = useState(0)
  const pageSize = 20
  const visible = ALL.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <div>
      <p>
        showing {visible.length} of {ALL.length}
      </p>
      <ul>
        {visible.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
      <button onClick={() => setPage((p) => Math.max(0, p - 1))}>prev</button>
      <button onClick={() => setPage((p) => Math.min(Math.ceil(ALL.length / pageSize) - 1, p + 1))}>
        next
      </button>
    </div>
  )
}
```

Rendering 20 rows instead of 1,000 beats every memoisation you could add to a 1,000-row list. When all of them genuinely must be scrollable, virtualise — render only the visible window.

**Reference:** [memo](https://react.dev/reference/react/memo), [useMemo](https://react.dev/reference/react/useMemo) and [useTransition](https://react.dev/reference/react/useTransition) on react.dev.
