---
title: Components & props
section: Guide Book
summary: Props as a one-way contract, defaults and destructuring, composition patterns, and why purity is a requirement rather than a style.
---
## Props flow down, one way

A component receives a single object — `props` — and must treat it as read-only.

```tsx
type BadgeProps = {
  label: string
  count?: number
  tone?: "info" | "warn" | "danger"
}

function Badge({ label, count = 0, tone = "info" }: BadgeProps) {
  return (
    <span>
      [{tone}] {label}
      {count > 0 ? ` (${count})` : ""}
    </span>
  )
}

export default function App() {
  return (
    <ul>
      <li>
        <Badge label="Inbox" count={4} />
      </li>
      <li>
        <Badge label="Archive" />
      </li>
      <li>
        <Badge label="Errors" count={2} tone="danger" />
      </li>
    </ul>
  )
}
```

Destructuring in the signature gives you defaults, and documents the component's interface in one line.

> ⚠️ Never write `props.count = 5`. Props belong to the *parent*: mutating them changes an object React may still be comparing against, and the change will not trigger a render. If a child needs to change something, the parent passes a function down.

## Passing data back up

```tsx
function Row({ name, onSelect }: { name: string; onSelect: (name: string) => void }) {
  return (
    <li>
      <button onClick={() => onSelect(name)}>{name}</button>
    </li>
  )
}

export default function App() {
  // In a real app this would be state; here it shows the shape.
  const handleSelect = (name: string) => {
    console.log("selected", name)
  }

  return (
    <ul>
      {["Ada", "Grace", "Linus"].map((n) => (
        <Row key={n} name={n} onSelect={handleSelect} />
      ))}
    </ul>
  )
}
```

Data flows down as props; events flow up as callbacks. There is no other channel, which is what makes a React tree possible to reason about.

## Spreading props

```tsx
type InputProps = React.ComponentPropsWithoutRef<"input"> & { label: string }

function Field({ label, id, ...rest }: InputProps) {
  return (
    <p>
      <label htmlFor={id}>{label} </label>
      <input id={id} {...rest} />
    </p>
  )
}

export default function App() {
  return (
    <form>
      <Field label="Name" id="name" defaultValue="Ada" />
      <Field label="Email" id="email" type="email" placeholder="you@example.com" />
      <Field label="Age" id="age" type="number" defaultValue={36} readOnly />
    </form>
  )
}
```

`React.ComponentPropsWithoutRef<"input">` gives you every real `<input>` prop, correctly typed, so your wrapper does not have to re-declare them.

> 💡 **Tip:** `{...rest}` is right for a thin wrapper around a host element. It is wrong for a domain component: `<UserCard {...user} />` hides what the component actually needs, and a typo in the caller becomes a silently missing prop rather than an error.

## Composition beats configuration

Two ways to make a component flexible. The second scales better.

```tsx
// Configuration: every new variation needs a new prop and a new branch.
function ConfigCard({ title, body, footer }: { title: string; body: string; footer?: string }) {
  return (
    <section>
      <h3>{title}</h3>
      <p>{body}</p>
      {footer ? <small>{footer}</small> : null}
    </section>
  )
}

// Composition: the caller decides what goes inside.
function Card({ children }: { children: React.ReactNode }) {
  return <section>{children}</section>
}

export default function App() {
  return (
    <>
      <ConfigCard title="Configured" body="Limited to what the props allow." footer="a footer" />

      <Card>
        <h3>Composed</h3>
        <p>Anything at all can go here —</p>
        <ul>
          <li>a list,</li>
          <li>a form,</li>
          <li>another Card.</li>
        </ul>
      </Card>
    </>
  )
}
```

> 🧭 **Scenario:** A `<Modal>` grows `showCloseButton`, `closeButtonLabel`, `headerAlign`, `hideHeader`, `footerButtons`… Each one is a branch inside the component and a decision the caller has to look up. Replacing them with `children` and a couple of named slots removes all of it — the caller writes the markup it wants, and the modal only handles the behaviour that is genuinely modal.

## Slots

```tsx
type PageProps = {
  header: React.ReactNode
  sidebar?: React.ReactNode
  children: React.ReactNode
}

function Page({ header, sidebar, children }: PageProps) {
  return (
    <div>
      <header>{header}</header>
      <div>
        {sidebar ? <aside>{sidebar}</aside> : null}
        <main>{children}</main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Page
      header={<h1>Dashboard</h1>}
      sidebar={
        <nav>
          <a href="#a">One</a>
        </nav>
      }
    >
      <p>Main content goes in children.</p>
    </Page>
  )
}
```

## Purity is a requirement

Given the same props, a component must return the same JSX and change nothing outside itself.

```tsx
// Impure: mutates something that existed before the render.
let renderCount = 0

function Impure() {
  renderCount++ // ← a side effect during render
  return <p>rendered {renderCount} times</p>
}

// Pure: everything it touches was created during this render.
function Pure({ items }: { items: string[] }) {
  const upper = items.map((i) => i.toUpperCase()) // a NEW array, fine
  return <p>{upper.join(", ")}</p>
}

export default function App() {
  return (
    <div>
      <Impure />
      <Pure items={["ada", "grace"]} />
    </div>
  )
}
```

> 🔍 **Behind the scenes: why React insists on purity**
>
> React reserves the right to call your component more than once for a single update, to call it and throw the result away, and to pause a render and resume it later — that is what Concurrent rendering does. None of that is safe if rendering has side effects. In development **StrictMode** deliberately double-invokes components to surface impurity early: a counter that increments during render will visibly count twice, which is the warning, not the bug.

## Where the boundaries go

A component should have one reason to change. When a component starts needing a paragraph to describe, it is two components.

```tsx
type Person = { name: string; role: string; online: boolean }

function Status({ online }: { online: boolean }) {
  return <span>{online ? "●" : "○"}</span>
}

function PersonRow({ person }: { person: Person }) {
  return (
    <li>
      <Status online={person.online} /> <strong>{person.name}</strong> — {person.role}
    </li>
  )
}

function PersonList({ people }: { people: Person[] }) {
  return (
    <ul>
      {people.map((p) => (
        <PersonRow key={p.name} person={p} />
      ))}
    </ul>
  )
}

export default function App() {
  const people: Person[] = [
    { name: "Ada", role: "engineer", online: true },
    { name: "Grace", role: "admiral", online: false },
  ]

  return (
    <section>
      <h2>Team</h2>
      <PersonList people={people} />
    </section>
  )
}
```

Splitting is cheap — a component is a function — and it is the main tool for keeping re-renders local, which the [performance](/react/guide/performance) chapter builds on.

**Reference:** [Passing Props to a Component](https://react.dev/learn/passing-props-to-a-component) and [Keeping Components Pure](https://react.dev/learn/keeping-components-pure) on react.dev.
