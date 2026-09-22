---
title: Importing and exporting
section: 2 · Describing the UI
---

As an app grows, you split components into their own files. Each file **exports** what it offers, and other files **import** what they need. This is plain JavaScript modules, nothing React-specific.

## Moving a component to a file

It takes three steps:

1. **Make** a new file for the components.
2. **Export** the component from that file (a default or a named export).
3. **Import** it in the file that uses it.

```tsx-snippet
// Gallery.tsx
function Profile() {
  return <img src="https://react.dev/images/docs/scientists/QIrZWGIs.jpg" alt="Alan L. Hart" />
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

// App.tsx
import Gallery from "./Gallery"

export default function App() {
  return <Gallery />
}
```

The file with your top-level component is the **root component file**. In frameworks with file-based routing, like Next.js, each page has its own root component.

## Default vs named exports

| Syntax | Export statement | Import statement |
|---|---|---|
| Default | `export default function Button() {}` | `import Button from "./Button.js"` |
| Named | `export function Button() {}` | `import { Button } from "./Button.js"` |

- A file can have **at most one default** export, but **as many named** exports as you like.
- With a default import you can pick any name: `import Banana from "./Button.js"` still works. With a named import, the name must match on both sides.
- You can leave off the extension (`"./Gallery"`) and React setups will still find the file, but `"./Gallery.js"` is closer to how native modules work.

> 💡 **Tip:** Avoid anonymous components like `export default () => {}`. They work, but a name makes debugging much easier.

## One file here

ThongLearn runs each example as a single file and renders its **default export**. You can still use both kinds of export in one file:

```tsx
export function Profile() {
  return <img src="https://react.dev/images/docs/scientists/MK3eW3As.jpg" alt="Katherine Johnson" width={100} />
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

## Challenge

> 🎯 **Challenge:** Right now `Profile` is the default export, so the preview shows a single image. Make `Gallery` the default export and turn `Profile` into a **named** export, so the whole gallery renders.

```tsx starter
export default function Profile() {
  return <img src="https://react.dev/images/docs/scientists/MK3eW3As.jpg" alt="Katherine Johnson" width={100} />
}

function Gallery() {
  return (
    <section>
      <h1>Amazing scientists</h1>
      <Profile />
      <Profile />
      <Profile />
    </section>
  )
}
```

```tsx solution
export function Profile() {
  return <img src="https://react.dev/images/docs/scientists/MK3eW3As.jpg" alt="Katherine Johnson" width={100} />
}

export default function Gallery() {
  return (
    <section>
      <h1>Amazing scientists</h1>
      <Profile />
      <Profile />
      <Profile />
    </section>
  )
}
```

```tsx check
expect($("h1")?.textContent === "Amazing scientists", "The preview should render Gallery, with its <h1>")
expect($$("section img").length === 3, "Gallery should show three profiles")
```

**Reference:** [Importing and Exporting Components](https://react.dev/learn/importing-and-exporting-components) on react.dev.
