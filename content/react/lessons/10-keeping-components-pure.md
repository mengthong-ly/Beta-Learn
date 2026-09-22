---
title: Keeping components pure
section: 2 · Describing the UI
---

In math, a **pure function** does two things:

1. **It minds its own business.** It doesn't change any object or variable that existed before it was called.
2. **Same inputs, same output.** Given the same inputs, it always returns the same result.

React assumes **every component you write is a pure function**: given the same inputs, it must always return the same JSX.

## Breaking the rule

This `Cup` changes a variable that lives outside it. Each call returns something different, so the result depends on how many times React happens to call it:

```tsx
let guest = 0

function Cup() {
  // Bad: changing a preexisting variable!
  guest = guest + 1
  return <h2>Tea cup for guest #{guest}</h2>
}

export default function TeaSet() {
  return (
    <>
      <Cup />
      <Cup />
      <Cup />
    </>
  )
}
```

The fix is to pass the value in as a prop, so each `Cup` only depends on its input:

```tsx
function Cup({ guest }: { guest: number }) {
  return <h2>Tea cup for guest #{guest}</h2>
}

export default function TeaSet() {
  return (
    <>
      <Cup guest={1} />
      <Cup guest={2} />
      <Cup guest={3} />
    </>
  )
}
```

While rendering, a component can read three kinds of input: **props**, **state** and **context**. Treat all three as read-only.

> 🔍 **Behind the scenes: Strict Mode renders twice**
>
> In development, wrapping your app in `<StrictMode>` makes React call each component function **twice**. A pure component doesn't care, just as calling `double(2)` twice changes nothing. An impure one, like the first `Cup`, shows wrong numbers right away. ThongLearn's preview doesn't use Strict Mode, so you see each render once.

## Local mutation is fine

Purity is about *preexisting* data. Changing a variable or array you **just created** during this render is fine, because no code outside can see it:

```tsx
function Cup({ guest }: { guest: number }) {
  return <h2>Tea cup for guest #{guest}</h2>
}

export default function TeaGathering() {
  const cups = []
  for (let i = 1; i <= 4; i++) {
    cups.push(<Cup key={i} guest={i} />)
  }
  return cups
}
```

## Where side effects go

Updating the screen, starting an animation or changing data are **side effects**: things that happen on the side, not during rendering. They usually belong in **event handlers**, which don't run during rendering and so don't need to be pure. If nothing else fits, `useEffect` runs code after rendering, as a last resort.

Why so strict? Pure components can render on a server, can be skipped when their inputs haven't changed, and can be safely interrupted and restarted by React mid-render.

## Challenge

> 🎯 **Challenge:** `StoryTray` adds a "Create Story" item by pushing onto its `stories` prop. That mutates an array it doesn't own, so the second tray shows the item twice. Make `StoryTray` pure: copy the array before adding to it.

```tsx starter
type Story = { id: string | number; label: string }

const initialStories: Story[] = [
  { id: 0, label: "Ankit's Story" },
  { id: 1, label: "Taylor's Story" },
]

function StoryTray({ stories }: { stories: Story[] }) {
  stories.push({ id: "create", label: "Create Story" })
  return (
    <ul>
      {stories.map((story, i) => (
        <li key={i}>{story.label}</li>
      ))}
    </ul>
  )
}

export default function App() {
  return (
    <>
      <StoryTray stories={initialStories} />
      <StoryTray stories={initialStories} />
    </>
  )
}
```

```tsx solution
type Story = { id: string | number; label: string }

const initialStories: Story[] = [
  { id: 0, label: "Ankit's Story" },
  { id: 1, label: "Taylor's Story" },
]

function StoryTray({ stories }: { stories: Story[] }) {
  const items = [...stories, { id: "create", label: "Create Story" }]
  return (
    <ul>
      {items.map((story) => (
        <li key={story.id}>{story.label}</li>
      ))}
    </ul>
  )
}

export default function App() {
  return (
    <>
      <StoryTray stories={initialStories} />
      <StoryTray stories={initialStories} />
    </>
  )
}
```

```tsx check
const trays = $$("ul").map((ul) => [...ul.querySelectorAll("li")].map((li) => li.textContent))
expect(trays.length === 2, "Keep the two trays")
for (const tray of trays) {
  expect(tray.length === 3, `Each tray should have 3 items, got ${tray.length}: ${tray.join(", ")}`)
  expect(tray[2] === "Create Story", "The last item should be Create Story")
}
```

**Reference:** [Keeping Components Pure](https://react.dev/learn/keeping-components-pure) on react.dev.
