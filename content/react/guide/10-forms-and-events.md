---
title: Forms & events
section: Guide Book
summary: Controlled and uncontrolled inputs, the synthetic event system, handler patterns, and why `onChange` fires on every keystroke.
---
## Events are props

```tsx
export default function App() {
  function handleClick() {
    console.log("clicked")
  }

  return (
    <div>
      <button onClick={handleClick}>pass the function</button>
      <button onClick={() => console.log("inline")}>an arrow function</button>
      <button onClick={handleClick()}>this one is WRONG</button>
    </div>
  )
}
```

Run that and `clicked` appears immediately, before you touch anything: the third button calls `handleClick` **during render** and passes its return value (`undefined`) as the handler. Pass the function; do not call it. When you need arguments, wrap it: `onClick={() => remove(id)}`.

## The synthetic event

React wraps the native event in a `SyntheticEvent` with the same API across browsers.

```tsx
export default function App() {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault() // no full-page reload
    const data = new FormData(e.currentTarget)
    console.log(Object.fromEntries(data))
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" defaultValue="ada@example.com" />
      <button type="submit">submit</button>
    </form>
  )
}
```

> 🔍 **Behind the scenes: React does not attach listeners to your elements**
>
> Since React 17, one listener per event type is attached at the **root container**, and events are dispatched through the React tree as they bubble. That means handlers fire in React-tree order — which can differ from DOM order when portals are involved — and that adding a thousand `onClick`s costs one native listener, not a thousand. It also means `e.stopPropagation()` stops React's propagation, while a native listener added with `addEventListener` may still fire.

## Bubbling and capture

```tsx
export default function App() {
  return (
    <div
      onClick={() => console.log("parent (bubble)")}
      onClickCapture={() => console.log("parent (capture) — runs first")}
    >
      <button onClick={() => console.log("child")}>click me</button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          console.log("child, parent will NOT see this")
        }}
      >
        stop propagation
      </button>
    </div>
  )
}
```

Every React event bubbles except `onScroll`. Adding `Capture` to any handler name runs it on the way down instead of the way up.

## Controlled inputs

React owns the value; the DOM only displays it.

```tsx
import { useState } from "react"

export default function App() {
  const [text, setText] = useState("")

  return (
    <div>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="type here" />
      <p>you typed {text.length} characters: "{text}"</p>
      <button onClick={() => setText("")}>clear</button>
      <button onClick={() => setText(text.toUpperCase())}>shout</button>
    </div>
  )
}
```

Because state is the source of truth, "clear" and "shout" are trivial. With an uncontrolled input you would need a ref and manual DOM writes.

> ⚠️ `value` without `onChange` makes a permanently frozen input and logs a warning. If that is what you want, say `readOnly` — or use `defaultValue` for an uncontrolled field.

## React's `onChange` is really `input`

```tsx
import { useState } from "react"

export default function App() {
  const [log, setLog] = useState<string[]>([])

  return (
    <div>
      <input onChange={(e) => setLog((l) => [...l.slice(-3), `changed: ${e.target.value}`])} />
      <ul>
        {log.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </div>
  )
}
```

The DOM's own `change` event fires when a field loses focus. React's `onChange` fires on **every keystroke**, which is what makes controlled inputs work — and what surprises people coming from plain HTML. For the on-blur behaviour, use `onBlur`.

## Every input type

```tsx
import { useState } from "react"

export default function App() {
  const [form, setForm] = useState({
    name: "Ada",
    subscribe: true,
    plan: "pro",
    size: "m",
    bio: "",
  })

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  return (
    <form>
      <p>
        <input value={form.name} onChange={(e) => update("name", e.target.value)} />
      </p>
      <p>
        <label>
          <input
            type="checkbox"
            checked={form.subscribe}
            onChange={(e) => update("subscribe", e.target.checked)}
          />{" "}
          subscribe
        </label>
      </p>
      <p>
        <select value={form.plan} onChange={(e) => update("plan", e.target.value)}>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
        </select>
      </p>
      <p>
        {["s", "m", "l"].map((s) => (
          <label key={s}>
            <input
              type="radio"
              name="size"
              value={s}
              checked={form.size === s}
              onChange={(e) => update("size", e.target.value)}
            />{" "}
            {s}{" "}
          </label>
        ))}
      </p>
      <p>
        <textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} rows={2} />
      </p>
      <pre>{JSON.stringify(form, null, 2)}</pre>
    </form>
  )
}
```

Note: checkboxes use `checked`, not `value`, and `<textarea>` takes a `value` prop rather than children as it does in HTML.

## One handler for many fields

```tsx
import { useState } from "react"

export default function App() {
  const [form, setForm] = useState({ first: "", last: "", email: "" })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  return (
    <form>
      {(["first", "last", "email"] as const).map((field) => (
        <p key={field}>
          <input name={field} value={form[field]} onChange={handleChange} placeholder={field} />
        </p>
      ))}
      <p>{JSON.stringify(form)}</p>
    </form>
  )
}
```

The `name` attribute doing double duty as the state key is the standard pattern, and it scales to any number of fields.

## Uncontrolled, with FormData

For a form you only read on submit, letting the DOM hold the values is simpler and faster.

```tsx
export default function App() {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const values = Object.fromEntries(new FormData(e.currentTarget))
    console.log(values)
  }

  return (
    <form onSubmit={handleSubmit}>
      <p>
        <input name="name" defaultValue="Ada" />
      </p>
      <p>
        <input name="email" type="email" defaultValue="ada@example.com" />
      </p>
      <p>
        <label>
          <input name="subscribe" type="checkbox" defaultChecked /> subscribe
        </label>
      </p>
      <button type="submit">submit</button>
    </form>
  )
}
```

> 💡 **Tip:** Controlled when the UI must react as the user types — live validation, a character counter, a dependent field, a disabled submit button. Uncontrolled when you just need the values at the end. Mixing them per field in one form is fine.

## Validation and errors

```tsx
import { useState } from "react"

type Errors = Partial<Record<"email" | "password", string>>

export default function App() {
  const [form, setForm] = useState({ email: "", password: "" })
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(false)

  function validate(values: typeof form): Errors {
    const next: Errors = {}
    if (!values.email.includes("@")) next.email = "That does not look like an email."
    if (values.password.length < 8) next.password = "At least 8 characters, please."
    return next
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    setSubmitted(Object.keys(found).length === 0)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <p>
        <input
          value={form.email}
          placeholder="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        {errors.email ? <span id="email-error">{errors.email}</span> : null}
      </p>
      <p>
        <input
          type="password"
          value={form.password}
          placeholder="password"
          aria-invalid={Boolean(errors.password)}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        />
        {errors.password ? <span>{errors.password}</span> : null}
      </p>
      <button type="submit">sign up</button>
      {submitted ? <p>Looks good.</p> : null}
    </form>
  )
}
```

`aria-invalid` and `aria-describedby` are what connect the message to the field for a screen reader. A red border alone is not an error message.

**Reference:** [Responding to Events](https://react.dev/learn/responding-to-events) and [Reacting to Input with State](https://react.dev/learn/reacting-to-input-with-state).
