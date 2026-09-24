---
title: Lists, keys & identity
section: Guide Book
summary: Why keys exist, what a bad key actually breaks, and the rendering patterns for collections.
---
## Rendering a list

```tsx
type Person = { id: number; name: string; role: string }

const people: Person[] = [
  { id: 1, name: "Ada", role: "engineer" },
  { id: 2, name: "Grace", role: "admiral" },
  { id: 3, name: "Linus", role: "maintainer" },
]

export default function App() {
  return (
    <ul>
      {people.map((person) => (
        <li key={person.id}>
          <strong>{person.name}</strong> — {person.role}
        </li>
      ))}
    </ul>
  )
}
```

The `key` goes on the element returned **directly** by `map`, not on something inside it.

## What a key is for

A key gives an item a stable identity across renders. Without one, React matches children by position — and position changes when items are inserted, removed or reordered.

```text
before:  [A] [B] [C]          keys: a, b, c
insert X at the front

by position:  X↔A  A↔B  B↔C  C↔(new)     → every node updated, state shuffled
by key:       X is new, a/b/c unchanged  → one node inserted
```

```tsx
export default function App() {
  return (
    <div>
      <h3>Keys must be</h3>
      <ul>
        <li>
          <strong>unique among siblings</strong> — not globally
        </li>
        <li>
          <strong>stable</strong> — the same item gets the same key every render
        </li>
        <li>
          <strong>from the data</strong> — a database id, a uuid, a slug
        </li>
      </ul>
    </div>
  )
}
```

## The index-as-key bug

`key={index}` is a key that changes meaning when the list changes. It is fine for a list that never reorders and never has items inserted or removed — and a bug the moment it does.

```tsx
import { useState } from "react"

type Todo = { id: number; text: string }

function Row({ todo }: { todo: Todo }) {
  // Local state — exactly what a wrong key destroys.
  const [checked, setChecked] = useState(false)

  return (
    <li>
      <input type="checkbox" checked={checked} onChange={() => setChecked((c) => !c)} />{" "}
      {todo.text}
    </li>
  )
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: "first" },
    { id: 2, text: "second" },
    { id: 3, text: "third" },
  ])

  function prepend() {
    setTodos((t) => [{ id: Date.now(), text: "new item" }, ...t])
  }

  return (
    <div>
      <button onClick={prepend}>add to the top</button>

      <h4>key = index (checkbox state follows the position, not the item)</h4>
      <ul>
        {todos.map((todo, i) => (
          <Row key={i} todo={todo} />
        ))}
      </ul>

      <h4>key = id (checkbox state follows the item)</h4>
      <ul>
        {todos.map((todo) => (
          <Row key={todo.id} todo={todo} />
        ))}
      </ul>
    </div>
  )
}
```

> 🧭 **Scenario:** A list of form rows uses index keys. A user fills in row 3, then deletes row 1. Every row shifts up, React reuses the DOM nodes by position, and the text the user typed in row 3 is now showing in row 2 — attached to the wrong record. Nothing throws, nothing logs, and the data submitted is wrong. This is the single strongest argument for stable keys.

> ⚠️ `key={Math.random()}` is worse than an index key. A fresh key every render means React destroys and rebuilds every item on every render: no state survives, inputs lose focus, and performance collapses.

## Keys when there is no id

```tsx
export default function App() {
  const tags = ["react", "typescript", "jsx"]
  const pairs = [
    ["a", 1],
    ["b", 2],
  ] as const

  return (
    <div>
      {/* Values that are themselves unique make fine keys. */}
      <ul>
        {tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>

      {/* A composite key when no single field is unique. */}
      <ul>
        {pairs.map(([letter, n]) => (
          <li key={`${letter}-${n}`}>
            {letter}: {n}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

If the data genuinely has no identity, generate an id **when the item is created** and store it alongside the data — not during render.

## Keys with fragments

A fragment that needs a key must use the long form.

```tsx
import { Fragment } from "react"

const sections = [
  { id: "a", title: "First", body: "one" },
  { id: "b", title: "Second", body: "two" },
]

export default function App() {
  return (
    <dl>
      {sections.map((s) => (
        <Fragment key={s.id}>
          <dt>{s.title}</dt>
          <dd>{s.body}</dd>
        </Fragment>
      ))}
    </dl>
  )
}
```

## Keys as a reset tool

Because a changed key means "a different component", a key is also the idiomatic way to force a reset.

```tsx
import { useState } from "react"

function Editor({ documentId }: { documentId: string }) {
  const [draft, setDraft] = useState("")

  return (
    <div>
      <p>editing {documentId}</p>
      <p>draft: "{draft}"</p>
      <button onClick={() => setDraft("some text")}>type something</button>
    </div>
  )
}

export default function App() {
  const [docId, setDocId] = useState("doc-1")

  return (
    <div>
      <Editor key={docId} documentId={docId} />
      <button onClick={() => setDocId((d) => (d === "doc-1" ? "doc-2" : "doc-1"))}>
        switch document (draft resets)
      </button>
    </div>
  )
}
```

## Empty states and conditional lists

```tsx
import { useState } from "react"

export default function App() {
  const [items, setItems] = useState<string[]>([])

  return (
    <div>
      {items.length === 0 ? (
        <p>Nothing here yet.</p>
      ) : (
        <ul>
          {items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      )}
      <button onClick={() => setItems((l) => [...l, `item ${l.length + 1}`])}>add</button>
      <button onClick={() => setItems([])}>clear</button>
    </div>
  )
}
```

Note the ternary rather than `items.length && <ul>` — the [JSX chapter](/react/guide/jsx) explains why that `&&` would print a `0`.

## Grouping and nesting

```tsx
type Task = { id: number; title: string; status: "todo" | "done" }

const tasks: Task[] = [
  { id: 1, title: "Write guide", status: "done" },
  { id: 2, title: "Verify examples", status: "done" },
  { id: 3, title: "Ship it", status: "todo" },
]

export default function App() {
  const grouped = Object.groupBy(tasks, (t) => t.status)

  return (
    <div>
      {Object.entries(grouped).map(([status, group]) => (
        <section key={status}>
          <h3>{status}</h3>
          <ul>
            {(group ?? []).map((task) => (
              <li key={task.id}>{task.title}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
```

Keys only need to be unique **among siblings**, so the inner `task.id` keys and the outer `status` keys never interact.

**Reference:** [Rendering Lists](https://react.dev/learn/rendering-lists) on react.dev.
