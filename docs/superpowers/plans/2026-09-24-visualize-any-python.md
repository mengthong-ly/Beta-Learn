# Visualize Any Python Code Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Visualize tab in the Python lesson workspace that records the learner's own run and replays it, one semantic operation per step, in the isometric visualizer, with the matching line lit in the editor.

**Architecture:** A `sys.settrace` tracer in `public/inspect.py` records a snapshot per line in the Pyodide worker; a pure adapter (`lib/viz/trace-events.ts`) turns each change between snapshots into one `VizEvent`; the existing pipeline (`program.ts → scene.ts → beat.ts → layout.ts → components/viz`) renders them through a `VizPlayer` shared with `/visualize`. The event model grows locals, aliasing (`ref.set`), `var.del`, `error` and value cards.

**Tech Stack:** Pyodide 314 (CPython 3.14) in an unbundled module worker, TypeScript 5, React 19.2, Next.js 16.3, @xyflow/react 12, motion 13, node:test.

**Spec:** `docs/superpowers/specs/2026-09-24-step-visualizer-design.md`

## Global Constraints

- Keep `public/python.worker.js` a plain module worker (Turbopack bundles workers as classic scripts; Pyodide 314 rejects those).
- Files under `lib/viz/` that `npm test` imports use relative imports **with** the `.ts` extension and `import type` for types (Node strips types; no enums).
- Caps: 500 snapshots per trace, 50 items per list, strings and reprs cut to 80 characters, 12 variables and 6 lists drawn.
- 10 s timeout starting at the `running` phase, same message as Run: `Stopped after 10s: is there an infinite loop?`.
- The trace never touches the Output tab's `RunState`, never runs lesson `check` blocks, never writes history or progress.
- Format new/changed TS/TSX with the repo's prettier (`npx prettier --write <files>`); `npm run lint`, `npm run typecheck`, `npm test` must pass after every task.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`. Never stage `app/[course]/guide/[chapter]/page.tsx` or `scripts/.php-probe.mjs` (someone else's work in progress).

## Review Focus

- A learner's `except Exception:` around an infinite loop: the cap must still end the trace (Task 4 test "cap survives except Exception").
- A list passed into a function and mutated there: the change must land in the caller's list, not a copy (Task 3 "call with an aliased list", Task 4 `alias_param`).
- Two different functions on the stack at once: frames must sit on their own machines and flights must land on them (Task 1 "frames are placed per machine", Task 2 test).
- A change the event model can't express (a list only reachable from a caller's frame, say) must be skipped, never crash the whole tab (Task 3 "unexpressible change is skipped").
- Output without a trailing newline (`print("a", end="")`) must still appear as a print step (Task 3 "prints").

---

### Task 1: Event model — locals, aliasing, value cards, del, errors, per-machine frames

**Files:**
- Modify: `lib/viz/events.ts`
- Modify: `lib/viz/program.ts`
- Modify: `lib/viz/scene.ts`
- Modify: `lib/viz/beat.ts`
- Test: `lib/viz/viz.test.ts` (append)

**Interfaces:**
- Produces (events.ts): `type Opaque = { repr: string; type: string }`; `type Val = number | string | boolean | null | Opaque`; `type Arg = Val | { alias: string }`; `isAlias(a: Arg): a is { alias: string }`; `argLabel(name: string, a: Arg): string`; new `VizEvent`s `{ type: "ref.set"; name; to }`, `{ type: "var.del"; name }`, `{ type: "error"; text }`; `call.args: [string, Arg][]`.
- Produces (program.ts): `Frame = { fn; args: [string, Arg][]; locals: Record<string, Binding>; got?: Val }`; `Program.error?: string`; `resolve(p, name): { binding?: Binding; frame?: number }`; `machineSlot(frames: Frame[], i: number): number`; `listId(p, name)` now resolves locals first.
- Produces (beat.ts): unchanged exports; flight anchors for frames use `machineSlot`.

- [ ] **Step 1: Write the failing tests** — add `formatVal` to the file's `./events.ts` import (make it `import { formatVal, type Step, type VizEvent } from "./events.ts"`) and `machineSlot, resolve` to its `./program.ts` import, then append:

```ts

test("inside a call, assignments are locals; after it, globals", () => {
  const s = steps(
    { type: "call", fn: "f", args: [["n", 2]] },
    { type: "var.set", name: "total", value: 5 },
    { type: "return", fn: "f", value: 5 },
    { type: "var.set", name: "r", value: 5 }
  )
  const inside = replay(s, 1)
  assert.deepEqual(inside.frames[0].locals, { n: { val: 2 }, total: { val: 5 } })
  assert.equal(inside.globals.total, undefined)
  const after = replay(s, 3)
  assert.deepEqual(after.globals, { r: { val: 5 } })
})

test("a call with an aliased list mutates the caller's list", () => {
  const p = replay(
    steps(
      { type: "array.create", name: "data", values: [1, 2] },
      { type: "call", fn: "grow", args: [["nums", { alias: "data" }]] },
      { type: "array.insert", name: "nums", index: 2, value: 3 }
    ),
    2
  )
  assert.deepEqual(p.lists.L1, [1, 2, 3])
  assert.deepEqual(resolve(p, "nums").binding, { ref: "L1" })
  assert.equal(resolve(p, "nums").frame, 0)
})

test("ref.set makes two names share one list; var.del removes a name", () => {
  const p = replay(
    steps(
      { type: "array.create", name: "a", values: [1] },
      { type: "ref.set", name: "b", to: "a" },
      { type: "array.insert", name: "b", index: 1, value: 2 },
      { type: "var.set", name: "x", value: 1 },
      { type: "var.del", name: "x" }
    ),
    4
  )
  assert.deepEqual(p.globals.b, { ref: "L1" })
  assert.deepEqual(p.lists.L1, [1, 2])
  assert.equal(p.globals.x, undefined)
  assert.throws(() => apply(p, { type: "ref.set", name: "c", to: "nope" }))
})

test("frames are placed per machine, so two functions don't collide", () => {
  const s = steps(
    { type: "call", fn: "main", args: [] },
    { type: "call", fn: "helper", args: [["n", 1]] },
    { type: "return", fn: "helper", value: 2 }
  )
  assert.equal(machineSlot(replay(s, 1).frames, 1), 0)
  assert.deepEqual(frameAt(s, 1).beat.flights[0], { from: "fn:main:frame:0", to: "fn:helper:frame:0", label: "1" })
  assert.deepEqual(frameAt(s, 2).beat.flights[0], { from: "fn:helper:frame:0", to: "fn:main:frame:0", label: "2" })
})

test("value cards format as their repr; errors are recorded", () => {
  assert.equal(formatVal({ repr: "{'a': 1}", type: "dict" }), "{'a': 1}")
  const p = replay(steps({ type: "error", text: "IndexError: list index out of range" }), 0)
  assert.equal(p.error, "IndexError: list index out of range")
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm test 2>&1 | grep -E "^ℹ (pass|fail)|✖"`
Expected: FAIL (e.g. `machineSlot` / `resolve` not exported, `locals` undefined).

- [ ] **Step 3: Implement `events.ts`** — replace the `Val` line and the `call` event, add the new events and helpers:

```ts
/** A value drawn as a card: anything the visualizer doesn't animate (dict, set, tuple, object, nan). */
export type Opaque = { repr: string; type: string }

export type Val = number | string | boolean | null | Opaque

/** A call argument: a value, or "the same list as the caller's variable `alias`". */
export type Arg = Val | { alias: string }
```

In the `VizEvent` union, change the `call` member to `| { type: "call"; fn: string; args: [string, Arg][] }` and add, after `print`:

```ts
  /** bind name to the list another variable already refers to (b = a) */
  | { type: "ref.set"; name: string; to: string }
  | { type: "var.del"; name: string }
  /** the program stopped with an exception; text is the cleaned traceback */
  | { type: "error"; text: string }
```

Change `formatVal` and add the two helpers below it:

```ts
export function formatVal(v: Val): string {
  if (v === null) return "None"
  if (v === true) return "True"
  if (v === false) return "False"
  if (typeof v === "object") return v.repr
  if (typeof v === "string") return `'${v}'`
  return String(v)
}

export const isAlias = (a: Arg): a is { alias: string } =>
  typeof a === "object" && a !== null && "alias" in a

/** `n=3`, or `nums → data` for a list shared with the caller. */
export const argLabel = (name: string, a: Arg) =>
  isAlias(a) ? `${name} → ${a.alias}` : `${name}=${formatVal(a)}`
```

- [ ] **Step 4: Implement `program.ts`**

Change the imports and types:

```ts
import { isAlias, type Arg, type PipelineStage, type Step, type Val, type VizEvent } from "./events.ts"

export type Frame = {
  fn: string
  args: [string, Arg][]
  /** the call's own variables (its parameters first) */
  locals: Record<string, Binding>
  /** last value a callee returned into it */
  got?: Val
}
```

Add `error?: string` to `Program`. Replace `listId` with:

