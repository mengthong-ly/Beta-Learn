---
title: JSX
section: Guide Book
summary: What JSX compiles to, the rules that trip people up, expressions versus statements, and how children and fragments work.
---
JSX is syntax sugar. Every tag becomes a function call, and understanding that call explains every rule JSX has.

## What it compiles to

```text
<h1 className="title">Hello {name}</h1>

           ↓ compiles to

jsx("h1", { className: "title", children: ["Hello ", name] })
```

The compiler turns each element into a call that returns a plain object. That is why JSX is an **expression**: it evaluates to a value you can store, pass and return.

```tsx
export default function App() {
  const heading = <h1>Stored in a variable</h1>
  const list = [<li key="a">passed in an array</li>, <li key="b">and another</li>]

  function make(text: string) {
    return <p>returned from a function: {text}</p>
  }

  return (
    <div>
      {heading}
      <ul>{list}</ul>
      {make("like any other value")}
    </div>
  )
}
```

## One root element

A function returns one value, so JSX must produce one element. Wrap siblings in a parent — or in a **fragment**, which adds no DOM node.

```tsx
export default function App() {
  return (
    <>
      <h2>A fragment</h2>
      <p>These two are siblings with no wrapper div in the output.</p>
      <table>
        <tbody>
          <tr>
            {/* a fragment is essential here: a div between tr and td is invalid HTML */}
            <>
              <td>one</td>
              <td>two</td>
            </>
          </tr>
        </tbody>
      </table>
    </>
  )
}
```

Use the long form `<React.Fragment key={…}>` when a fragment needs a key — the `<>` shorthand cannot take props.

## Attributes are props, and props are JavaScript

`class` and `for` are reserved words in JavaScript, so JSX uses `className` and `htmlFor`. Every other attribute becomes camelCase.

```tsx
export default function App() {
  const isActive = true
  const styles = { color: "steelblue", fontWeight: "bold" as const }

  return (
    <div>
      <label htmlFor="name" className={isActive ? "active" : "inactive"}>
        Name
      </label>
      <input id="name" defaultValue="Ada" readOnly tabIndex={0} />
      <p style={styles}>style takes an object, not a string</p>
      <p data-testid="kept-as-is" aria-label="dashes survive">
        data-* and aria-* keep their dashes
      </p>
    </div>
  )
}
```

> 🔍 **Behind the scenes: `style` is an object because it is a prop**
>
> `style="color: red"` would be a string that React has to parse on every render. Passing `{{ color: "red" }}` gives React an object it can diff key by key and apply directly to `element.style`. The double braces are not special syntax — the outer pair enters JavaScript, the inner pair is an object literal. The `as const` above is only needed because TypeScript widens `"bold"` to `string`, which `fontWeight` does not accept.

## Curly braces take an expression, not a statement

```tsx
export default function App() {
  const user = { name: "Ada", admin: true }
  const items = ["one", "two"]

  return (
    <div>
      {/* expressions are fine */}
      <p>{user.name.toUpperCase()}</p>
      <p>{1 + 2}</p>
      <p>{user.admin ? "admin" : "member"}</p>
      <p>{items.map((i) => i).join(", ")}</p>

      {/* statements are not — this must be an if OUTSIDE the JSX, or a ternary inside */}
      {user.admin && <p>Rendered only when admin is true</p>}
    </div>
  )
}
```

`if`, `for` and `switch` are statements and cannot go inside braces. Compute above the `return`, or use a ternary.

```tsx
export default function App() {
  const score = 72

  let grade: string
  if (score >= 90) grade = "A"
  else if (score >= 70) grade = "B"
  else grade = "C"

  return (
    <div>
      <p>Computed before the return: {grade}</p>
      <p>Or inline with a ternary: {score >= 70 ? "pass" : "fail"}</p>
    </div>
  )
}
```

## The `&&` trap

`cond && <El />` renders nothing when `cond` is `false`, `null` or `undefined` — but a `0` is rendered, because `0` is a falsy *value* React knows how to display.

```tsx
export default function App() {
  const count = 0
  const items: string[] = []

  return (
    <div>
      <p>Below, the 0 leaks into the output:</p>
      <div>{count && <span>there are {count}</span>}</div>

      <p>Same bug with an empty array's length:</p>
      <div>{items.length && <span>items!</span>}</div>

      <p>The fix — make the condition a real boolean:</p>
      <div>{count > 0 ? <span>there are {count}</span> : null}</div>
      <div>{items.length > 0 && <span>items!</span>}</div>
    </div>
  )
}
```

> ⚠️ This is the most common JSX bug in production React. A stray `0` appears on the page because someone wrote `{cart.length && <Basket />}`. Always compare: `cart.length > 0 &&`.

## What React renders and what it skips

```tsx
export default function App() {
  return (
    <div>
      <p>string: {"text"}</p>
      <p>number: {42}</p>
      <p>array: {[1, 2, 3]}</p>
      <p>null renders nothing: [{null}]</p>
      <p>undefined renders nothing: [{undefined}]</p>
      <p>false renders nothing: [{false}]</p>
      <p>true renders nothing: [{true}]</p>
    </div>
  )
}
```

Objects are the exception — rendering one throws. `{user}` is a mistake; `{user.name}` or `{JSON.stringify(user)}` is what you meant.

## Children

Whatever sits between the tags arrives as the `children` prop.

```tsx
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  )
}

function Split({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div>
      <div>{left}</div>
      <div>{right}</div>
    </div>
  )
}

export default function App() {
  return (
    <>
      <Card title="Anything can be children">
        <p>Including whole elements,</p>
        <ul>
          <li>lists,</li>
          <li>and more components.</li>
        </ul>
      </Card>

      <Split left={<strong>left side</strong>} right={<em>right side</em>} />
    </>
  )
}
```

> 💡 **Tip:** `children` is the simplest way to avoid prop drilling. A component that accepts `children` does not need to know what it wraps, so the data stays where it started instead of being threaded through three layers as props.

## Comments and whitespace

```tsx
export default function App() {
  return (
    <div>
      {/* a JSX comment is an expression containing a JS comment */}
      <p>
        Multiple lines of text are collapsed to single spaces, and leading or trailing
        whitespace around a newline is dropped entirely.
      </p>
      <p>
        {"Explicit spaces "}
        need a string, or {" "}
        an entity.
      </p>
    </div>
  )
}
```

## Capitalisation decides everything

```tsx
function Button({ label }: { label: string }) {
  return <button>{label}</button>
}

export default function App() {
  return (
    <div>
      {/* lowercase → a host element, passed to the DOM as the string "div" */}
      <div>host element</div>

      {/* Capitalised → a reference to the Button variable in scope */}
      <Button label="component" />
    </div>
  )
}
```

A lowercase custom component silently becomes an unknown HTML tag. If a component "renders nothing and logs a warning about an unrecognised tag", check the first letter.

**Reference:** [Writing Markup with JSX](https://react.dev/learn/writing-markup-with-jsx) and [JavaScript in JSX](https://react.dev/learn/javascript-in-jsx-with-curly-braces) on react.dev.
