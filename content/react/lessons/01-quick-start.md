---
title: Quick start
section: 1 · Get Started
---

This lesson is a tour of the ideas you'll use every day in React. Each one gets its own lesson later, so don't worry about memorizing anything yet.

## Components

A React app is made of **components**: JavaScript functions that return markup. You can nest one component inside another, just like HTML tags.

```tsx
function MyButton() {
  return <button>I'm a button</button>
}

export default function MyApp() {
  return (
    <div>
      <h1>Welcome to my app</h1>
      <MyButton />
    </div>
  )
}
```

Component names always start with a capital letter (`MyButton`), while HTML tags are lowercase (`button`). That's how React tells them apart.

## JSX

The markup is called **JSX**. It's stricter than HTML: you must close every tag (`<br />`), and a component can't return two tags side by side. Wrap them in a parent, or in an empty `<>...</>` fragment. CSS classes are set with `className`.

```tsx
export default function AboutPage() {
  return (
    <>
      <h1 className="title">About</h1>
      <p>Hello there.<br />How do you do?</p>
    </>
  )
}
```

## Showing data

Curly braces open a window back into JavaScript. Use them in text, and use them *instead of quotes* for attributes. `style={{ ... }}` is simply an object inside the braces.

```tsx
const user = {
  name: "Hedy Lamarr",
  imageUrl: "https://i.imgur.com/yXOvdOSs.jpg",
  imageSize: 90,
}

export default function Profile() {
  return (
    <>
      <h1>{user.name}</h1>
      <img
        src={user.imageUrl}
        alt={"Photo of " + user.name}
        style={{ width: user.imageSize, height: user.imageSize, borderRadius: "50%" }}
      />
    </>
  )
}
```

## Conditions and lists

There's no special template syntax. You use plain JavaScript: `if`, the `? :` operator, `&&`, and `map()` for lists. Each list item needs a `key` that identifies it among its siblings, usually an ID from your data.

```tsx
const products = [
  { title: "Cabbage", isFruit: false, id: 1 },
  { title: "Garlic", isFruit: false, id: 2 },
  { title: "Apple", isFruit: true, id: 3 },
]

export default function ShoppingList() {
  return (
    <ul>
      {products.map((product) => (
        <li key={product.id} style={{ color: product.isFruit ? "magenta" : "darkgreen" }}>
          {product.title} {product.isFruit && "🍎"}
        </li>
      ))}
    </ul>
  )
}
```

## Events and state

To respond to a click, pass a function to `onClick`. Pass it, don't call it: `onClick={handleClick}` has no parentheses, because React calls it for you later.

To make a component *remember* something, use `useState`. It gives you the current value and a function to update it. Each copy of a component gets its own state.

```tsx
import { useState } from "react"

function MyButton() {
  const [count, setCount] = useState(0)

  function handleClick() {
    setCount(count + 1)
  }

  return <button onClick={handleClick}>Clicked {count} times</button>
}

export default function MyApp() {
  return (
    <div>
      <h1>Counters that update separately</h1>
      <MyButton />
      <MyButton />
    </div>
  )
}
```

Functions whose names start with `use` are called **Hooks**. Call them only at the top of a component (or another Hook), never inside a condition or a loop.

## Sharing data

To make two components share data, move the state **up** into their closest common parent, then pass it down as **props**: the attributes you write on a component, like `count={count}`.

## Challenge

> 🎯 **Challenge:** The two buttons count separately. Lift the state into `MyApp` and pass `count` and `onClick` down as props, so clicking either button updates **both**.

```tsx starter
import { useState } from "react"

function MyButton() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>
}

export default function MyApp() {
  return (
    <div>
      <h1>Counters that update together</h1>
      <MyButton />
      <MyButton />
    </div>
  )
}
```

```tsx solution
import { useState } from "react"

function MyButton({ count, onClick }: { count: number; onClick: () => void }) {
  return <button onClick={onClick}>Clicked {count} times</button>
}

export default function MyApp() {
  const [count, setCount] = useState(0)

  function handleClick() {
    setCount(count + 1)
  }

  return (
    <div>
      <h1>Counters that update together</h1>
      <MyButton count={count} onClick={handleClick} />
      <MyButton count={count} onClick={handleClick} />
    </div>
  )
}
```

```tsx check
const buttons = $$("button")
expect(buttons.length === 2, "Keep the two buttons")
await click(buttons[0])
await click(buttons[1])
expect(buttons[0].textContent === "Clicked 2 times", "Clicking either button should update the shared count")
expect(buttons[1].textContent === "Clicked 2 times", "Both buttons should show the same count")
```

**Reference:** [Quick Start](https://react.dev/learn) on react.dev.
