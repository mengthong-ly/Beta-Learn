# Step-by-step visualizer (Python)

> **Status (2026-09-24):** the UI half is superseded by the isometric visual system at `/visualize` (`components/viz/`, `lib/viz/`, see `docs/architecture.md` → Visualizer). The tracer below is now phase 2: it should emit the `VizEvent`s in `lib/viz/events.ts` (replacing this spec's `Change` type) and render with that canvas.

## Context
Learners see what their code printed, and the Inspect tab shows the bytecode and the variables left over at the end. They never see the program *move*: a list growing on `append`, boxes shifting on `insert(0, x)`, two names pointing at one list. This adds a **Visualize** tab that records a Python run line by line and replays it as animated boxes, frames and arrows, in the style of Python Tutor but in ThongLearn's own look.

Decisions already made with you:
- Python first. Other languages, and the "pipeline" view (source → bytecode → run → output as animated cards), each get their own spec later.
- A separate **Visualize** tab. Opening it re-runs the code with tracing; the normal Run stays fast.
- v1 draws lists, tuples, dicts and scalars, plus a frame for each function call. Everything else is a plain value card.
- Approach A: record a snapshot on every line in the worker, then diff the snapshots in the browser. No subclassing, no AST rewriting, so Python's semantics stay exactly as they are.
- Aliasing is drawn with **arrows** from variables and cells to the objects they point at.

## Architecture and data flow

```
Visualize tab opens ─► runner.trace(code) ─► python.worker.js {type:"trace"}
                                               └─ __trace__ (inspect.py) runs code under sys.settrace
                  ◄── {type:"done", trace} ◄──┘
VisualizePane ─► lib/trace.ts (describe, cellKeys) ─► motion boxes + SVG arrows
```

### Worker (`public/python.worker.js`)
- A new message, `{ type: "trace", code }`. It uses the same fresh-namespace setup, dataset files, package loading, phases, stdout capture and `input()` behaviour as a normal run, and the same 10 s timeout, which the runner starts on the `running` phase.
- It calls `__trace__(ns, code_object)` and posts `{ type: "done", ms, trace, error?, errorLine? }`. Lesson `check` blocks never run during a trace.
- A syntax error means there's no trace: it posts `done` with `error` and no `trace`.

### Tracer (`__trace__` in `public/inspect.py`, next to `__inspect__`)
- `sys.settrace` with a global tracer. It returns the local tracer only for frames whose `f_code.co_filename == "<exec>"`, so library and stdlib frames produce no steps (in 3.14, `'call'`'s return value sets the local tracer; see the sys.settrace reference). Tracing is removed in a `finally`.
- It records a step on `line` (the state *before* the line runs), `call`, `return` (with the return value) and `exception`. The module-level `return` step holds the final state.
- Step format (JSON):
  ```
  Trace = { steps: Step[], truncated: boolean }
  Step  = { line: number, event: "line"|"call"|"return"|"exception",
            frames: { name: string, vars: [string, Val][] }[],   // outermost first; "<module>" shown as "Global"
            heap: Record<string, Obj>,                           // id(obj) as hex → object
            out: number,                                         // stdout characters written so far
            ret?: Val, exc?: string }
  Val   = number | boolean | null | { s: string } | { ref: string }   // int/float/bool/None inline, str as {s}
  Obj   = { t: "list"|"tuple", items: Val[], more: number }
        | { t: "dict", entries: [Val, Val][], more: number }
        | { t: "other", type: string, repr: string }
  ```
  - Strings are wrapped as `{ s: "..." }` so a Python `"3"` never looks like the number `3`. Strings and `other` reprs are capped at 80 characters.
  - The heap is built by walking from the frame variables. Each id is serialized once, so self-reference (`a.append(a)`) and shared objects are safe. Modules, functions and classes are left out of `vars`, as in `__inspect__`, and dunder names are skipped.
- **Caps:** 500 steps. On step 501 the tracer raises a private `_TraceLimit` exception to abort the run, so an infinite loop ends there instead of at the timeout. `truncated: true` is set, and that exception is not reported as an error. At most 50 items or entries per container, with the rest counted in `more`. Anything that isn't a list, tuple or dict (sets, instances, DataFrames) is `other`.

### Runner (`lib/runner.ts`)
- `trace(code): Promise<RunState & { trace?: Trace }>` reuses the Pyodide worker, the boot/compile/install/running phases, the timeout and `stop()`. It doesn't touch the Output tab's run state or history.

## Diffing (`lib/trace.ts`, pure, tested)
- Types for `Trace`, `Step`, `Val` and `Obj`.
- `describe(prev: Step, next: Step): Change[]`:
  - `var-new`, `var-set` (the old and new `Val`), `var-del`, `call { name }`, `return { value }`
  - `list-insert { obj, index, value }`, `list-remove { obj, index, value }`, `list-set { obj, index, from, to }`
  - `dict-add { obj, key }`, `dict-remove { obj, key }`, `dict-set { obj, key, from, to }`
  - One step can change several things (`a, b = b, a`), so `describe` returns them all. The caption lists them in plain words ("appended `4` at index 3", "`total` changed 3 → 7"). It never guesses at the method that was called.
- `cellKeys(trace): Map<string /* obj id */, string[][] /* per step, key per index */>`: each list or tuple cell gets a key that stays the same across steps, via an LCS diff of consecutive item lists (items compared by `Val` equality). Unmatched cells get fresh keys. `// ponytail: O(n²) LCS per step, fine at the 50-item cap`.
- Insertions and removals from the LCS are what `describe` reports as `list-insert`/`list-remove`. Same-position matches whose value changed are `list-set`.

## UI (`components/visualize-pane.tsx`)
- **Tab:** `Visualize` in `components/workspace.tsx`, only when the course runtime is `pyodide`, placed between Inspect and History. The first time it opens after the code changes, it calls `trace()`. If the code changes after that, it shows a **"Code changed, re-trace"** button instead of re-tracing on its own.
- **Controls:** first / previous / play-pause / next / last buttons, a slider (added with `npx shadcn add slider`), `Step n / N`, and ← → keys while the pane has focus. Play advances about 2 steps per second and stops at the end.
- **Editor line:** the current step's line is highlighted through the existing `onPickLine` path Inspect uses. The caption says whether the line is *about to run* (`line`), a *call* or a *return*.
- **Canvas:** two columns, **Frames** and **Objects**. Under about 520 px wide (always on phones) they stack, frames above objects.
  - A frame card lists its variables. Scalars show inline; a `{ref}` shows an empty slot with a dot where an arrow starts.
  - A list or tuple is a row of boxes with index labels (tuples get a different border). Motion `layout` slides boxes that move, `AnimatePresence` pops in inserted boxes and fades out removed ones, and a changed value flashes a tint. `more > 0` adds a final `…+N` box.
  - A dict is a key → value table with the same enter, exit and flash behaviour.
  - `other` is a card with its type and repr.
  - Objects are ordered by first appearance, so they don't jump around between steps.
- **Arrows:** one absolutely positioned `<svg>` overlay. Paths are computed from `getBoundingClientRect` of each source dot and target object. They recalculate on `ResizeObserver` and on every animation frame while a layout animation is running. They're drawn as a curve with an arrowhead, in `currentColor` at muted strength, and the arrows touching the step's changes are drawn in the primary colour. No arrow library: react-xarrows and leader-line are unmaintained and don't follow motion layout animations.
- **Output strip:** stdout up to `step.out` characters, under the canvas.
- **Reduced motion:** no sliding or popping, only the change flash. Arrows still update.
- **Accessibility:** the caption is `aria-live="polite"`, the controls have labels, and each box has its index and value in its accessible name.

## Errors and edge cases
- **Syntax error:** no trace. An Empty state says "Fix the syntax error first" and links to the Output tab.
- **Runtime exception:** the last step is `exception`, shown in red with the text cleaned by `cleanTraceback`. Learners can scrub back to see what led to it.
- **Truncated:** a banner reads "Showing the first 500 steps".
- **Timeout** (slow code that stays under 500 steps, e.g. one huge `sum(range(10**9))`): the same message as Run. Any partial trace is discarded.
- **A learner's own `except Exception`** can catch `_TraceLimit`. To stop that, it subclasses `BaseException`, the way `KeyboardInterrupt` does.
- **`input()`:** the same error as Run.
- **The tab is never read for progress.** Visualize doesn't count as a run and doesn't write history.

## Testing
- `lib/trace.test.ts` (`npm test`): `describe` on append, insert at 0, pop from the middle, set by index, swap, dict add, remove and set, a list mutated through an alias, a nested list, and several changes in one step. `cellKeys` keeping keys stable through `insert(0, x)` and `pop(0)`.
- `lib/trace-py.test.ts` (`npm test`): loads Pyodide from `node_modules` the way `scripts/check-content.ts` does, runs `inspect.py`, and traces three fixed programs. It checks the step count and line order, that two names share one heap id, that no stdlib frames appear, that a 1000-iteration loop sets `truncated`, that self-reference is safe, and that the last step is `exception` when the code raises.
- **UI:** a Playwright pass (`webapp-testing` skill) on a Python lesson. Open Visualize, step past an `append` line and confirm a new box, confirm an arrow `<path>` exists for an aliased list, then take screenshots in light, dark and at 390 px wide.
- `npm run lint`, `npm run typecheck` and `npm test` all pass.

## Out of scope (later)
- The pipeline view (its own spec).
- Other languages.
- Method names in captions via `sys.monitoring` CALL events.
- Sets and class instances drawn as boxes, and routing arrows to avoid crossings.
- Visualize-specific lesson content.

## Reference
- sys.settrace: https://docs.python.org/3.14/library/sys.html#sys.settrace