```ts
/** Where a name lives right now: the running call's variables, else globals (Python's local-first lookup, simplified). */
export function resolve(p: Program, name: string): { binding?: Binding; frame?: number } {
  const top = p.frames.length - 1
  if (top >= 0 && name in p.frames[top].locals) return { binding: p.frames[top].locals[name], frame: top }
  return { binding: p.globals[name] }
}

export function listId(p: Program, name: string): string {
  const b = resolve(p, name).binding
  if (!b || !("ref" in b)) throw new Error(`${name} is not a list`)
  return b.ref
}

/** Frame i's position on its own function's machine: how many earlier frames run the same function. */
export const machineSlot = (frames: Frame[], i: number) =>
  frames.slice(0, i).filter((f) => f.fn === frames[i].fn).length
```

In `apply`, replace the `set` helper with `bind` and use it everywhere a name is (re)bound:

```ts
  // Assignments land in the running call's frame, else in globals.
  const bind = (name: string, b: Binding | undefined): Program => {
    const top = p.frames.length - 1
    if (top < 0) {
      const globals = { ...p.globals }
      if (b) globals[name] = b
      else delete globals[name]
      return { ...p, globals }
    }
    const frames = [...p.frames]
    const locals = { ...frames[top].locals }
    if (b) locals[name] = b
    else delete locals[name]
    frames[top] = { ...frames[top], locals }
    return { ...p, frames }
  }
```

Cases that change (keep the rest as they are):

```ts
    case "var.set":
      return bind(ev.name, { val: ev.value })
    case "array.create": {
      const id = `L${Object.keys(p.lists).length + 1}`
      return { ...bind(ev.name, { ref: id }), lists: { ...p.lists, [id]: [...ev.values] } }
    }
    case "array.remove": {
      const id = listId(p, ev.name)
      const items = [...p.lists[id]]
      checkIndex(items, ev.index)
      const [gone] = items.splice(ev.index, 1)
      const q = ev.into ? bind(ev.into, { val: gone }) : p
      return { ...q, lists: { ...p.lists, [id]: items } }
    }
    case "array.access": {
      const id = listId(p, ev.name)
      checkIndex(p.lists[id], ev.index)
      return ev.into ? bind(ev.into, { val: p.lists[id][ev.index] }) : p
    }
    case "loop.iter": {
      const id = listId(p, ev.array)
      checkIndex(p.lists[id], ev.index)
      return { ...bind(ev.variable, { val: p.lists[id][ev.index] }), loop: { list: id, index: ev.index } }
    }
    case "call": {
      const locals: Record<string, Binding> = {}
      for (const [name, a] of ev.args) locals[name] = isAlias(a) ? { ref: listId(p, a.alias) } : { val: a }
      return { ...p, frames: [...p.frames, { fn: ev.fn, args: ev.args, locals }] }
    }
    case "ref.set":
      return bind(ev.name, { ref: listId(p, ev.to) })
    case "var.del":
      if (!resolve(p, ev.name).binding) throw new Error(`${ev.name} is not defined`)
      return bind(ev.name, undefined)
    case "error":
      return { ...p, error: ev.text }
```

- [ ] **Step 5: Implement `scene.ts`** — add three cases to `reduceScene`'s switch:

```ts
    case "ref.set":
      return { ...s, focus: { kind: "var", name: ev.name } }
    case "var.del":
      return { ...s, focus: null }
    case "error":
      return s
```

- [ ] **Step 6: Implement `beat.ts`**

Imports: `import { argLabel, formatVal, isAlias, type Step, type VizEvent } from "./events.ts"` (drop unused ones if lint complains) and `import { apply, EMPTY, listId, machineSlot, resolve, type Program } from "./program.ts"`.

Add below `QUIET`:

```ts
/** Is `name` a global right now (not shadowed by the running call's variables)? */
const isGlobal = (p: Program, name: string) => resolve(p, name).frame === undefined

/** Where a variable is drawn: its slot in the global scope, or its call's frame. */
function varAnchor(p: Program, name: string): string {
  const { frame } = resolve(p, name)
  return frame === undefined ? `var:${name}` : `fn:${p.frames[frame].fn}:frame:${machineSlot(p.frames, frame)}`
}

const frameAnchor = (p: Program, i: number) => `fn:${p.frames[i].fn}:frame:${machineSlot(p.frames, i)}`
```

In `nodeOf`, the `var` case becomes:

```ts
    case "var": {
      const { binding, frame } = resolve(p, f.name)
      if (frame !== undefined) return `fn:${p.frames[frame].fn}`
      return binding && "ref" in binding ? `list:${binding.ref}` : "scope"
    }
```

In `anchorOf`: `case "var": return varAnchor(p, f.name)` and `case "fn": return f.depth === 0 ? \`fn:${f.fn}:out\` : frameAnchor(p, f.depth - 1)`.

In `beatFor`, replace these cases:

```ts
    case "var.set": {
      if (isGlobal(next.p, ev.name)) beat.changed.push(`var:${ev.name}`)
      const f = prev.s.focus
      if (f?.kind === "fn" && f.depth === 0)
        beat.flights.push({ from: `fn:${f.fn}:out`, to: varAnchor(next.p, ev.name), label: formatVal(ev.value) })
      if (from && from !== "scope") beat.particles.push(`${from}->scope`)
      break
    }
    case "ref.set":
      if (isGlobal(next.p, ev.name)) beat.changed.push(`var:${ev.name}`)
      break
    case "array.access":
    case "array.remove":
      if (ev.into) {
        const id = listId(prev.p, ev.name)
        if (isGlobal(next.p, ev.into)) beat.changed.push(`var:${ev.into}`)
        beat.flights.push({ from: el(id, ev.index), to: varAnchor(next.p, ev.into), label: formatVal(prev.p.lists[id][ev.index]) })
      }
      break
    case "loop.iter": {
      const id = listId(prev.p, ev.array)
      if (isGlobal(next.p, ev.variable)) beat.changed.push(`var:${ev.variable}`)
      beat.flights.push({ from: el(id, ev.index), to: varAnchor(next.p, ev.variable), label: formatVal(prev.p.lists[id][ev.index]) })
      break
    }
    case "call": {
      const depth = next.p.frames.length
      beat.flights.push({
        from: depth > 1 ? frameAnchor(prev.p, depth - 2) : "scope",
        to: frameAnchor(next.p, depth - 1),
        label: ev.args.map(([, a]) => (isAlias(a) ? a.alias : formatVal(a))).join(", "),
      })
      if (depth === 1) beat.particles.push(`scope->fn:${ev.fn}`)
      break
    }
    case "return": {
      const depth = prev.p.frames.length
      beat.flights.push({
        from: frameAnchor(prev.p, depth - 1),
        to: depth > 1 ? frameAnchor(prev.p, depth - 2) : `fn:${ev.fn}:out`,
        label: formatVal(ev.value),
      })
      break
    }
```

(`argLabel` is used by Task 2/3; if lint flags it unused here, import it only where used.)

- [ ] **Step 7: Run tests**

Run: `npm test 2>&1 | grep -E "^ℹ (pass|fail)|✖"` — Expected: all pass (the 12 demos still match real Python).
Run: `npx tsc --noEmit` — Expected: errors only in `lib/viz/layout.ts` where `fr.args` is formatted with `formatVal(v)` (`v` is now `Arg`). Fix that one line now: `fr.args.map(([k, v]) => argLabel(k, v)).join(", ")` with `import { argLabel, … } from "./events.ts"`. Re-run until clean.

- [ ] **Step 8: Commit**

```bash
npx prettier --write lib/viz/events.ts lib/viz/program.ts lib/viz/scene.ts lib/viz/beat.ts lib/viz/layout.ts lib/viz/viz.test.ts
git add lib/viz/events.ts lib/viz/program.ts lib/viz/scene.ts lib/viz/beat.ts lib/viz/layout.ts lib/viz/viz.test.ts
git commit -m "Grow the visualizer's event model: locals, aliasing, del, errors, value cards

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Layout — steps in, per-machine stacks, binding edges, frame locals, caps

**Files:**
- Modify: `lib/viz/layout.ts`
- Modify: `components/viz/playground.tsx:74` (`layoutOf(demo)` → `layoutOf(demo.steps)`)
- Modify: `components/viz/iso-block.tsx` (`IsoBlock` truncates long values)
- Test: `lib/viz/viz.test.ts` (append)

**Interfaces:**
- Consumes: Task 1's `resolve`, `machineSlot`, `argLabel`, `Frame.locals`.
- Produces: `layoutOf(steps: Step[])` (was `layoutOf(demo)`); `Layout.hidden: { vars: number; lists: number }`; `EdgeSpec.bind?: { name: string; list: string }`.

- [ ] **Step 1: Write the failing tests** — add `import { layoutOf, sceneAt } from "./layout.ts"` to the imports of `lib/viz/viz.test.ts`, then append:

```ts

