---
title: Modules & declaration files
section: Guide Book
summary: What makes a file a module, type-only imports, how `.d.ts` files describe untyped JavaScript, and why module resolution goes wrong.
---
## A file is a module if it has an import or export

Without one, it is a **script**: everything in it lands in the global scope and collides with everything else.

```typescript
const message = "I am a module, because this file exports something"

export const version = "1.0"

console.log(message, version)
```

An empty `export {}` is the standard way to make a file a module when it has nothing to share.

## Exporting and importing

```typescript
// Named exports — several per file, imported by name.
export const PI = 3.14159
export function area(r: number): number {
  return PI * r ** 2
}
export type Shape = { r: number }

// A default export — one per file.
export default function circle(r: number): Shape {
  return { r }
}

console.log(area(circle(2).r).toFixed(2))
```

The import forms, for reference:

```typescript-snippet
import circle from "./circle.js"              // default
import { area, PI } from "./circle.js"        // named
import { area as circleArea } from "./circle.js"
import * as shapes from "./circle.js"         // namespace
import type { Shape } from "./circle.js"      // types only
import "./side-effects.js"                    // run it, import nothing

export { area } from "./circle.js"            // re-export
export * from "./circle.js"
```

> ⚠️ Under `NodeNext` resolution, relative imports need the **`.js`** extension — even from a `.ts` file, and even though the file on disk is `.ts`. You are naming the file that will exist after compilation, not the source. `allowImportingTsExtensions` relaxes this for bundler setups.

## Type-only imports and exports

`import type` is erased entirely. It tells the compiler "this is only a type" and guarantees no run-time import is emitted.

```typescript
export type User = { id: number; name: string }
export const VERSION = "1.0"

// In a consuming file these would be:
//   import type { User } from "./mod.js"      — erased
//   import { VERSION } from "./mod.js"        — a real import
//   import { type User, VERSION } from "./mod.js"  — mixed, User erased

const u: User = { id: 1, name: "Ada" }
console.log(u.name, VERSION)
```

> 🔍 **Behind the scenes: why the distinction matters**
>
> A plain `import { User } from "./models.js"` where `User` is only a type is normally elided — but the compiler has to *know* it is only a type, which needs whole-program information that bundlers and single-file transpilers (esbuild, SWC, Babel) do not have. They see an import and either keep it (pulling in a module for nothing, possibly with side effects) or guess. `import type` removes the guesswork, which is why `verbatimModuleSyntax` and `isolatedModules` push you towards it.

## Declaration files

A `.d.ts` file contains types and no implementation. It is how TypeScript describes JavaScript it cannot see.

```typescript-snippet
// legacy-maths.d.ts — describing an untyped JavaScript library
declare module "legacy-maths" {
  export function add(a: number, b: number): number
  export const VERSION: string
  export default function calculate(expr: string): number
}
```

```typescript-snippet
// globals.d.ts — describing things that exist at run time but not in any module
declare global {
  interface Window {
    myApp: { version: string }
  }
  var __DEV__: boolean
}

export {}
```

`declare` means "this exists; take my word for it". Nothing is emitted, and nothing is verified.

```typescript
declare const INJECTED_VERSION: string   // a build tool will define this

// TypeScript believes it. At run time it may not exist at all:
console.log(typeof INJECTED_VERSION)
```

> 🧭 **Scenario:** A team declares `declare const API_URL: string` for a value their bundler injects. Someone runs the code in a test harness without the bundler, `API_URL` is genuinely undefined, and the error is a bare `ReferenceError` a long way from the declaration. `declare` describes the world; it does not create it.

## Where types come from

For a package `foo`, the compiler looks, in order:

1. `types` / `typings` in `foo`'s `package.json`, or `exports` with a `types` condition
2. an `index.d.ts` next to the JavaScript
3. `node_modules/@types/foo` — the community-maintained DefinitelyTyped package
4. nothing, and `foo` is implicitly `any` (an error under `noImplicitAny`)

```typescript
// Modern packages ship their own types, so this needs no @types package:
const parsed: unknown = JSON.parse('{"a":1}')
console.log(parsed)
```

## Namespaces: the thing you probably do not want

Before ES modules, TypeScript had `namespace` for grouping. It still works and still appears in `.d.ts` files describing global libraries, but for application code modules replaced it entirely.

```typescript
namespace Geometry {
  export const PI = 3.14159
  export function circleArea(r: number): number {
    return PI * r ** 2
  }
}

console.log(Geometry.circleArea(2).toFixed(2))
```

> 💡 **Tip:** If you are writing `namespace` in a `.ts` file in 2026, you almost certainly want a module instead. Modules give you real isolation, tree shaking and tooling support; namespaces give you a shared global object.

## Module augmentation

Adding to someone else's types without forking them — the main legitimate use of declaration merging.

```typescript-snippet
// Adding a property to Express's Request type
import "express"

declare module "express-serve-static-core" {
  interface Request {
    user?: { id: number; name: string }
  }
}
```

The interface must already exist and be declared with `interface`; you cannot augment a `type`.

## `import()` types

You can reference a type from another module inline, without a top-level import — useful in `.d.ts` files and in JSDoc.

```typescript
export type User = { id: number; name: string }

// Elsewhere, inline:
type Handler = (u: import("./main.js").User) => void

const h: Handler = (u) => console.log(u.name)
h({ id: 1, name: "Ada" })
```

**Reference:** [Modules](https://www.typescriptlang.org/docs/handbook/2/modules.html) and [Declaration Files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html).
