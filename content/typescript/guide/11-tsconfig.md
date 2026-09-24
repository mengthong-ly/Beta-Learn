---
title: tsconfig & strictness
section: Guide Book
summary: What `strict` actually turns on, the flags worth adding beyond it, and how `target`, `lib` and `module` decide what your code becomes.
---
`tsconfig.json` is the compiler's input. Almost every "TypeScript is behaving strangely" question is a flag question.

## A reasonable baseline

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023", "DOM"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",

    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true,

    "noEmitOnError": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

## What `strict: true` turns on

One flag, eight behaviours. Each can be toggled individually, which is how you migrate a large codebase gradually.

| Flag | Effect |
| --- | --- |
| `noImplicitAny` | a parameter or variable with no inferable type is an error, not `any` |
| `strictNullChecks` | `null` and `undefined` are separate types you must handle |
| `strictFunctionTypes` | function-type *properties* are checked contravariantly |
| `strictBindCallApply` | `bind`, `call` and `apply` check their arguments |
| `strictPropertyInitialization` | a class field must be assigned in the constructor |
| `noImplicitThis` | `this` with an unknown type is an error |
| `useUnknownInCatchVariables` | a `catch` variable is `unknown`, not `any` |
| `alwaysStrict` | emit `"use strict"` and parse in strict mode |

`strictNullChecks` is the one that matters most:

```typescript
function find(names: string[], q: string): string | undefined {
  return names.find((n) => n === q)
}

const name = find(["Ada"], "Grace")

console.log(name?.toUpperCase() ?? "not found")
```

```typescript
function find(names: string[], q: string): string | undefined {
  return names.find((n) => n === q)
}

const name = find(["Ada"], "Grace")
console.log(name.toUpperCase()) // error! 'name' is possibly 'undefined'.
```

`strictPropertyInitialization` catches the class field you forgot:

```typescript
class User {
  name: string       // error! Property 'name' has no initializer and is not definitely assigned in the constructor.
}
```

Three legitimate answers: initialise it, make it optional, or use `!` to assert it is set elsewhere.

```typescript
class User {
  name = "anonymous"       // initialised
  email?: string           // optional
  id!: number              // definite assignment: "trust me, a framework sets this"

  constructor() {
    this.id = 1
  }
}

const u = new User()
console.log(u.name, u.email ?? "(none)", u.id)
```

## Flags worth adding beyond `strict`

### `noUncheckedIndexedAccess`

The highest-value non-default flag. Without it, indexing lies.

```typescript
const nums = [1, 2, 3]
const maybe = nums[99]        // typed number — actually undefined

console.log(maybe)            // undefined
```

With the flag on, `nums[99]` is `number | undefined` and the compiler makes you handle it — with a check, a `?.`, or an explicit `!` when you genuinely know better.

```typescript
const nums = [1, 2, 3]

const first = nums[0]
if (first !== undefined) console.log(first.toFixed(1))

console.log(nums.at(-1)?.toFixed(1))     // .at() is already typed correctly
console.log(nums[0]!.toFixed(1))         // explicit "I know this exists"
```

### `verbatimModuleSyntax`

Emits imports exactly as written, so `import type` becomes mandatory for type-only imports. Removes a whole class of bundler surprises.

### `exactOptionalPropertyTypes`

Separates "absent" from "present and `undefined`" — see the [Objects](/typescript/guide/objects-interfaces) chapter.

### `noImplicitOverride`

Makes `override` mandatory, so a renamed base method breaks its subclasses loudly.

> 💡 **Tip:** On a new project turn all of these on from day one — the cost is near zero. On an existing one, add them one at a time with a dedicated commit each; `noUncheckedIndexedAccess` in particular can produce hundreds of findings, and they are worth reading rather than silencing.

## `target` and `lib`

`target` decides what JavaScript is emitted — how much gets down-levelled. `lib` decides what the checker believes exists.

```typescript
// Available because lib includes a recent ES version:
console.log([1, 2, 3].at(-1))
console.log([[1, 2], [3]].flat())
console.log(Object.hasOwn({ a: 1 }, "a"))
console.log("abc".replaceAll("b", "-"))
console.log([3, 1, 2].toSorted())        // non-mutating copy
```

> 🔍 **Behind the scenes: `target` does not polyfill**
>
> Down-levelling rewrites *syntax* — `async`/`await`, classes, optional chaining. It never adds *library* functions. Set `target: "ES5"` and `Array.prototype.at` still compiles, still type-checks, and still throws `at is not a function` on a runtime that lacks it. Syntax is the compiler's job; missing methods are a polyfill's job. Setting `lib` to match your real runtime is what makes the compiler catch this.

## `module` and `moduleResolution`

| Setting | Use for |
| --- | --- |
| `NodeNext` | Node, respecting `package.json` `"type"` and `exports` |
| `Preserve` / `ESNext` + `Bundler` | Vite, esbuild, webpack — the bundler resolves |
| `CommonJS` | older Node and tooling |

Mismatches here produce the classic errors: "Cannot find module", "may only be default-imported using the esModuleInterop flag", and "Relative import paths need explicit file extensions".

## `include`, `exclude` and project references

```json
{
  "include": ["src/**/*"],
  "exclude": ["**/*.test.ts"],
  "compilerOptions": { "outDir": "dist", "rootDir": "src" }
}
```

`exclude` only filters `include`; it never stops a file being pulled in by an `import`. To genuinely keep a file out of a build, do not import it.

## `skipLibCheck`

Skips type-checking inside `.d.ts` files. Almost everyone turns it on: it cuts build time substantially, and errors in a dependency's declarations are not errors you can fix.

## `@ts-` comments

Escape hatches for a single line. Each one is a small debt.

```typescript
// @ts-expect-error — the line below IS an error, and this comment asserts that
const n: number = "not a number"

console.log(n)
```

Prefer `@ts-expect-error` to `@ts-ignore`: if the error is ever fixed, `@ts-expect-error` itself becomes an error, so the suppression cannot outlive the problem. `@ts-ignore` stays silent forever.

**Reference:** [tsconfig reference](https://www.typescriptlang.org/tsconfig) on typescriptlang.org.
