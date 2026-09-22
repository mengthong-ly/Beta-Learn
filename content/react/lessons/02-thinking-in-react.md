---
title: Thinking in React
section: 1 · Get Started
---

React changes how you think about a design. Instead of wiring up the page step by step, you split the UI into **components**, then describe the **states** each one can be in. The official docs give five steps, applied here to a searchable product table.

## 1. Break the UI into a hierarchy

Draw a box around every piece of the mockup and give it a name. A good rule is the **single responsibility principle**: a component should ideally do one thing, and if it grows, split it.

```text
FilterableProductTable   the whole app
├── SearchBar            receives the user's input
└── ProductTable         displays and filters the list
    ├── ProductCategoryRow   a heading for each category
    └── ProductRow           a row for each product
```

## 2. Build a static version

First, render the UI from your data with **no interactivity**. Pass data down with props and don't use state yet: state is only for data that changes over time. For small apps, building top-down (starting with the outer component) is usually easiest.

```tsx
const PRODUCTS = [
  { category: "Fruits", price: "$1", stocked: true, name: "Apple" },
  { category: "Fruits", price: "$2", stocked: false, name: "Passionfruit" },
  { category: "Vegetables", price: "$2", stocked: true, name: "Spinach" },
  { category: "Vegetables", price: "$4", stocked: false, name: "Pumpkin" },
]

function ProductRow({ product }: { product: (typeof PRODUCTS)[number] }) {
  const name = product.stocked ? product.name : <span style={{ color: "red" }}>{product.name}</span>
  return (
    <tr>
      <td>{name}</td>
      <td>{product.price}</td>
    </tr>
  )
}

export default function ProductTable() {
  return (
    <table>
      <tbody>
        {PRODUCTS.map((p) => (
          <ProductRow key={p.name} product={p} />
        ))}
      </tbody>
    </table>
  )
}
```

## 3. Find the minimal state

Keep state as small as it can be, and compute everything else. For each piece of data, ask:

1. Does it **stay the same** over time? Then it isn't state.
2. Is it **passed in from a parent** through props? Then it isn't state.
3. Can you **compute it** from existing state or props? Then it *definitely* isn't state.

In the product table, the search text and the checkbox are state. The filtered list isn't: you can compute it from the product list and those two values.

## 4. Decide where the state lives

Find every component that renders something based on the state, then find their **closest common parent**. That's usually where the state belongs. Here, both `SearchBar` and `ProductTable` need the filter, so it lives in `FilterableProductTable`.

## 5. Add inverse data flow

Data flows down through props. To let a child change the parent's state, pass the setter function down too, and call it from the child's event handler:

```tsx-snippet
<input value={filterText} onChange={(e) => onFilterTextChange(e.target.value)} />
```

## Challenge

> 🎯 **Challenge:** The table below is a static version: typing in the search box or ticking the checkbox changes nothing. Add `filterText` and `inStockOnly` state to `FilterableProductTable`, pass them down, and let `SearchBar` update them.

```tsx starter
import { useState } from "react"

type Product = { category: string; price: string; stocked: boolean; name: string }

const PRODUCTS: Product[] = [
  { category: "Fruits", price: "$1", stocked: true, name: "Apple" },
  { category: "Fruits", price: "$1", stocked: true, name: "Dragonfruit" },
  { category: "Fruits", price: "$2", stocked: false, name: "Passionfruit" },
  { category: "Vegetables", price: "$2", stocked: true, name: "Spinach" },
  { category: "Vegetables", price: "$4", stocked: false, name: "Pumpkin" },
  { category: "Vegetables", price: "$1", stocked: true, name: "Peas" },
]

function SearchBar() {
  return (
    <form>
      <input type="text" placeholder="Search..." />
      <label>
        <input type="checkbox" /> Only show products in stock
      </label>
    </form>
  )
}

function ProductTable({ filterText, inStockOnly }: { filterText: string; inStockOnly: boolean }) {
  const visible = PRODUCTS.filter(
    (p) => p.name.toLowerCase().includes(filterText.toLowerCase()) && (!inStockOnly || p.stocked)
  )
  return (
    <table>
      <tbody>
        {visible.map((p) => (
          <tr key={p.name}>
            <td style={{ color: p.stocked ? undefined : "red" }}>{p.name}</td>
            <td>{p.price}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function FilterableProductTable() {
  return (
    <div>
      <SearchBar />
      <ProductTable filterText="" inStockOnly={false} />
    </div>
  )
}
```

```tsx solution
import { useState } from "react"

type Product = { category: string; price: string; stocked: boolean; name: string }

const PRODUCTS: Product[] = [
  { category: "Fruits", price: "$1", stocked: true, name: "Apple" },
  { category: "Fruits", price: "$1", stocked: true, name: "Dragonfruit" },
  { category: "Fruits", price: "$2", stocked: false, name: "Passionfruit" },
  { category: "Vegetables", price: "$2", stocked: true, name: "Spinach" },
  { category: "Vegetables", price: "$4", stocked: false, name: "Pumpkin" },
  { category: "Vegetables", price: "$1", stocked: true, name: "Peas" },
]

function SearchBar({
  filterText,
  inStockOnly,
  onFilterTextChange,
  onInStockOnlyChange,
}: {
  filterText: string
  inStockOnly: boolean
  onFilterTextChange: (text: string) => void
  onInStockOnlyChange: (checked: boolean) => void
}) {
  return (
    <form>
      <input
        type="text"
        placeholder="Search..."
        value={filterText}
        onChange={(e) => onFilterTextChange(e.target.value)}
      />
      <label>
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={(e) => onInStockOnlyChange(e.target.checked)}
        />{" "}
        Only show products in stock
      </label>
    </form>
  )
}

function ProductTable({ filterText, inStockOnly }: { filterText: string; inStockOnly: boolean }) {
  const visible = PRODUCTS.filter(
    (p) => p.name.toLowerCase().includes(filterText.toLowerCase()) && (!inStockOnly || p.stocked)
  )
  return (
    <table>
      <tbody>
        {visible.map((p) => (
          <tr key={p.name}>
            <td style={{ color: p.stocked ? undefined : "red" }}>{p.name}</td>
            <td>{p.price}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function FilterableProductTable() {
  const [filterText, setFilterText] = useState("")
  const [inStockOnly, setInStockOnly] = useState(false)
  return (
    <div>
      <SearchBar
        filterText={filterText}
        inStockOnly={inStockOnly}
        onFilterTextChange={setFilterText}
        onInStockOnlyChange={setInStockOnly}
      />
      <ProductTable filterText={filterText} inStockOnly={inStockOnly} />
    </div>
  )
}
```

```tsx check
const names = () => $$("tbody tr td:first-child").map((td) => td.textContent)
expect(names().length === 6, "Show all six products at first")
await type($("input[type=text]"), "fruit")
expect(names().join() === "Dragonfruit,Passionfruit", "Typing 'fruit' should leave only Dragonfruit and Passionfruit")
await click($("input[type=checkbox]"))
expect(names().join() === "Dragonfruit", "Ticking the checkbox should hide out-of-stock products")
```

**Reference:** [Thinking in React](https://react.dev/learn/thinking-in-react) on react.dev.
