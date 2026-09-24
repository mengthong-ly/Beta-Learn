---
title: Context & sharing state
section: Guide Book
summary: Prop drilling, what context actually solves, the re-render cost nobody mentions, and when to reach for something else.
---
## The problem: prop drilling

```tsx
type Theme = "light" | "dark"

function Button({ theme, label }: { theme: Theme; label: string }) {
  return <button>{theme === "dark" ? `🌙 ${label}` : `☀️ ${label}`}</button>
}

function Toolbar({ theme }: { theme: Theme }) {
  return (
    <div>
      <Button theme={theme} label="Save" />
      <Button theme={theme} label="Cancel" />
    </div>
  )
}

function Page({ theme }: { theme: Theme }) {
  return (
    <main>
      <Toolbar theme={theme} />
    </main>
  )
}

export default function App() {
  return <Page theme="dark" />
}
```

`Page` and `Toolbar` do not use `theme`. They carry it. Add three more levels and every one of them has to know about a prop it does not care about.

## Context: a value available to a whole subtree

```tsx
import { createContext, useContext } from "react"

type Theme = "light" | "dark"

const ThemeContext = createContext<Theme>("light")

function Button({ label }: { label: string }) {
  const theme = useContext(ThemeContext) // reads the nearest provider
  return <button>{theme === "dark" ? `🌙 ${label}` : `☀️ ${label}`}</button>
}

function Toolbar() {
  return (
    <div>
      <Button label="Save" />
      <Button label="Cancel" />
    </div>
  )
}

export default function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  )
}
```

`Toolbar` is back to knowing nothing. `Button` reaches up the tree for what it needs.

> 🔍 **Behind the scenes: context walks up, not down**
>
> `useContext` does not search the whole tree. It walks **up** from the calling component to the nearest matching `Provider` and reads its `value` — an O(depth) lookup, not a broadcast. That is why nesting providers works so naturally: an inner provider shadows an outer one for its own subtree, and the default passed to `createContext` is used only when there is no provider at all.

```tsx
import { createContext, useContext } from "react"

const LevelContext = createContext(0)

function Heading({ children }: { children: React.ReactNode }) {
  const level = useContext(LevelContext)
  return <p>{"#".repeat(level + 1)} {children}</p>
}

function Section({ children }: { children: React.ReactNode }) {
  const level = useContext(LevelContext)
  return (
    <LevelContext.Provider value={level + 1}>
      <section>{children}</section>
    </LevelContext.Provider>
  )
}

export default function App() {
  return (
    <Section>
      <Heading>Top level</Heading>
      <Section>
        <Heading>Nested once</Heading>
        <Section>
          <Heading>Nested twice</Heading>
        </Section>
      </Section>
    </Section>
  )
}
```

Each `Section` reads the current depth and provides one more. No component is told its level; it works it out from where it sits.

## Context with state

The common shape: a provider component that owns the state and hands down both the value and the updaters.

```tsx
import { createContext, useContext, useMemo, useState } from "react"

type Theme = "light" | "dark"
type ThemeValue = { theme: Theme; toggle: () => void }

const ThemeContext = createContext<ThemeValue | null>(null)

function useTheme(): ThemeValue {
  const value = useContext(ThemeContext)
  if (!value) throw new Error("useTheme must be used inside <ThemeProvider>")
  return value
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")

  // Memoised so the object identity is stable between renders.
  const value = useMemo(
    () => ({ theme, toggle: () => setTheme((t) => (t === "light" ? "dark" : "light")) }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

function ThemeSwitch() {
  const { theme, toggle } = useTheme()
  return <button onClick={toggle}>theme: {theme} (click to toggle)</button>
}

export default function App() {
  return (
    <ThemeProvider>
      <ThemeSwitch />
    </ThemeProvider>
  )
}
```

Two details worth copying:

- The context type includes `null`, and a **custom hook** throws a useful error instead of silently returning a default. "Cannot read property 'theme' of null" becomes "useTheme must be used inside \<ThemeProvider\>".
- The value is `useMemo`d. Without it, every render of the provider creates a new object, and every consumer re-renders even when nothing changed.

## The cost

Every component calling `useContext` re-renders when the provider's value changes — by identity, not by content.

```tsx
import { createContext, useContext, useMemo, useState } from "react"

type User = { name: string }

const UserContext = createContext<User>({ name: "anonymous" })
const CountContext = createContext(0)

function UserName() {
  const user = useContext(UserContext)
  return <p>user: {user.name}</p>
}

function Count() {
  const count = useContext(CountContext)
  return <p>count: {count}</p>
}

export default function App() {
  const [count, setCount] = useState(0)
  const [name] = useState("Ada")

  // Split into two contexts: bumping the count does not re-render UserName.
  const user = useMemo(() => ({ name }), [name])

  return (
    <UserContext.Provider value={user}>
      <CountContext.Provider value={count}>
        <UserName />
        <Count />
        <button onClick={() => setCount((c) => c + 1)}>+1</button>
      </CountContext.Provider>
    </UserContext.Provider>
  )
}
```

> ⚠️ One giant `AppContext` holding user, theme, cart, notifications and a socket means every component that reads *any* of it re-renders when *any* of it changes. Split contexts by how often the data changes, not by which feature it belongs to.

## Context is not a state manager

```tsx
import { createContext, useContext, useReducer, useMemo } from "react"

type Todo = { id: number; text: string; done: boolean }
type Action = { type: "add"; text: string } | { type: "toggle"; id: number }

function reducer(state: Todo[], action: Action): Todo[] {
  switch (action.type) {
    case "add":
      return [...state, { id: Date.now(), text: action.text, done: false }]
    case "toggle":
      return state.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t))
  }
}

const TodosContext = createContext<Todo[]>([])
const DispatchContext = createContext<React.Dispatch<Action>>(() => {})

function TodoList() {
  const todos = useContext(TodosContext)
  const dispatch = useContext(DispatchContext)

  return (
    <ul>
      {todos.map((t) => (
        <li key={t.id}>
          <button onClick={() => dispatch({ type: "toggle", id: t.id })}>
            {t.done ? "✓" : "○"} {t.text}
          </button>
        </li>
      ))}
    </ul>
  )
}

function AddButton() {
  const dispatch = useContext(DispatchContext)
  return <button onClick={() => dispatch({ type: "add", text: "new todo" })}>add</button>
}

export default function App() {
  const [todos, dispatch] = useReducer(reducer, [{ id: 1, text: "read the guide", done: false }])
  const memoTodos = useMemo(() => todos, [todos])

  return (
    <TodosContext.Provider value={memoTodos}>
      <DispatchContext.Provider value={dispatch}>
        <AddButton />
        <TodoList />
      </DispatchContext.Provider>
    </TodosContext.Provider>
  )
}
```

Splitting the state and the dispatcher into two contexts is worth doing: `dispatch` is stable, so a component that only dispatches never re-renders when the data changes.

> 💡 **Tip:** Before reaching for context, try the two cheaper answers. **Pass `children`** — a component that receives a rendered subtree does not need to thread props through it. **Lift the state up** just far enough. Context earns its complexity when a value is genuinely needed by many components at many depths: theme, locale, the current user, a router.

## What context is bad at

Server data. Context has no caching, no deduplication, no refetching and no loading state — you would build all of it yourself. A data library or your framework's loader already has it.

**Reference:** [Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context) and [Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context).
