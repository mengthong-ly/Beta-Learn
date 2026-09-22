---
title: Writing markup with JSX
section: 2 · Describing the UI
---

JSX lets you write HTML-like markup inside JavaScript. As the web grew more interactive, logic took charge of the content, so React keeps a component's **markup and rendering logic together**. That keeps a button's markup and its behavior in sync.

JSX and React are separate things: they're usually used together, but you *could* use either without the other.

## Rule 1: return a single root element

A component returns **one** element. To return several, wrap them in a parent tag, or in a **Fragment** (`<>...</>`), which groups them without adding anything to the page.

```tsx
export default function TodoList() {
  return (
    <>
      <h1>Hedy Lamarr's Todos</h1>
      <ul>
        <li>Invent new traffic lights</li>
        <li>Rehearse a movie scene</li>
      </ul>
    </>
  )
}
```

Why? Under the hood, JSX is turned into plain JavaScript objects, and a function can't return two objects without wrapping them in something.

```tsx
export default function Broken() {
  // error! two root elements
  return (
    <h1>Hedy Lamarr's Todos</h1>
    <ul></ul>
  )
}
```

## Rule 2: close all the tags

Self-closing tags need a slash: `<img>` becomes `<img />`. Wrapping tags need their end tag: `<li>oranges` becomes `<li>oranges</li>`.

## Rule 3: camelCase most things

JSX attributes become keys of JavaScript objects, so most HTML and SVG attributes are written in camelCase: `stroke-width` becomes `strokeWidth`. And because `class` is a reserved word in JavaScript, React uses `className`.

The exception: for historical reasons, `aria-*` and `data-*` attributes keep their dashes.

```tsx
export default function Photo() {
  return (
    <img
      src="https://react.dev/images/docs/scientists/yXOvdOSs.jpg"
      alt="Hedy Lamarr"
      className="photo"
      aria-describedby="caption"
      data-person-id="42"
      width={120}
    />
  )
}
```

> 💡 **Tip:** Converting a big chunk of HTML by hand is tedious. The docs recommend an [HTML-to-JSX converter](https://transform.tools/html-to-jsx).

## Challenge

> 🎯 **Challenge:** This markup was pasted straight from an HTML file, so it doesn't compile. Fix it: give the component a single root, close the `<br>` tags, and use `className`.

```tsx starter
export default function Bio() {
  return (
    <div class="intro">
      <h1>Welcome to my website!</h1>
    </div>
    <p class="summary">
      You can find my thoughts here.
      <br><br>
      <b>And <i>pictures</i></b> of scientists!
    </p>
  )
}
```

```tsx solution
export default function Bio() {
  return (
    <>
      <div className="intro">
        <h1>Welcome to my website!</h1>
      </div>
      <p className="summary">
        You can find my thoughts here.
        <br />
        <br />
        <b>
          And <i>pictures</i>
        </b>{" "}
        of scientists!
      </p>
    </>
  )
}
```

```tsx check
expect($(".intro h1")?.textContent === "Welcome to my website!", "Keep the <h1> inside div.intro")
expect($$("p.summary br").length === 2, "p.summary should contain two <br /> tags")
expect($("p.summary b i")?.textContent === "pictures", "Keep the bold and italic text")
```

**Reference:** [Writing Markup with JSX](https://react.dev/learn/writing-markup-with-jsx) on react.dev.