test("layout: two functions get their own machines and flights land on them", () => {
  const L = layoutOf(
    steps(
      { type: "call", fn: "main", args: [] },
      { type: "call", fn: "helper", args: [["n", 1]] }
    )
  )
  const { nodes, flights } = sceneAt(L, 2, true)
  const helper = nodes.find((n) => n.id === "fn:helper")!
  assert.equal((helper.data as { frames: unknown[] }).frames.length, 1)
  assert.equal(flights.length, 1)
})

test("layout: aliasing draws one reference per name, only while bound", () => {
  const L = layoutOf(
    steps(
      { type: "array.create", name: "a", values: [1] },
      { type: "ref.set", name: "b", to: "a" },
      { type: "var.set", name: "b", value: 0 }
    )
  )
  const visible = (i: number) => sceneAt(L, i, true).edges.filter((e) => e.id.startsWith("ref:") && !e.data!.hidden).map((e) => e.id)
  assert.deepEqual(visible(2), ["ref:a:L1", "ref:b:L1"])
  assert.deepEqual(visible(3), ["ref:a:L1"])
})

test("layout: frame labels show locals; a big program is capped", () => {
  const L = layoutOf(
    steps(
      { type: "array.create", name: "data", values: [1] },
      { type: "call", fn: "f", args: [["nums", { alias: "data" }]] },
      { type: "var.set", name: "t", value: 3 }
    )
  )
  const fn = sceneAt(L, 3, true).nodes.find((n) => n.id === "fn:f")!
  assert.equal((fn.data as { frames: { label: string }[] }).frames[0].label, "f(nums → data) · t=3")

  const many = layoutOf(steps(...Array.from({ length: 15 }, (_, i): VizEvent => ({ type: "var.set", name: `v${i}`, value: i }))))
  assert.deepEqual(many.hidden, { vars: 3, lists: 0 })
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm test 2>&1 | grep -E "^ℹ (pass|fail)|✖"` — Expected: FAIL (`layoutOf` takes a Demo; no `hidden`).

- [ ] **Step 3: Implement in `lib/viz/layout.ts`**

Imports: `import { argLabel, formatVal, type PipelineStage, type Step, type Val } from "./events.ts"` and `import type { Binding, Frame, Program } from "./program.ts"`.

Add constants near `STAGE_TITLES`: `const MAX_VARS = 12` and `const MAX_LISTS = 6`.

Add `bind?: { name: string; list: string }` to `EdgeSpec`, and let `edge(...)` take it as an optional 8th parameter that it stores on the spec.

Change the signature to `export function layoutOf(steps: Step[])`; inside, use `steps` wherever `demo.steps` was, and remove `demo` from the returned object.

In the cast loop:

```ts
    for (const [id, items] of Object.entries(p.lists)) {
      const holder = (b: Binding) => "ref" in b && b.ref === id
      const name =
        Object.keys(p.globals).find((n) => holder(p.globals[n])) ??
        p.frames.flatMap((f) => Object.entries(f.locals)).find(([, b]) => holder(b))?.[0] ??
        id
      const known = lists.get(id)
      lists.set(id, { name: known?.name ?? name, capacity: Math.max(known?.capacity ?? 0, items.length), loop: known?.loop || ev.type === "loop.iter" })
    }
    for (const [name, b] of Object.entries(p.globals)) if ("ref" in b) bindings.add(`${name}:${b.ref}`)
    if (ev.type === "call")
      fns.set(ev.fn, Math.max(fns.get(ev.fn) ?? 0, p.frames.filter((f) => f.fn === ev.fn).length))
```

with `const bindings = new Set<string>()` declared next to `scopeNames`.

After the cast loop, apply the caps before building canvases:

```ts
  const hidden = { vars: Math.max(0, scopeNames.length - MAX_VARS), lists: Math.max(0, lists.size - MAX_LISTS) }
  scopeNames.splice(MAX_VARS)
  const shownLists = [...lists.keys()].slice(0, MAX_LISTS)
```

Build `listCanvas` from `shownLists` only: `new Map(shownLists.map((id) => [id, lane(lists.get(id)!.capacity, lists.get(id)!.name)]))`.

Replace the reference-edge loop with one edge per (name, list) binding, only for things that are drawn:

```ts
  for (const key of bindings) {
    const [name, list] = key.split(":")
    if (scopeNames.includes(name) && shownLists.includes(list))
      edge("scope", `slot:${scopeNames.indexOf(name)}`, `list:${list}`, "in", "curve", "reference", `ref:${name}:${list}`, { name, list })
  }
```

Return `hidden` alongside the rest.

In `dataFor`'s `fn` case, the label becomes `label: frameLabel(fr, p)`, with this function added above `dataFor`:

```ts
/** `factorial(n=3) · total=6`; a list shows the global name that holds it (`nums → data`). */
function frameLabel(fr: Frame, p: Program): string {
  const show = (k: string, b: Binding) => {
    if ("val" in b) return argLabel(k, b.val)
    const g = Object.keys(p.globals).find((n) => {
      const x = p.globals[n]
      return "ref" in x && x.ref === b.ref
    })
    return `${k} → ${g ?? "a list"}`
  }
  const params = fr.args.map(([k]) => k)
  const args = params.filter((k) => k in fr.locals).map((k) => show(k, fr.locals[k]))
  const rest = Object.entries(fr.locals).filter(([k]) => !params.includes(k)).map(([k, b]) => show(k, b))
  return `${fr.fn}(${args.join(", ")})${rest.length ? ` · ${rest.join(", ")}` : ""}`
}
```

In `sceneAt`'s edge map, extend `hidden`:

```ts
    const bound = (b?: { name: string; list: string }) => {
      if (!b) return true
      const x = f.program.globals[b.name]
      return !!x && "ref" in x && x.ref === b.list
    }
```

and `hidden: !exists(e.source) || !exists(e.target) || (transient && !pulsing) || !bound(e.bind)`.

In `components/viz/playground.tsx`, change `layoutOf(demo)` to `layoutOf(demo.steps)`.

In `components/viz/iso-block.tsx`'s `IsoBlock`, keep long values from overflowing a block top:

```ts
  const full = value === undefined ? "" : formatVal(value)
  const text = full.length > 8 ? `${full.slice(0, 7)}…` : full
```

- [ ] **Step 4: Run tests and typecheck**

Run: `npm test 2>&1 | grep -E "^ℹ (pass|fail)|✖"` — Expected: PASS.
Run: `npx tsc --noEmit && npx eslint lib/viz components/viz` — Expected: clean.

- [ ] **Step 5: Commit**

```bash
npx prettier --write lib/viz/layout.ts lib/viz/viz.test.ts components/viz/playground.tsx components/viz/iso-block.tsx
git add lib/viz/layout.ts lib/viz/viz.test.ts components/viz/playground.tsx components/viz/iso-block.tsx
git commit -m "Lay out any program: per-machine stacks, one reference per binding, locals, caps

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Adapter — tracer snapshots to steps

**Files:**
- Create: `lib/viz/trace-events.ts`
- Test: `lib/viz/trace-events.test.ts`

**Interfaces:**
- Consumes: Task 1's events and `apply`, `EMPTY`, `listId`, `resolve`.
- Produces: `type TValue`, `type Snap`, `type Trace = { snaps: Snap[]; truncated: boolean; stdout: string }`; `listOps(name, a: Val[], b: Val[]): VizEvent[]`; `toSteps(trace: Trace, error?: { text: string; line?: number }): Step[]`; `noteFor(ev: VizEvent, before: Program): string`.

- [ ] **Step 1: Write the failing tests** — create `lib/viz/trace-events.test.ts`:

```ts
import assert from "node:assert/strict"
import { test } from "node:test"

import type { Val, VizEvent } from "./events.ts"
import { replay } from "./program.ts"
import { listOps, toSteps, type Snap, type TValue } from "./trace-events.ts"

const mod = (...vars: [string, TValue][]) => ({ fn: "<module>", vars })
const L = (...items: Val[]) => ({ items, more: 0 })
const S = (line: number, frames: Snap["frames"], lists: Snap["lists"] = {}, out = 0, extra: Partial<Snap> = {}): Snap => ({
  line,
  event: "line",
  frames,
  lists,
  out,
  ...extra,
})
const run = (snaps: Snap[], stdout = "", error?: { text: string; line?: number }) => toSteps({ snaps, truncated: false, stdout }, error)
const events = (s: { event: VizEvent }[]) => s.map((x) => x.event)
const a = (id = "x"): TValue => ({ ref: id })

test("listOps: append, insert, pop, set, swap", () => {
  assert.deepEqual(listOps("a", [1, 2], [1, 2, 3]), [{ type: "array.insert", name: "a", index: 2, value: 3 }])
  assert.deepEqual(listOps("a", [1, 2, 3], [0, 1, 2, 3]), [{ type: "array.insert", name: "a", index: 0, value: 0 }])
  assert.deepEqual(listOps("a", [1, 2, 3], [1, 3]), [{ type: "array.remove", name: "a", index: 1 }])
  assert.deepEqual(listOps("a", [1, 2, 3], [1, 9, 3]), [{ type: "array.set", name: "a", index: 1, value: 9 }])
  assert.deepEqual(listOps("a", [1, 2, 3], [3, 2, 1]), [
    { type: "array.set", name: "a", index: 0, value: 3 },
    { type: "array.set", name: "a", index: 2, value: 1 },
  ])
})

test("creating and appending: one step each, on the line that ran", () => {
  const s = run([S(1, [mod()]), S(2, [mod(["a", a()])], { x: L(3, 1) }), S(3, [mod(["a", a()])], { x: L(3, 1, 4) })])
  assert.deepEqual(events(s), [
    { type: "array.create", name: "a", values: [3, 1] },
    { type: "array.insert", name: "a", index: 2, value: 4 },
  ])
  assert.deepEqual(s.map((x) => x.line), [1, 2])
  assert.ok(s[1].note.includes("added to the end"))
})

test("x = a.pop(1) is one step: the removed value lands in x", () => {
  const s = run([
    S(1, [mod()]),
    S(2, [mod(["a", a()])], { x: L(1, 2, 3) }),
    S(3, [mod(["a", a()], ["y", 2])], { x: L(1, 3) }),
  ])
  assert.deepEqual(events(s).at(-1), { type: "array.remove", name: "a", index: 1, into: "y" })
  assert.equal(s.length, 2)
})

test("b = a is aliasing; a change through b is a change to a's list", () => {
  const s = run([
    S(1, [mod()]),
    S(2, [mod(["a", a()])], { x: L(1) }),
    S(3, [mod(["a", a()], ["b", a()])], { x: L(1) }),
    S(4, [mod(["a", a()], ["b", a()])], { x: L(1, 2) }),
  ])
  assert.deepEqual(events(s)[1], { type: "ref.set", name: "b", to: "a" })
  const p = replay(s, s.length - 1)
  assert.deepEqual(p.lists.L1, [1, 2])
})

test("a call with an aliased list, locals, return and the caller's assignment", () => {
  const f = (...vars: [string, TValue][]) => ({ fn: "grow", vars })
  const s = run([
    S(5, [mod()]),
    S(6, [mod(["data", a()])], { x: L(1, 2) }),
    S(1, [mod(["data", a()]), f(["nums", a()])], { x: L(1, 2) }, 0, { event: "call" }),
    S(2, [mod(["data", a()]), f(["nums", a()])], { x: L(1, 2) }),
    S(3, [mod(["data", a()]), f(["nums", a()])], { x: L(1, 2, 3) }, 0, { event: "return", ret: 3 }),
    S(7, [mod(["data", a()], ["r", 3])], { x: L(1, 2, 3) }),
  ])
  assert.deepEqual(events(s), [
    { type: "array.create", name: "data", values: [1, 2] },
    { type: "call", fn: "grow", args: [["nums", { alias: "data" }]] },
    { type: "array.insert", name: "nums", index: 2, value: 3 },
    { type: "return", fn: "grow", value: 3 },
    { type: "var.set", name: "r", value: 3 },
  ])
  assert.deepEqual(s.map((x) => x.line), [5, 6, 2, 3, 6])
  const p = replay(s, s.length - 1)
  assert.deepEqual(p.lists.L1, [1, 2, 3])
  assert.deepEqual(p.globals.r, { val: 3 })
})

test("prints, including output without a trailing newline", () => {
  const s = run([S(1, [mod()]), S(2, [mod()], {}, 2), S(3, [mod()], {}, 3)], "a\nb")
  assert.deepEqual(events(s), [
    { type: "print", text: "a" },
    { type: "print", text: "b" },
  ])
})

test("del, and a final error step", () => {
  const s = run([S(1, [mod()]), S(2, [mod(["x", 1])]), S(3, [mod()])], "", { text: "NameError: name 'x' is not defined", line: 3 })
  assert.deepEqual(events(s), [
    { type: "var.set", name: "x", value: 1 },
    { type: "var.del", name: "x" },
    { type: "error", text: "NameError: name 'x' is not defined" },
  ])
  assert.equal(s.at(-1)!.line, 3)
})

test("an unexpressible change is skipped instead of breaking the replay", () => {
  // list y changes but no visible name holds it
  const s = run([S(1, [mod()], { y: L(1) }), S(2, [mod()], { y: L(1, 2) })])
  assert.deepEqual(s, [])
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm test 2>&1 | grep -E "^ℹ (pass|fail)|✖"` — Expected: FAIL (`Cannot find module './trace-events.ts'`).

- [ ] **Step 3: Implement** — create `lib/viz/trace-events.ts`:

```ts
// Real Python runs → VizEvents. The tracer (__trace__ in public/inspect.py) records a
// snapshot at every line; this turns each change between two snapshots into one event,
// so a learner's own code steps one semantic operation at a time, like the demos.

import { argLabel, formatVal, type Arg, type Step, type Val, type VizEvent } from "./events.ts"
import { apply, EMPTY, listId, type Program } from "./program.ts"

/** A traced value: plain values and cards as in events.ts, or a list by id(). */
export type TValue = Val | { ref: string }

export type Snap = {
  line: number
  event: "line" | "call" | "return" | "exception"
  /** outermost (<module>) first */
  frames: { fn: string; vars: [string, TValue][] }[]
  /** id(list) as hex → its items (nested lists arrive as cards) */
  lists: Record<string, { items: Val[]; more: number }>
  /** stdout characters written so far */
  out: number
  ret?: TValue
}

export type Trace = { snaps: Snap[]; truncated: boolean; stdout: string }

type Remove = Extract<VizEvent, { type: "array.remove" }>
type SetVar = Extract<VizEvent, { type: "var.set" }>

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const isRef = (v: unknown): v is { ref: string } => typeof v === "object" && v !== null && "ref" in v

/** A list the event model can't point at (a returned list, say) becomes a card. */
function asVal(v: TValue, s: Snap): Val {
  if (!isRef(v)) return v
  return { repr: `[${(s.lists[v.ref]?.items ?? []).map(formatVal).join(", ")}]`, type: "list" }
}

/** A name the code in frame d can use for list `id`: its own variables first, then globals it doesn't shadow. */
function holder(s: Snap, id: string, d: number): string | undefined {
  const own = s.frames[d]?.vars ?? []
  const hit = own.find(([, v]) => isRef(v) && v.ref === id)
  if (hit) return hit[0]
  if (d === 0) return undefined
  const names = new Set(own.map(([n]) => n))
  return s.frames[0].vars.find(([n, v]) => isRef(v) && v.ref === id && !names.has(n))?.[0]
}

/** The fewest insert/remove/set events that turn list a into list b (an LCS script, or in-place sets when that's no longer). */
export function listOps(name: string, a: Val[], b: Val[]): VizEvent[] {
  const n = a.length
  const m = b.length
  const eq = (i: number, j: number) => same(a[i], b[j])
  // ponytail: O(n·m) LCS per list per step, fine at the 50-item cap.
  const L = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--) L[i][j] = eq(i, j) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1])

  const ops: VizEvent[] = []
  let k = 0 // index in the list as the ops so far have left it
  let dels = 0
  let ins: Val[] = []
  const flush = () => {
    const sets = Math.min(dels, ins.length)
    for (let s = 0; s < sets; s++) ops.push({ type: "array.set", name, index: k++, value: ins[s] })
    for (let d = sets; d < dels; d++) ops.push({ type: "array.remove", name, index: k })
    for (const value of ins.slice(sets)) ops.push({ type: "array.insert", name, index: k++, value })
    dels = 0
    ins = []
  }
  for (let i = 0, j = 0; i < n || j < m; ) {
    if (i < n && j < m && eq(i, j)) {
      flush()
      i++
      j++
      k++
    } else if (j < m && (i === n || L[i][j + 1] >= L[i + 1][j])) ins.push(b[j++])
    else {
      dels++
      i++
    }
  }
  flush()
  // Same length and no more in-place changes than the script: it was an update (a[i] = x, a swap).
  if (n === m) {
    const sets = a.flatMap((v, i): VizEvent[] => (same(v, b[i]) ? [] : [{ type: "array.set", name, index: i, value: b[i] }]))
    if (sets.length <= ops.length) return sets
  }
  return ops
}

/** One or two plain sentences about an event, from the state just before it. */
export function noteFor(ev: VizEvent, p: Program): string {
  const items = (name: string) => {
    try {
      return p.lists[listId(p, name)]
    } catch {
      return []
    }
  }
  switch (ev.type) {
    case "var.set": {
      const scope = p.frames.length ? p.frames[p.frames.length - 1].locals : p.globals
      const old = scope[ev.name]
      return old && "val" in old
        ? `${ev.name} changes from ${formatVal(old.val)} to ${formatVal(ev.value)}.`
        : `A new name ${ev.name} appears, bound to ${formatVal(ev.value)}.`
    }
    case "array.create":
      return `A new list [${ev.values.map(formatVal).join(", ")}] is created, and ${ev.name} refers to it.`
    case "array.insert":
      return ev.index === items(ev.name).length
        ? `${formatVal(ev.value)} is added to the end of ${ev.name}, at index ${ev.index}.`
        : `${formatVal(ev.value)} is inserted at index ${ev.index} of ${ev.name}; the items after it shift right.`
    case "array.remove": {
      const gone = items(ev.name)[ev.index]
      const into = ev.into ? ` It goes into ${ev.into}.` : ""
      return `${gone === undefined ? "An item" : formatVal(gone)} is removed from index ${ev.index} of ${ev.name}; the items after it shift left.${into}`
    }
    case "array.set": {
      const old = items(ev.name)[ev.index]
      return `${ev.name}[${ev.index}] changes from ${old === undefined ? "?" : formatVal(old)} to ${formatVal(ev.value)}.`
    }
    case "ref.set":
      return `${ev.name} now refers to the same list as ${ev.to}: a change through either name changes both.`
    case "var.del":
      return `del removes the name ${ev.name}.`
    case "call":
      return `${ev.fn}(${ev.args.map(([k, a]) => argLabel(k, a)).join(", ")}) is called: a new frame opens for its variables.`
    case "return":
      return `${ev.fn} returns ${formatVal(ev.value)}, and its frame is removed.`
    case "print":
      return `print() writes ${JSON.stringify(ev.text)} to the output.`
    case "error":
      return "The program stopped with an error."
    default:
      return ""
  }
}

/** One step per change between consecutive snapshots, each tagged with the line that caused it. */
export function toSteps(trace: Trace, error?: { text: string; line?: number }): Step[] {
  const { snaps, stdout } = trace
  const steps: Step[] = []
  let p: Program = EMPTY
  // ponytail: a change the event model can't express is skipped rather than drawn wrong.
  const emit = (event: VizEvent, line: number) => {
    try {
      const next = apply(p, event)
      steps.push({ event, line, note: noteFor(event, p) })
      p = next
    } catch {
      /* skipped */
    }
  }

  let printed = 0
  const prints = (upTo: number, line: number, final = false) => {
    const end = final ? upTo : stdout.lastIndexOf("\n", upTo - 1) + 1
    if (end <= printed) return
    const text = stdout.slice(printed, end).replace(/\n$/, "")
    printed = end
    for (const t of text.split("\n")) emit({ type: "print", text: t }, line)
  }

  /** Changes inside frame d, which both snapshots share: list edits first, then names. */
  const changes = (a: Snap, b: Snap, d: number, line: number) => {
    const listEvents: VizEvent[] = []
    for (const [id, now] of Object.entries(b.lists)) {
      if (!a.lists[id]) continue
      const name = holder(a, id, d)
      if (!name) continue
      let cur: Val[]
      try {
        cur = p.lists[listId(p, name)]
      } catch {
        continue
      }
      listEvents.push(...listOps(name, cur, now.items))
    }

    const nameEvents: VizEvent[] = []
    const before = new Map(a.frames[d].vars)
    const after = b.frames[d].vars
    const known = new Map<string, string>() // list id → a name bound to it earlier in this step
    for (const [name, v] of after) {
      const old = before.get(name)
      if (isRef(v)) {
        if (isRef(old) && old.ref === v.ref) continue
        const other = known.get(v.ref) ?? holder(a, v.ref, d)
        nameEvents.push(other && other !== name ? { type: "ref.set", name, to: other } : { type: "array.create", name, values: b.lists[v.ref]?.items ?? [] })
        known.set(v.ref, name)
      } else if (old === undefined || isRef(old) || !same(old, v)) nameEvents.push({ type: "var.set", name, value: v })
    }
    for (const name of before.keys()) if (!after.some(([n]) => n === name)) nameEvents.push({ type: "var.del", name })

    // x = a.pop(i): one removal and one new value equal to it read as a single "pop into x".
    const rm = listEvents.filter((e): e is Remove => e.type === "array.remove")
    const sets = nameEvents.filter((e): e is SetVar => e.type === "var.set")
    if (rm.length === 1 && sets.length === 1) {
      let q = p
      let gone: Val | undefined
      try {
        for (const ev of listEvents) {
          if (ev === rm[0]) gone = q.lists[listId(q, rm[0].name)][rm[0].index]
          q = apply(q, ev)
        }
      } catch {
        gone = undefined
      }
      if (gone !== undefined && same(gone, sets[0].value)) {
        rm[0].into = sets[0].name
        nameEvents.splice(nameEvents.indexOf(sets[0]), 1)
      }
    }
    for (const ev of [...listEvents, ...nameEvents]) emit(ev, line)
  }

  const lastLine: number[] = [] // the latest line each frame depth was on
  snaps.forEach((b, k) => {
    const a = snaps[k - 1]
    if (a) {
      const la = a.frames.length
      const lb = b.frames.length
      const lineIn = (d: number) => lastLine[d] ?? a.line
      // 1. calls that ended, innermost first
      for (let d = la - 1; d >= lb; d--) {
        const value = d === la - 1 && a.event === "return" && a.ret !== undefined ? asVal(a.ret, a) : null
        emit({ type: "return", fn: a.frames[d].fn, value }, lineIn(d))
      }
      // 2. the frame both snapshots share
      const d = Math.min(la, lb) - 1
      if (d >= 0 && a.frames[d].fn === b.frames[d].fn) changes(a, b, d, lineIn(d))
      // 3. output written meanwhile
      prints(b.out, lineIn(la - 1))
      // 4. calls that started, outermost first
      for (let d = la; d < lb; d++) {
        const args = b.frames[d].vars.map(([n, v]): [string, Arg] => {
          if (!isRef(v)) return [n, v]
          const alias = holder(b, v.ref, d - 1)
          return [n, alias ? { alias } : asVal(v, b)]
        })
        emit({ type: "call", fn: b.frames[d].fn, args }, lineIn(d - 1))
      }
    }
    lastLine.length = b.frames.length
    lastLine[b.frames.length - 1] = b.line
  })
  prints(stdout.length, lastLine.at(-1) ?? 1, true)
  if (error) emit({ type: "error", text: error.text }, error.line ?? lastLine.at(-1) ?? 1)
  return steps
}
```

- [ ] **Step 4: Run tests**

Run: `npm test 2>&1 | grep -E "^ℹ (pass|fail)|✖"` — Expected: PASS. If "a call with an aliased list…" fails on lines, re-check that `lastLine` is truncated to `b.frames.length` *after* the pair is processed.

- [ ] **Step 5: Commit**

```bash
npx prettier --write lib/viz/trace-events.ts lib/viz/trace-events.test.ts
git add lib/viz/trace-events.ts lib/viz/trace-events.test.ts
git commit -m "Turn traced snapshots into visualizer steps, one change per step

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Tracer in Pyodide, with a real round-trip test

**Files:**
- Modify: `public/inspect.py` (append)
- Test: `lib/viz/trace-py.test.ts`

**Interfaces:**
- Consumes: Task 3's `toSteps`, `Trace`, `TValue`; `cleanTraceback` from `public/traceback.js`.
- Produces: Python `__trace__(ns, code) -> str` (JSON `{ snaps, truncated, stdout, error }`), plus helpers `_trace_value(v, lists)` and `_SKIP` used by the test.

- [ ] **Step 1: Write the failing test** — create `lib/viz/trace-py.test.ts`:

```ts
// The tracer in real Pyodide: trace a program, turn it into steps, replay the steps, and
// require the replay to leave exactly what Python left (variables and output).
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

import { cleanTraceback } from "../../public/traceback.js"
import { replay } from "./program.ts"
import { toSteps, type Snap, type TValue } from "./trace-events.ts"

const { loadPyodide } = await import("pyodide")
const py = await loadPyodide()
py.runPython(readFileSync(new URL("../../public/inspect.py", import.meta.url), "utf8"))

type Raw = { snaps: Snap[]; truncated: boolean; stdout: string; error: string | null }

function traceOf(code: string) {
  const ns = py.globals.get("dict")()
  ns.set("__name__", "__main__")
  const compiled = py.runPython(`compile(${JSON.stringify(code)}, "<exec>", "exec")`)
  const raw: Raw = JSON.parse(py.globals.get("__trace__")(ns, compiled))
  py.globals.set("__ns__", ns)
  const real = JSON.parse(
    py.runPython(
      "import json as _j\n_l = {}\n_v = {k: _trace_value(v, _l) for k, v in __ns__.items() if not k.startswith('__') and not isinstance(v, _SKIP)}\n_j.dumps({'vars': _v, 'lists': _l})"
    )
  ) as { vars: Record<string, TValue>; lists: Record<string, { items: unknown[] }> }
  compiled.destroy()
  ns.destroy()
  return { raw, real }
}

const PROGRAMS: Record<string, string> = {
  lists: "a = [3, 1]\na.append(4)\na.insert(0, 9)\nx = a.pop(1)\na[0] = 7\nb = a\nb.append(5)\ndel x\nprint(a)",
  swap: "a = [1, 2, 3]\na[0], a[2] = a[2], a[0]\nprint(a)",
  alias_param:
    "def grow(nums, k):\n    total = 0\n    for n in nums:\n        total += n * k\n    nums.append(total)\n    return total\n\ndata = [1, 2]\nr = grow(data, 3)\nprint(r, data)",
  two_functions: "def inc(n):\n    return n + 1\n\ndef twice(n):\n    return inc(n) * 2\n\nprint(twice(3))",
  recursion: "def fact(n):\n    if n == 1:\n        return 1\n    return n * fact(n - 1)\n\nresult = fact(4)",
  cards: "d = {'a': 1}\ns = 'hi'\nt = (1, 2)\nd['b'] = 2\nf = float('nan')",
  sort: "a = [3, 1, 2]\na.sort()\nb = sorted(a, key=lambda v: -v)\nprint(a, b)",
}

for (const [name, code] of Object.entries(PROGRAMS)) {
  test(`round trip: ${name}`, () => {
    const { raw, real } = traceOf(code)
    assert.equal(raw.error, null)
    const steps = toSteps(raw)
    const p = replay(steps, steps.length - 1)
    const mine = Object.fromEntries(Object.entries(p.globals).map(([k, b]) => [k, "ref" in b ? p.lists[b.ref] : b.val]))
    const theirs = Object.fromEntries(
      Object.entries(real.vars).map(([k, v]) => [k, typeof v === "object" && v !== null && "ref" in v ? real.lists[v.ref].items : v])
    )
    assert.deepEqual(mine, theirs)
    assert.deepEqual(p.output, raw.stdout ? raw.stdout.replace(/\n$/, "").split("\n") : [])
    assert.ok(steps.every((s) => s.line >= 1 && s.line <= code.split("\n").length))
  })
}

test("only the learner's frames are recorded", () => {
  const { raw } = traceOf("import json\nx = json.dumps([1])")
  assert.ok(raw.snaps.every((s) => s.frames.every((f) => f.fn === "<module>")))
})

test("an infinite loop stops at the cap", () => {
  const { raw } = traceOf("while True:\n    pass")
  assert.equal(raw.truncated, true)
  assert.equal(raw.snaps.length, 500)
})

test("the cap survives except Exception", () => {
  const { raw } = traceOf("try:\n    while True:\n        pass\nexcept Exception:\n    print('caught')")
  assert.equal(raw.truncated, true)
  assert.equal(raw.stdout, "")
})

test("a list that contains itself is safe", () => {
  const { raw } = traceOf("a = [1]\na.append(a)")
  const last = raw.snaps.at(-1)!
  const id = (last.frames[0].vars.find(([n]) => n === "a")![1] as { ref: string }).ref
  assert.deepEqual(last.lists[id].items[1], { repr: "[1, [...]]", type: "list" })
})

test("an exception ends the steps with the cleaned error on its line", () => {
  const { raw } = traceOf("a = [1]\na.append(2)\nprint(a[5])")
  const err = cleanTraceback(raw.error!)
  assert.equal(err.line, 3)
  assert.match(err.text, /IndexError/)
  const steps = toSteps(raw, err)
  assert.equal(steps.at(-1)!.event.type, "error")
  assert.equal(steps.at(-1)!.line, 3)
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test 2>&1 | grep -E "^ℹ (pass|fail)|✖"` — Expected: FAIL (`__trace__` is not defined).

- [ ] **Step 3: Implement** — append to `public/inspect.py`:

```python


# --- __trace__: records a run for the Visualize tab (lib/viz/trace-events.ts turns it into steps) ---
import contextlib as _contextlib
import io as _io
import math as _math
import traceback as _traceback


class _TraceLimit(BaseException):
    """Ends a traced run at the step cap. A BaseException, so `except Exception` can't swallow it."""


_TRACE_STEPS = 500
_TRACE_ITEMS = 50
_SKIP = (_types.ModuleType, _types.FunctionType, _types.BuiltinFunctionType, _types.MethodType, type)


def _trace_repr(v):
    try:
        text = repr(v)
    except Exception:
        text = f"<{type(v).__name__}>"
    return {"repr": text if len(text) <= 80 else text[:77] + "...", "type": type(v).__name__}


def _trace_value(v, lists):
    """A value as JSON: plain for None/bool/int/float/str, {"ref"} for a list, a repr card for the rest."""
    if v is None or isinstance(v, bool):
        return v
    if isinstance(v, str):
        return v[:80]
    if isinstance(v, int):
        return v if abs(v) <= 2**53 else _trace_repr(v)
    if isinstance(v, float):
        return v if _math.isfinite(v) else _trace_repr(v)
    if type(v) is list and lists is not None:
        key = hex(id(v))
        if key not in lists:
            lists[key] = {
                # a list inside a list is a card: nested structures are out of v1
                "items": [_trace_repr(x) if type(x) is list else _trace_value(x, None) for x in v[:_TRACE_ITEMS]],
                "more": max(0, len(v) - _TRACE_ITEMS),
            }
        return {"ref": key}
    return _trace_repr(v)


def __trace__(ns, code):
    # The learner's code objects. Lambdas and generator expressions (<lambda>, <genexpr>) run
    # inside one line, so they don't get frames of their own.
    learner = set()
    todo = [code]
    while todo:
        co = todo.pop()
        if co is code or not co.co_name.startswith("<"):
            learner.add(co)
        todo.extend(c for c in co.co_consts if isinstance(c, _types.CodeType))

    snaps = []
    out = _io.StringIO()

    def record(frame, event, arg):
        if len(snaps) >= _TRACE_STEPS:
            raise _TraceLimit
        chain = []
        f = frame
        while f is not None:
            if f.f_code in learner:
                chain.append(f)
            f = f.f_back
        lists = {}
        frames = []
        for fr in reversed(chain):
            names = []
            for name, v in list(fr.f_locals.items()):
                if name.startswith("__") or isinstance(v, _SKIP):
                    continue
                names.append([name, _trace_value(v, lists)])
            frames.append({"fn": "<module>" if fr.f_code is code else fr.f_code.co_name, "vars": names})
        snap = {"line": frame.f_lineno, "event": event, "frames": frames, "lists": lists, "out": out.tell()}
        if event == "return":
            snap["ret"] = _trace_value(arg, lists)
        snaps.append(snap)

    def local(frame, event, arg):
        if event in ("line", "return", "exception"):
            record(frame, event, arg)
        return local

    def tracer(frame, event, arg):
        # 'call': the return value becomes this frame's local tracer (None: don't trace it).
        if frame.f_code not in learner:
            return None
        record(frame, event, arg)
        return local

    truncated = False
    error = None
    with _contextlib.redirect_stdout(out):
        _sys.settrace(tracer)
        try:
            exec(code, ns)
        except _TraceLimit:
            truncated = True
        except BaseException as e:
            tb = e.__traceback__
            while tb is not None and tb.tb_frame.f_code not in learner:
                tb = tb.tb_next
            error = "".join(_traceback.format_exception(type(e), e, tb))
        finally:
            _sys.settrace(None)
    return _json.dumps({"snaps": snaps, "truncated": truncated, "stdout": out.getvalue(), "error": error})
```

- [ ] **Step 4: Run tests**

Run: `npm test 2>&1 | grep -E "^ℹ (pass|fail)|✖"` — Expected: PASS. Also run `npm run check:content -- python 2>&1 | tail -3` — Expected: still passes (`__inspect__` unchanged).

If a round trip fails, print the steps (`console.log(steps.map((s) => [s.line, s.event]))`) and compare with `raw.snaps`; fix the adapter (Task 3's file) with a new unit test reproducing it, not the round-trip test.

- [ ] **Step 5: Commit**

```bash
npx prettier --write lib/viz/trace-py.test.ts
git add public/inspect.py lib/viz/trace-py.test.ts
git commit -m "Record Python runs line by line for the visualizer

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Worker trace job and `trace()` in the runner

**Files:**
- Modify: `public/python.worker.js`
- Modify: `lib/runner.ts`

**Interfaces:**
- Consumes: Task 4's `__trace__`; Task 3's `Trace` type.
- Produces: `export type TraceResult = { trace?: Trace; error?: string; errorLine?: number }` and `export function trace(code: string): Promise<TraceResult>` in `lib/runner.ts`. Worker message in: `{ type: "trace", id: number, code: string }`; out: messages carrying `job: "trace", id`.

- [ ] **Step 1: Worker** — in `public/python.worker.js`, at the top of `self.onmessage` right after the dataset loop, add `if (data.type === "trace") return traceJob(py, data)`, and add this function above `self.onmessage`:

```js
// Visualize tab: the same setup as a run, but under __trace__ (public/inspect.py), and every
// message tagged with the job id so the runner never mixes it up with a Run.
async function traceJob(py, { id, code }) {
  const post = (m) => postMessage({ ...m, job: "trace", id })
  const ns = py.globals.get("dict")()
  ns.set("__name__", "__main__")
  ns.set("__src__", code)
  const t0 = performance.now()
  try {
    post({ type: "phase", phase: "compiling" })
    py.runPython("__code__ = compile(__src__, '<exec>', 'exec')", { globals: ns, filename: "<thonglearn>" })
    await py.loadPackagesFromImports(code, { messageCallback: () => post({ type: "phase", phase: "installing" }) })
    post({ type: "phase", phase: "running" })
    const res = JSON.parse(py.globals.get("__trace__")(ns, ns.get("__code__")))
    const err = res.error ? cleanTraceback(res.error) : undefined
    post({
      type: "done",
      ms: performance.now() - t0,
      trace: { snaps: res.snaps, truncated: res.truncated, stdout: res.stdout },
      error: err?.text,
      errorLine: err?.line,
    })
  } catch (e) {
    // a syntax error: nothing ran, so there's nothing to trace
    const { text, line } = cleanTraceback(String(e.message))
    post({ type: "done", ms: performance.now() - t0, error: text, errorLine: line })
  } finally {
    ns.destroy()
  }
}
```

- [ ] **Step 2: Runner** — in `lib/runner.ts` add `import type { Trace } from "./viz/trace-events"` and, above `run()`:

```ts
export type TraceResult = { trace?: Trace; error?: string; errorLine?: number }

let traceId = 0
let tracing: { id: number; resolve: (r: TraceResult) => void; timer?: ReturnType<typeof setTimeout> } | undefined

function endTrace(r: TraceResult) {
  if (!tracing) return
  clearTimeout(tracing.timer)
  tracing.resolve(r)
  tracing = undefined
}

function onTraceMessage(data: { id: number; type: string; phase?: string; trace?: Trace; error?: string; errorLine?: number }) {
  if (!tracing || data.id !== tracing.id) return // an older trace, already replaced
  if (data.type === "phase" && data.phase === "running")
    tracing.timer = setTimeout(() => {
      endTrace({ error: `Stopped after ${TIMEOUT_MS / 1000}s: is there an infinite loop?` })
      // a busy worker can't be interrupted without SharedArrayBuffer; replace it
      workers.pyodide?.terminate()
      booted.delete("pyodide")
      spawn("pyodide")
    }, TIMEOUT_MS)
  if (data.type === "done") endTrace({ trace: data.trace, error: data.error, errorLine: data.errorLine })
}

/** Record a Python run for the Visualize tab. Never touches the Output tab's state or history. */
export function trace(code: string): Promise<TraceResult> {
  if (state.status === "running") stop()
  endTrace({ error: "Replaced by a newer trace." })
  warm("pyodide")
  const id = ++traceId
  return new Promise((resolve) => {
    tracing = { id, resolve }
    workers.pyodide!.postMessage({ type: "trace", id, code })
  })
}
```

In `spawn()`'s `worker.onmessage`, right after the `ready` branch, add: `if (data.job === "trace") return onTraceMessage(data)`. At the top of `run()`, after `if (state.status === "running") stop()`, add: `endTrace({ error: "Interrupted by Run." })`.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npx eslint lib/runner.ts public/python.worker.js` — Expected: clean.
Run: `npm run dev` (background), open `http://127.0.0.1:3000/python/playground` and press **Run**: the output still appears as before, which shows the worker's run path is unchanged. (`trace()` has no UI until Task 7, which verifies it end to end.)

- [ ] **Step 4: Commit**

```bash
npx prettier --write lib/runner.ts
git add public/python.worker.js lib/runner.ts
git commit -m "Trace a Python run in the worker, separately from Run

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Shared `VizPlayer`

**Files:**
- Create: `components/viz/viz-player.tsx`
- Modify: `components/viz/playground.tsx` (`DemoView` uses `VizPlayer`)

**Interfaces:**
- Consumes: `layoutOf(steps)` and `Layout.hidden` from Task 2.
- Produces: `VizPlayer({ steps, variant, aside?, footer?, notice?, onLine? })` where `variant: "split" | "stacked"`, `aside?: (line?: number) => React.ReactNode`, `footer?: React.ReactNode`, `notice?: string`, `onLine?: (line?: number) => void` (must be a stable function, e.g. a state setter).

- [ ] **Step 1: Create `components/viz/viz-player.tsx`**

```tsx
"use client"

import { useEffect, useMemo } from "react"
import { MotionConfig } from "motion/react"

import { Badge } from "@/components/ui/badge"
import type { Step } from "@/lib/viz/events"
import { layoutOf } from "@/lib/viz/layout"
import { usePlayer } from "@/lib/viz/use-player"
import { cn } from "@/lib/utils"

import { VizCanvas } from "./viz-canvas"
import { VizTimeline } from "./viz-timeline"

/**
 * The canvas, the explanation of the current step and the timeline, for any list of steps.
 * `split` (the playground): panel beside the canvas on wide screens. `stacked` (the lesson
 * workspace's Visualize tab): canvas above the panel.
 */
export function VizPlayer({
  steps,
  variant,
  aside,
  footer,
  notice,
  onLine,
}: {
  steps: Step[]
  variant: "split" | "stacked"
  aside?: (line?: number) => React.ReactNode
  footer?: React.ReactNode
  notice?: string
  onLine?: (line?: number) => void
}) {
  const layout = useMemo(() => layoutOf(steps), [steps])
  const player = usePlayer(steps.length)
  const step = layout.frames[player.index].step
  const line = step?.line
  useEffect(() => {
    onLine?.(line)
  }, [line, onLine])

  const { vars, lists } = layout.hidden
  const notes = [
    notice,
    vars ? `${vars} more variable${vars > 1 ? "s" : ""} not drawn` : "",
    lists ? `${lists} more list${lists > 1 ? "s" : ""} not drawn` : "",
  ].filter(Boolean)
  const split = variant === "split"

  return (
    // Reduced motion for everything in the player: canvas, code highlight, output.
    <MotionConfig reducedMotion="user">
      <div className={cn("flex min-h-0 flex-1 flex-col", split && "lg:flex-row")}>
        <section
          className={cn(
            "relative order-1 min-h-64 shrink-0",
            split ? "h-[56svh] min-h-80 lg:order-2 lg:h-auto lg:flex-1" : "flex-1"
          )}
          aria-label="Visualization"
        >
          {/* absolute: React Flow sizes itself to 100% of its parent, which a flex item's height isn't */}
          <div className="absolute inset-0">
            <VizCanvas layout={layout} index={player.index} forward={player.forward} speed={player.speed} />
          </div>
        </section>

        <aside
          className={cn(
            "order-2 flex shrink-0 flex-col gap-4 overflow-y-auto border-t p-4",
            split ? "lg:order-1 lg:w-[400px] lg:border-t-0 lg:border-r" : "max-h-[50%] gap-3 p-3"
          )}
        >
          {aside?.(line)}
          {notes.length > 0 && <p className="text-xs text-muted-foreground">{notes.join(" · ")}</p>}
          <StepNote step={step} />
          <VizTimeline player={player} />
          {footer}
        </aside>
      </div>
    </MotionConfig>
  )
}

function StepNote({ step }: { step?: Step }) {
  const error = step?.event.type === "error" ? step.event.text : undefined
  return (
    <section aria-live="polite" aria-label="What just happened" className="min-h-24 rounded-lg border bg-card p-3">
      {step ? (
        <>
          <div className="flex items-center gap-2">
            <Badge variant={error ? "destructive" : "secondary"} className="font-mono">
              {step.event.type}
            </Badge>
            <span className="text-xs text-muted-foreground">line {step.line}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed">{step.note}</p>
          {error && <pre className="mt-2 overflow-x-auto font-mono text-xs whitespace-pre-wrap text-destructive">{error}</pre>}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Nothing has run yet. Press Step to run the first operation.</p>
      )}
    </section>
  )
}
```

(`Badge` has a `destructive` variant: `components/ui/badge.tsx:14`.)

- [ ] **Step 2: Use it in the playground** — in `components/viz/playground.tsx`, replace the whole `DemoView` with:

```tsx
function DemoView({ demo }: { demo: Demo }) {
  return (
    <VizPlayer
      steps={demo.steps}
      variant="split"
      aside={(line) => (
        <>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{demo.title}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{demo.summary}</p>
          </div>
          <CodePanel code={demo.code} line={line} />
        </>
      )}
      footer={
        <a href={demo.reference.href} target="_blank" rel="noreferrer" className="mt-auto flex items-center gap-1 text-xs text-link hover:underline">
          Reference: {demo.reference.label}
          <ArrowUpRightIcon className="size-3" />
        </a>
      }
    />
  )
}
```

Remove the now-unused imports from `playground.tsx` (`useMemo`, `MotionConfig`, `Badge`, `layoutOf`, `usePlayer`, `VizCanvas`, `VizTimeline`) and add `import { VizPlayer } from "./viz-player"`.

- [ ] **Step 3: Verify nothing changed for the playground**

Run: `npx tsc --noEmit && npx eslint components/viz` — Expected: clean.
Run the dev server and the 12-demo browser check from phase 1 (every Step changes the lit code line and the explanation; Back goes back one step; no console errors), with and without reduced motion. The script lives at the path used in phase 1; if it's gone, use the `webapp-testing` skill to: open `/visualize?demo=<id>` for each demo id in `lib/viz/demos.ts`, click **Step** until `Step N of N`, and assert `[aria-current="step"]` count is 1 after each click.

- [ ] **Step 4: Commit**

```bash
npx prettier --write components/viz/viz-player.tsx components/viz/playground.tsx
git add components/viz/viz-player.tsx components/viz/playground.tsx
git commit -m "Share one VizPlayer between the playground and the workspace

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: The Visualize tab

**Files:**
- Create: `components/visualize-pane.tsx`
- Modify: `components/workspace.tsx` (tab trigger + content near lines 460–495, `highlightLine` at ~line 441, one state hook near line 212)

**Interfaces:**
- Consumes: `trace()` / `TraceResult` (Task 5), `toSteps` (Task 3), `VizPlayer` (Task 6).
- Produces: `VisualizePane({ code, docKey, onLine })`. A trace never touches the Output tab, so errors (a syntax error, a timeout) are shown in the pane itself.

- [ ] **Step 1: Create `components/visualize-pane.tsx`**

```tsx
"use client"

import { useCallback, useEffect, useState } from "react"
import { BoxesIcon, RotateCwIcon, TriangleAlertIcon } from "lucide-react"

import { VizPlayer } from "@/components/viz/viz-player"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { trace, type TraceResult } from "@/lib/runner"
import type { Step } from "@/lib/viz/events"
import { toSteps } from "@/lib/viz/trace-events"

type Traced = { n: number; doc: string; code: string; steps?: Step[]; truncated?: boolean; error?: string }

// Survives the tab unmounting (inactive tabs unmount), so switching tabs doesn't re-trace.
let last: Traced | undefined
let count = 0

function toTraced(doc: string, code: string, r: TraceResult): Traced {
  const t: Traced = { n: ++count, doc, code, error: r.error }
  if (r.trace) {
    t.steps = toSteps(r.trace, r.error ? { text: r.error, line: r.errorLine } : undefined)
    t.truncated = r.trace.truncated
  }
  return t
}

/**
 * Records the learner's code and replays it in the isometric visualizer. Traces on first
 * open (per lesson); after an edit it offers "trace again" instead of re-running on its own.
 */
export function VisualizePane({
  code,
  docKey,
  onLine,
}: {
  code: string
  docKey: string
  onLine: (line?: number) => void
}) {
  const fresh = last?.doc === docKey ? last : undefined
  const [result, setResult] = useState(fresh)
  const [busy, setBusy] = useState(!fresh)

  const start = useCallback(
    (c: string) =>
      trace(c).then((r) => {
        last = toTraced(docKey, c, r)
        setResult(last)
        setBusy(false)
      }),
    [docKey]
  )
  useEffect(() => {
    if (!fresh) start(code)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- first open only; later traces are explicit
  useEffect(() => () => onLine(undefined), [onLine])

  const again = () => {
    setBusy(true)
    start(code)
  }

  if (busy && !result)
    return (
      <Empty className="h-full">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Spinner />
          </EmptyMedia>
          <EmptyTitle>Recording your program</EmptyTitle>
          <EmptyDescription>Running it once, line by line.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )

  if (result && !result.steps?.length)
    return (
      <Empty className="h-full">
        <EmptyHeader>
          <EmptyMedia variant="icon">{result.error ? <TriangleAlertIcon /> : <BoxesIcon />}</EmptyMedia>
          <EmptyTitle>{result.error ? "Fix the error first" : "Nothing to show yet"}</EmptyTitle>
          <EmptyDescription>
            {result.error
              ? "The program stopped before it did anything to draw:"
              : "This code doesn't create variables or print anything."}
          </EmptyDescription>
        </EmptyHeader>
        {result.error && (
          <pre className="max-w-full overflow-x-auto rounded-md bg-muted p-2 text-left font-mono text-xs whitespace-pre-wrap text-destructive">
            {result.error}
          </pre>
        )}
        <EmptyContent>
          <Button size="sm" onClick={again} disabled={busy}>
            <RotateCwIcon data-icon="inline-start" />
            Trace again
          </Button>
        </EmptyContent>
      </Empty>
    )

  if (!result?.steps) return null
  const stale = result.code !== code
  return (
    <div className="flex h-full flex-col">
      {stale && (
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2 text-xs text-muted-foreground">
          Code changed since this recording.
          <Button size="xs" variant="outline" onClick={again} disabled={busy}>
            {busy ? <Spinner data-icon="inline-start" /> : <RotateCwIcon data-icon="inline-start" />}
            Trace again
          </Button>
        </div>
      )}
      <VizPlayer
        key={result.n}
        steps={result.steps}
        variant="stacked"
        notice={result.truncated ? "Showing the first 500 steps" : undefined}
        onLine={onLine}
      />
    </div>
  )
}
```

(`Button` has `size="xs"`: `components/ui/button.tsx:25`.)

- [ ] **Step 2: Wire it into `components/workspace.tsx`**

Import: `import { VisualizePane } from "@/components/visualize-pane"`.

Next to the `picked` state (~line 212): `const [vizLine, setVizLine] = useState<number>()`.

The editor's `highlightLine` (~line 441) becomes:

```tsx
          highlightLine={
            tab === "visualize"
              ? vizLine
              : picked?.runKey === state.runKey
                ? picked.line
                : undefined
          }
```

In `TabsList`, after the Inspect trigger:

```tsx
          {c.runtime === "pyodide" && (
            <TabsTrigger value="visualize">Visualize</TabsTrigger>
          )}
```

After the Inspect `TabsContent`:

```tsx
      {c.runtime === "pyodide" && (
        <TabsContent value="visualize" className="min-h-0">
          <VisualizePane code={code} docKey={saveKey} onLine={setVizLine} />
        </TabsContent>
      )}
```

- [ ] **Step 3: Verify in the browser** (use the `webapp-testing` skill)

Run `npm run dev`, open `http://127.0.0.1:3000/python/playground`, replace the editor code (Monaco: click in the editor, select all, type) with:

```python
nums = [3, 1]
nums.append(4)
def grow(xs):
    xs.append(9)
    return len(xs)
n = grow(nums)
print(n, nums)
```

Click the **Visualize** tab. Expected: "Recording your program", then the canvas with a `Global` plate. Press **Step** repeatedly and check after each press that Monaco shows exactly one `.inspect-line` decoration and that its line matches `line N` in the explanation card; the `grow` machine gets a frame labelled `grow(xs → nums)`; `nums` ends as `[3, 1, 4, 9]`; the Output card shows `4 [3, 1, 4, 9]`. Edit the code: the "Code changed since this recording." bar appears; click **Trace again**: it re-records. Put `print(nums[9])` at the end: the last step is `error` in red, line 8. Put `while True: pass`: "Showing the first 500 steps". No console errors throughout. Screenshots at 1440 px, 1024 px and 390 px, light and dark.

- [ ] **Step 4: Commit**

```bash
npx prettier --write components/visualize-pane.tsx components/workspace.tsx
git add components/visualize-pane.tsx components/workspace.tsx
git commit -m "Add the Visualize tab: step through your own Python code

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Docs and full verification

**Files:**
- Modify: `docs/architecture.md` (the `## Visualizer` section)
- Modify: `docs/runtimes.md` (the Pyodide/Python section: one paragraph on `trace`)

- [ ] **Step 1: Docs** — in `docs/architecture.md`'s Visualizer section, replace the first line of the code block with two sources and add a bullet:

```
Step[] (event + line + note)      lib/viz/demos.ts (hand-written) or lib/viz/trace-events.ts (a real run)
```

```md
- **The Visualize tab** (`components/visualize-pane.tsx`) traces the learner's code: `trace()` in
  `lib/runner.ts` asks the Pyodide worker to run it under `__trace__` (`public/inspect.py`, a
  `sys.settrace` snapshot per line, capped at 500), and `toSteps` turns each change between
  snapshots into one event. `lib/viz/trace-py.test.ts` round-trips real programs through it.
```

In `docs/runtimes.md`, in the Python section, add: "The worker also accepts `{ type: \"trace\", id, code }` for the Visualize tab: the same setup as a run, executed under `__trace__` from `public/inspect.py`; its messages carry `job: \"trace\"` so the runner keeps them apart from Run."

- [ ] **Step 2: Full verification**

Run: `npm test 2>&1 | grep -E "^ℹ (pass|fail)"` — Expected: all pass.
Run: `npm run typecheck && npm run lint 2>&1 | tail -2` — Expected: no errors (pre-existing warnings only).
Run: `npm run check:content -- python 2>&1 | tail -3` — Expected: passes.
Stop the dev server, then `npm run build 2>&1 | tail -25` — Expected: success, `/visualize` static.

- [ ] **Step 3: Commit**

```bash
git add docs/architecture.md docs/runtimes.md
git commit -m "Document the Visualize tab and the trace job

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```
