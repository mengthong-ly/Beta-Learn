---
title: How React renders
section: Guide Book
summary: Elements, the render tree, reconciliation and commit — what actually happens between your function returning JSX and pixels changing.
---
React is a two-phase machine. It **renders** — calls your components to work out what the UI should look like — and then it **commits** — applies the smallest set of DOM changes that gets there.

```text
state change
     │
     ▼
  RENDER      call components, build a tree of elements
     │        (pure, interruptible, may be thrown away)
     ▼
  RECONCILE   compare the new tree with the previous one
     │
     ▼
  COMMIT      apply DOM changes, run refs, run effects
     │        (synchronous, never interrupted)
     ▼
  browser paints
```

## An element is a plain object

JSX does not create DOM nodes. It creates ordinary JavaScript objects that *describe* DOM nodes.

```tsx
export default function App() {
  const element = <h1 className="title">Hello</h1>

  return (
    <div>
      <h1>{element.type}</h1>
      <p>props: {JSON.stringify(element.props)}</p>
      <p>a plain object: {String(typeof element)}</p>
    </div>
  )
}
```

That object is cheap to make and cheap to throw away. React creates a whole new tree of them on every render and compares it to the last one — which is only viable *because* they are this lightweight.

> 🔍 **Behind the scenes: why elements are immutable**
>
> Once created, an element's `props` are frozen. React relies on this: if the props object could change after the fact, comparing "the previous tree" with "the new tree" would be meaningless, because the previous tree might have mutated underneath. Immutability is what makes the diff trustworthy — and it is the same reason you must never mutate state directly.

## Components are functions that return elements

```tsx
function Greeting({ name }: { name: string }) {
  return <p>Hello, {name}</p>
}

function Header() {
  return <h1>Members</h1>
}

export default function App() {
  return (
    <section>
      <Header />
      <Greeting name="Ada" />
      <Greeting name="Grace" />
      <Greeting name="Linus" />
    </section>
  )
}
```

React calls `App`, gets elements back, sees `Header` and `Greeting` among them, calls *those*, and keeps going until every element describes a host node (`div`, `p`, `h1`). That recursive walk is the render phase.

## The render tree

```tsx
function Avatar({ name }: { name: string }) {
  return <span>[{name[0]}]</span>
}

function Card({ name, role }: { name: string; role: string }) {
  return (
    <li>
      <Avatar name={name} />
      <strong>{name}</strong> — {role}
    </li>
  )
}

export default function App() {
  const people = [
    { name: "Ada", role: "engineer" },
    { name: "Grace", role: "admiral" },
  ]

  return (
    <ul>
      {people.map((p) => (
        <Card key={p.name} name={p.name} role={p.role} />
      ))}
    </ul>
  )
}
```

The resulting tree is `App → ul → Card → (Avatar → span, strong, text)`. React keeps this structure between renders and uses **position in the tree** to decide what is "the same component" from one render to the next — which is why state survives a re-render but not a move.

## Reconciliation: same position, same type, same instance

When React renders again, it walks both trees together:

- **Same type at the same position** → keep the DOM node and the component's state, update the changed props.
- **Different type** → destroy the old subtree (state and all) and build a new one.
- **Lists** → match by `key` rather than by position.

```tsx
export default function App() {
  const showHeading = true

  return (
    <div>
      {showHeading ? <h2>Same type stays</h2> : <h3>Different type resets</h3>}
      <p>
        Flip a conditional between <code>&lt;h2&gt;</code> and <code>&lt;h3&gt;</code> and React
        tears down the first and builds the second — any state inside is lost.
      </p>
    </div>
  )
}
```

> ⚠️ This is the cause of the "my input clears itself" bug. Rendering `{isEditing ? <Input /> : <Input readOnly />}` looks like one component with a changing prop, but if the two branches sit at different positions or have different types, React sees two different components and resets the state.

## Commit: the smallest possible change

Once React knows the difference, it applies it. Nodes that did not change are not touched — their DOM state (scroll position, focus, a video's playback) survives.

```tsx
export default function App() {
  const rows = ["unchanged", "unchanged", "unchanged"]

  return (
    <div>
      <p>On a re-render where only one row's text changes,</p>
      <p>React sets that one text node and leaves the other two alone.</p>
      <ul>
        {rows.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </div>
  )
}
```

> 🧭 **Scenario:** A table re-renders every second with fresh data. Users complain that they cannot select text in it. The cause is almost always keys: with index keys or no keys, React recreates the rows instead of updating them, and recreation destroys the selection. Stable keys turn recreation into a text-node update, and the problem disappears.

## Render does not mean "DOM update"

A component re-rendering is not a bug and usually not a performance problem. React calls the function, gets an identical tree, finds no differences, and touches nothing.

```tsx
export default function App() {
  return (
    <div>
      <h2>Three different things</h2>
      <ol>
        <li>
          <strong>Trigger</strong> — state changed, or a parent re-rendered
        </li>
        <li>
          <strong>Render</strong> — React calls your component function
        </li>
        <li>
          <strong>Commit</strong> — React changes the DOM, but only where the trees differ
        </li>
      </ol>
      <p>Optimising step 2 before measuring step 3 is where most wasted effort goes.</p>
    </div>
  )
}
```

**Reference:** [Render and Commit](https://react.dev/learn/render-and-commit) and [Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state) on react.dev.
