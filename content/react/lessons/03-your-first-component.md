---
title: Your first component
section: 2 · Describing the UI
---

A React component is a JavaScript function that returns markup. You define one in three steps: **export** it, **define** the function, and **return** the markup.

```tsx
export default function Profile() {
  return <img src="https://i.imgur.com/MK3eW3Am.jpg" alt="Katherine Johnson" />
}
```

Press **Try it**, then **Run**: the Preview tab shows what the component renders.

## Capital letters

React components are regular JavaScript functions, but their names must start with a capital letter or they won't work. React treats `<section />` as an HTML tag and `<Profile />` as your component.

## Returning several lines

If the markup spans several lines, wrap it in parentheses. Without them, everything after `return` on the following lines is ignored.

```tsx
function Profile() {
  return <img src="https://i.imgur.com/MK3eW3Am.jpg" alt="Katherine Johnson" width={100} />
}

export default function Gallery() {
  return (
    <section>
      <h1>Amazing scientists</h1>
      <Profile />
      <Profile />
    </section>
  )
}
```

## Define components at the top level

Components can render other components, but never *define* a component inside another one. Declare every component at the top level of the file, and pass data down with props when a child needs something from its parent.

```tsx-snippet
export default function Gallery() {
  // 🔴 Never define a component inside another component!
  function Profile() {
    // ...
  }
  // ...
}
```

Your app starts at a **root** component (here, the `export default` one), and most React apps use components all the way down: not just for buttons, but for sidebars, lists and whole pages.

## Challenge

> 🎯 **Challenge:** Export a component that renders an `<h1>` saying `Hello, React!`.

```tsx starter
export default function App() {
  return null
}
```

```tsx solution
export default function App() {
  return <h1>Hello, React!</h1>
}
```

```tsx check
expect($("h1")?.textContent === "Hello, React!", "Render an <h1> with the text Hello, React!")
```

**Reference:** [Your First Component](https://react.dev/learn/your-first-component) on react.dev.
