---
title: The rules of hooks
section: Guide Book
summary: Why hooks must be called unconditionally, what React stores between renders, the built-in set, and how to write your own.
---
## The two rules

1. Call hooks **only at the top level** — never inside a condition, a loop, a nested function or after an early return.
2. Call hooks **only from React functions** — components or other hooks.

```tsx
import { useState } from "react"

export default function App() {
  // ✓ top level, unconditional, same order every render
  const [name, setName] = useState("Ada")
  const [age, setAge] = useState(36)

  const isAdult = age >= 18 // plain logic is fine anywhere

  return (
    <div>
      <p>
        {name}, {age} ({isAdult ? "adult" : "minor"})
      </p>
      <button onClick={() => setAge((a) => a + 1)}>older</button>
    </div>
  )
}
```

## Why the rules exist

React does not know your hooks by name. It stores their state in an array, in **call order**, and matches them up on the next render by position.

```text
render 1                   render 2 (with an `if` around hook 2)

0: useState("Ada")   ←→    0: useState("Ada")      ✓
1: useState(36)      ←→    1: useEffect(…)         ✗ wrong slot
2: useEffect(…)      ←→    (missing)
```

Skip a hook on one render and every hook after it reads the previous hook's memory. React detects this and throws "Rendered fewer hooks than expected" — but the underlying corruption is why the rule is absolute rather than a style preference.

```tsx
import { useState } from "react"

function Conditional({ show }: { show: boolean }) {
  // The fix: always call the hook, and use the condition in the JSX.
  const [value, setValue] = useState("always here")

  return (
    <div>
      {show ? <p>{value}</p> : <p>hidden</p>}
      <button onClick={() => setValue("changed")}>change</button>
    </div>
  )
}

export default function App() {
  return (
    <div>
      <Conditional show={true} />
      <Conditional show={false} />
    </div>
  )
}
```

> 🔍 **Behind the scenes: where the state actually lives**
>
> Each mounted component has a fiber — React's internal record of it — and the fiber holds a linked list of hook objects. `useState` walks to the next node in that list and returns its value. The component function itself is stateless and disposable; the fiber is what persists. This is also why two instances of the same component never share state: two elements, two fibers, two lists.

## The built-in hooks

| Hook | For |
| --- | --- |
| `useState` | local state |
| `useReducer` | local state with explicit transitions |
| `useContext` | read a context value |
| `useRef` | a mutable box that does not trigger renders |
| `useEffect` | synchronise with an external system |
| `useLayoutEffect` | the same, but before the browser paints |
| `useMemo` | cache a computed value |
| `useCallback` | cache a function identity |
| `useId` | a stable unique id for accessibility attributes |
| `useTransition` | mark an update as non-urgent |
| `useDeferredValue` | render a stale value while a new one is prepared |
| `useSyncExternalStore` | subscribe to an external store safely |

```tsx
import { useId, useRef, useMemo, useState } from "react"

export default function App() {
  const id = useId()
  const renders = useRef(0)
  const [n, setN] = useState(5)

  renders.current++

  const factorial = useMemo(() => {
    let out = 1
    for (let i = 2; i <= n; i++) out *= i
    return out
  }, [n])

  return (
    <div>
      <label htmlFor={`${id}-n`}>n </label>
      <input id={`${id}-n`} type="number" value={n} readOnly />
      <p>
        {n}! = {factorial}
      </p>
      <p>useId gives a collision-free id: {id}</p>
      <button onClick={() => setN((x) => x + 1)}>increment n</button>
    </div>
  )
}
```

`useId` matters more than it looks: it produces the same id on the server and the client, which hand-rolled counters and `Math.random()` do not — and a mismatch breaks hydration.

## Custom hooks

A custom hook is a function whose name starts with `use` and which calls other hooks. It shares *logic*, never state — each call gets its own.

```tsx
import { useState } from "react"

function useCounter(initial = 0) {
  const [count, setCount] = useState(initial)

  return {
    count,
    increment: () => setCount((c) => c + 1),
    decrement: () => setCount((c) => Math.max(0, c - 1)),
    reset: () => setCount(initial),
  }
}

function Counter({ label }: { label: string }) {
  const { count, increment, reset } = useCounter()

  return (
    <p>
      {label}: {count} <button onClick={increment}>+</button>{" "}
      <button onClick={reset}>reset</button>
    </p>
  )
}

export default function App() {
  return (
    <div>
      {/* Two independent counters — the hook shares logic, not state. */}
      <Counter label="First" />
      <Counter label="Second" />
    </div>
  )
}
```

```tsx
import { useState } from "react"

type Field = { value: string; onChange: (v: string) => void; reset: () => void }

function useField(initial = ""): Field {
  const [value, setValue] = useState(initial)
  return { value, onChange: setValue, reset: () => setValue(initial) }
}

function useToggle(initial = false) {
  const [on, setOn] = useState(initial)
  return [on, () => setOn((v) => !v)] as const
}

export default function App() {
  const name = useField("Ada")
  const email = useField("")
  const [showEmail, toggleEmail] = useToggle(true)

  return (
    <form>
      <p>
        <input value={name.value} onChange={(e) => name.onChange(e.target.value)} />
      </p>
      {showEmail ? (
        <p>
          <input
            value={email.value}
            placeholder="email"
            onChange={(e) => email.onChange(e.target.value)}
          />
        </p>
      ) : null}
      <button type="button" onClick={toggleEmail}>
        toggle email field
      </button>
    </form>
  )
}
```

> 💡 **Tip:** A good custom hook has a name that describes *what it gives you*, not how. `useOnlineStatus`, `useFormField`, `useChatRoom` — not `useEffectWrapper`. If a hook takes eight options and returns fifteen values, it is a component in disguise.

## What a custom hook must not do

```tsx
import { useState } from "react"

// Not a hook — no hooks inside, so it should not be called "use…".
function formatName(first: string, last: string): string {
  return `${first} ${last}`
}

// A real hook: calls useState, so the name and the rules apply.
function useName(first: string, last: string) {
  const [nickname, setNickname] = useState<string | null>(null)
  return { display: nickname ?? formatName(first, last), setNickname }
}

export default function App() {
  const { display, setNickname } = useName("Ada", "Lovelace")

  return (
    <div>
      <p>{display}</p>
      <button onClick={() => setNickname("The Countess")}>set nickname</button>
    </div>
  )
}
```

Naming a plain function `useSomething` makes the linter enforce hook rules on it for no reason; naming a real hook without the prefix means the linter stops checking it. The convention is load-bearing.

## `useLayoutEffect`, briefly

```tsx
import { useLayoutEffect, useRef, useState } from "react"

export default function App() {
  const ref = useRef<HTMLParagraphElement>(null)
  const [height, setHeight] = useState(0)

  // Runs after the DOM is updated but BEFORE the browser paints, so the
  // measurement and any resulting adjustment are never visible as a flicker.
  useLayoutEffect(() => {
    if (ref.current) setHeight(ref.current.offsetHeight)
  }, [])

  return (
    <div>
      <p ref={ref}>Measured element</p>
      <p>height: {height}px</p>
    </div>
  )
}
```

> ⚠️ `useLayoutEffect` blocks painting, so it makes the page slower by design. Use it only when you must measure the DOM and act on the measurement in the same frame — a tooltip that would otherwise appear in the wrong place for one frame. Everything else is `useEffect`.

**Reference:** [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks) and [Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks) on react.dev.
