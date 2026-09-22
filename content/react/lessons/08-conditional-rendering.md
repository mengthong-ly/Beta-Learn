---
title: Conditional rendering
section: 2 · Describing the UI
---

Components often need to show different things depending on conditions. React has no special syntax for this: you use the JavaScript you already know, like `if`, `? :` and `&&`.

## `if` and early returns

```tsx
function Item({ name, isPacked }: { name: string; isPacked: boolean }) {
  if (isPacked) {
    return <li className="item">{name} ✅</li>
  }
  return <li className="item">{name}</li>
}

export default function PackingList() {
  return (
    <section>
      <h1>Sally Ride's Packing List</h1>
      <ul>
        <Item isPacked={true} name="Space suit" />
        <Item isPacked={true} name="Helmet with a golden leaf" />
        <Item isPacked={false} name="Photo of Tam" />
      </ul>
    </section>
  )
}
```

A component can also `return null` to render nothing. That's rare in practice, because it can surprise whoever renders the component. It's more common to include or leave out the component in the parent's JSX.

## The `? :` operator

Inside JSX, `if` doesn't fit, but the conditional operator does. Read `isPacked ? name + " ✅" : name` as "if `isPacked`, render `name + " ✅"`, otherwise render `name`".

```tsx-snippet
<li className="item">{isPacked ? name + " ✅" : name}</li>
```

## The `&&` operator

When you want to render something or *nothing*, use `&&`: "if `isPacked`, render the checkmark". When the left side is `false`, React treats it as a hole and renders nothing, just like `null` or `undefined`.

```tsx-snippet
<li className="item">
  {name} {isPacked && "✅"}
</li>
```

> ⚠️ **Gotcha:** don't put a number on the left of `&&`. If `messageCount` is `0`, then `messageCount && <p>New messages</p>` renders a `0`! Make the left side a real boolean: `messageCount > 0 && ...`.

```tsx
export default function Inbox() {
  const messageCount = 0
  return (
    <div>
      <p>Wrong: {messageCount && <b>New messages</b>}</p>
      <p>Right: {messageCount > 0 && <b>New messages</b>}</p>
    </div>
  )
}
```

## Assigning JSX to a variable

When the shortcuts get hard to read, fall back to a variable and an `if`. It's the most verbose option, and the most flexible, and any JSX can go in the variable:

```tsx
import type { ReactNode } from "react"

function Item({ name, isPacked }: { name: string; isPacked: boolean }) {
  let itemContent: ReactNode = name
  if (isPacked) {
    itemContent = <del>{name + " ✅"}</del>
  }
  return <li className="item">{itemContent}</li>
}

export default function PackingList() {
  return (
    <ul>
      <Item isPacked={true} name="Space suit" />
      <Item isPacked={false} name="Photo of Tam" />
    </ul>
  )
}
```

## Challenge

> 🎯 **Challenge:** Fix `Item`: unpacked items should show `❌` (use `? :`), and the importance note should appear only when `importance` is above zero. Right now a zero importance renders a stray `0`.

```tsx starter
function Item({ name, isPacked, importance }: { name: string; isPacked: boolean; importance: number }) {
  return (
    <li className="item">
      {name} {isPacked && "✅"} {importance && <i>(Importance: {importance})</i>}
    </li>
  )
}

export default function PackingList() {
  return (
    <ul>
      <Item name="Space suit" isPacked={true} importance={9} />
      <Item name="Helmet with a golden leaf" isPacked={true} importance={0} />
      <Item name="Photo of Tam" isPacked={false} importance={6} />
    </ul>
  )
}
```

```tsx solution
function Item({ name, isPacked, importance }: { name: string; isPacked: boolean; importance: number }) {
  return (
    <li className="item">
      {name} {isPacked ? "✅" : "❌"} {importance > 0 && <i>(Importance: {importance})</i>}
    </li>
  )
}

export default function PackingList() {
  return (
    <ul>
      <Item name="Space suit" isPacked={true} importance={9} />
      <Item name="Helmet with a golden leaf" isPacked={true} importance={0} />
      <Item name="Photo of Tam" isPacked={false} importance={6} />
    </ul>
  )
}
```

```tsx check
const items = $$("li").map((li) => li.textContent.trim())
expect(items.length === 3, "Keep the three items")
expect(items[0].includes("✅") && items[0].includes("(Importance: 9)"), "Space suit: packed, importance 9")
expect(!items[1].endsWith("0") && !items[1].includes("Importance"), "An importance of 0 should render nothing, not 0")
expect(items[2].includes("❌"), "Unpacked items should show ❌")
```

**Reference:** [Conditional Rendering](https://react.dev/learn/conditional-rendering) on react.dev.
