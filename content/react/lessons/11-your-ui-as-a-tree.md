---
title: Your UI as a tree
section: 2 · Describing the UI
---

Trees are a natural way to model how things relate. Browsers use them for HTML (the DOM) and CSS, and React builds a tree from your components too. Thinking in trees helps you see how data flows and where rendering cost comes from.

## The render tree

Every time React renders, it builds a **render tree**: each node is a component, and each branch points from a parent to a child it renders. The root node is your app's root component.

```tsx
function FancyText({ title, text }: { title?: boolean; text: string }) {
  return title ? <h1 className="fancy title">{text}</h1> : <h3 className="fancy cursive">{text}</h3>
}

function Copyright({ year }: { year: number }) {
  return <p className="small">©️ {year}</p>
}

export default function App() {
  return (
    <>
      <FancyText title text="Get Inspired App" />
      <FancyText text="Stay curious." />
      <Copyright year={2004} />
    </>
  )
}
```

```text
App
├── FancyText
├── FancyText
└── Copyright
```

Notice that `<h1>` and `<p>` aren't in the tree. The render tree only holds **components**, because React is platform-agnostic: the same tree could render to a phone instead of a web page.

## Top-level and leaf components

- **Top-level components** sit near the root. They affect the rendering of everything below them and often hold the most complexity.
- **Leaf components** sit at the bottom, have no child components, and often re-render frequently.

Knowing which is which helps you understand data flow and debug rendering performance.

## The tree can change

With conditional rendering, a parent may render different children depending on its data. So across renders, the render tree can contain **different components**.

```tsx-snippet
function InspirationGenerator({ inspiration }) {
  // One render has FancyText here, another has Color.
  return inspiration.type === "quote" ? <FancyText text={inspiration.value} /> : <Color value={inspiration.value} />
}
```

## The module dependency tree

A second tree comes from your files. In the **module dependency tree**, each node is a module and each branch is an `import`. It includes non-component modules too, like a file of data or helpers. Bundlers use this tree to decide which code to ship, and it's useful when debugging a bundle that has grown too large.

## Challenge

> 🎯 **Challenge:** `InspirationGenerator` always renders `FancyText`, so the color shows up as plain text. Make it render `<Color value={...} />` when the inspiration's `type` is `"color"`, and `FancyText` for quotes.

```tsx starter
type Inspiration = { type: "quote" | "color"; value: string }

function FancyText({ text }: { text: string }) {
  return <h3 className="fancy">{text}</h3>
}

function Color({ value }: { value: string }) {
  return <div className="colorbox" style={{ backgroundColor: value, width: 60, height: 60 }} />
}

function InspirationGenerator({ inspiration }: { inspiration: Inspiration }) {
  return <FancyText text={inspiration.value} />
}

export default function App() {
  return (
    <>
      <InspirationGenerator inspiration={{ type: "quote", value: "Don't let yesterday take up too much of today." }} />
      <InspirationGenerator inspiration={{ type: "color", value: "#B73636" }} />
      <InspirationGenerator inspiration={{ type: "quote", value: "Ambition is putting a ladder against the sky." }} />
    </>
  )
}
```

```tsx solution
type Inspiration = { type: "quote" | "color"; value: string }

function FancyText({ text }: { text: string }) {
  return <h3 className="fancy">{text}</h3>
}

function Color({ value }: { value: string }) {
  return <div className="colorbox" style={{ backgroundColor: value, width: 60, height: 60 }} />
}

function InspirationGenerator({ inspiration }: { inspiration: Inspiration }) {
  return inspiration.type === "color" ? <Color value={inspiration.value} /> : <FancyText text={inspiration.value} />
}

export default function App() {
  return (
    <>
      <InspirationGenerator inspiration={{ type: "quote", value: "Don't let yesterday take up too much of today." }} />
      <InspirationGenerator inspiration={{ type: "color", value: "#B73636" }} />
      <InspirationGenerator inspiration={{ type: "quote", value: "Ambition is putting a ladder against the sky." }} />
    </>
  )
}
```

```tsx check
expect($$(".fancy").length === 2, "The two quotes should render as FancyText")
const box = $(".colorbox") as HTMLElement | null
expect(box !== null, "The color inspiration should render a Color component")
expect(box!.style.backgroundColor === "rgb(183, 54, 54)", "Color should use the inspiration's value as its background")
```

**Reference:** [Understanding Your UI as a Tree](https://react.dev/learn/understanding-your-ui-as-a-tree) on react.dev.
