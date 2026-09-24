# Visualize any Python code (phase 2)

## Context
Phase 1 built the isometric visual system and its playground at `/visualize`: 12 hand-written demos drive `VizEvent`s (`lib/viz/events.ts`) through program state → visual state → animation state → React Flow (`docs/architecture.md` → Visualizer). Phase 2 makes the same world show **the learner's own code**: a **Visualize** tab in the lesson workspace records a real Pyodide run and replays it one semantic operation per step, with the matching line lit in the editor.

Decisions already made with you:
- **Data first.** Variables, lists (insert, remove, update, aliasing), function frames with their locals, and prints. Control flow is shown by the editor/line highlight moving, not by gates or loop cursors (a later phase can add `sys.monitoring` BRANCH events for that).
- A separate **Visualize** tab. Opening it re-runs the code with tracing; the normal Run stays fast.
- One event per change, so "one Step = one operation" holds for real code too.
- Dicts, sets, objects, nested lists and DataFrames appear as value cards (their repr), not animated structures.

## Architecture

```
Visualize tab opens → runner.trace(code) → python.worker.js {type:"trace"}
                                             └ __trace__ (public/inspect.py): Snap[] under sys.settrace
lib/viz/trace-events.ts: Snap[] → Step[] (VizEvents + generated notes)
→ the existing pipeline: program.ts → scene.ts → beat.ts → layout.ts → VizPlayer (shared with /visualize)
```

### Tracer (`__trace__` in `public/inspect.py`, next to `__inspect__`)
- `sys.settrace` with a global tracer that returns the local tracer only for frames whose `f_code.co_filename == "<exec>"`, so library frames never produce steps. In 3.14 the `'call'` event's return value sets the local tracer, and `'line'` fires *before* a line runs (https://docs.python.org/3.14/library/sys.html#sys.settrace). Tracing is removed in a `finally`.
- One snapshot per `line`, `call`, `return` (with the return value) and `exception` event:
  ```
  Snap  = { line: number, event: "line"|"call"|"return"|"exception",
            frames: { fn: string, vars: [string, Value][] }[],   // outermost ("<module>") first
            lists: Record<string, { items: Value[], more: number }>, // id(list) as hex
            out: number,                                          // stdout characters written so far
            ret?: Value, exc?: string }
  Value = number | string | boolean | null      // int/float/str/bool/None (JSON keeps "3" and 3 apart)
        | { ref: string }                       // a list, by id
        | { repr: string, type: string }        // anything else: dict, set, tuple, object, nan/inf
  ```
  - Lists are collected by walking from frame variables; each id once, so self-reference (`a.append(a)`) and shared lists are safe. A list inside a list is a `{repr}` cell (nested structures are out of v1).
  - Dunder names, modules, functions and classes are left out of `vars`, as in `__inspect__`. Reprs and strings are capped at 80 characters.
- **Caps:** 500 snapshots, then a private `_TraceLimit(BaseException)` aborts the run (so a learner's `except Exception` can't swallow it, and an infinite loop ends at the cap instead of the timeout); `truncated: true`. At most 50 items per list, the rest counted in `more`.

### Worker (`public/python.worker.js`) and runner (`lib/runner.ts`)
- A new message `{ type: "trace", code }`: the same fresh namespace, dataset files, package loading, phases, stdout capture and `input()` behaviour as a run. It posts `{ type: "done", ms, trace: { snaps, truncated, stdout }, error?, errorLine? }`. Lesson `check` blocks never run.
- `trace(code)` in `lib/runner.ts` reuses the Pyodide worker, boot phases, 10 s timeout and `stop()`, and resolves with the result. It never touches the Output tab's `RunState` or history.

### Adapter (`lib/viz/trace-events.ts`, pure, tested)
`toSteps(snaps, stdout): Step[]` compares each snapshot with the next. The step's `line` is the line that just ran (the earlier snapshot's line; for `call`, the caller's line). It emits one event per change, in this order:
1. `call { fn, args }` when a frame appears (args = the new frame's variables at entry); `return { fn, value }` when one goes (value from the `return` snapshot).
2. Per variable in the current frame: new or changed scalar/repr → `var.set`; bound to a list id not seen before → `array.create`; bound to a list another name already holds → `ref.set { name, to }` (aliasing: a second reference connection to the same list); name gone → `var.del`.
3. Per list id present in both snapshots: an LCS diff of the items → `array.insert` / `array.remove` / `array.set`, naming the list by the first variable that holds it.
4. New complete stdout lines since the last snapshot → one `print` per line.
5. An `exception` snapshot at the end → `error { text }` (the traceback cleaned by `public/traceback.js`).

Each step gets a generated plain-language note (`noteFor(event)`: "40 is added at index 3", "b now refers to the same list as a"); the hand-written demos keep theirs. `// ponytail: O(n²) LCS per list per step, fine at the 50-item cap.`

### Event model changes (`lib/viz/events.ts`, `program.ts`, `scene.ts`, `beat.ts`, `layout.ts`)
- `Val` gains `{ repr: string; type: string }` for values drawn as cards; `formatVal` shows the repr.
- New events: `ref.set { name, to }`, `var.del { name }`, `error { text }`.
- **Locals:** a `Frame` gets `locals: Record<string, Binding>`; `var.set` / `ref.set` / `var.del` land in the top frame when a call is running, else in globals, and names resolve top frame → globals. Frame labels show locals compactly (`factorial(n=3) · total=6`); a local that refers to a list reads `nums → numbers`.
- **Fix:** frames sit on their function's machine by *per-machine* index (today it's the global stack depth, which misplaces frames once two different functions are on the stack). Flight anchors use the same index.
- `layout.ts` caps the scope lane at 12 variables and lists at 6 per demo, with a "+N more" tag, so a big program still frames on screen.

### UI
- **Shared player:** the canvas + timeline + explanation card move out of `components/viz/playground.tsx` into `components/viz/viz-player.tsx` (`<VizPlayer steps code? onLine? />`), used by both `/visualize` and the tab, so they can't drift apart.
- **Tab:** `Visualize` in `components/workspace.tsx`, only when the course runtime is `pyodide`, between Inspect and History. The first time it opens after the code changes, it calls `trace()`; if the code changes later it shows **"Code changed – trace again"** and never re-traces on its own.
- **Editor sync:** the current step's line is lit in Monaco through the existing `highlightLine` prop (`components/code-editor.tsx:93`), the same path the Inspect tab's picked line uses (`components/workspace.tsx:212`).

## Errors and edge cases
- **Syntax error:** no trace. An Empty state says "Fix the syntax error first" and links to the Output tab.
- **Runtime exception:** the last step is `error`, shown in red with the cleaned traceback; scrub back to see what led to it.
- **Truncated:** a banner reads "Showing the first 500 steps".
- **Timeout** (slow code under 500 steps, e.g. one huge `sum(range(10**9))`): the same message as Run; no partial trace.
- **`input()`:** the same error as Run.
- **Unsupported values** render as value cards; nothing throws.
- **Progress:** Visualize never counts as a run and never writes history.

## Testing
- `lib/viz/trace-events.test.ts` (`npm test`), on hand-built snapshots: append, insert at 0, pop from the middle, swap (`a[0], a[1] = a[1], a[0]` → two `array.set`), aliasing `b = a` → `ref.set`, a mutation through the alias, a call with locals, nested calls across two different functions (frames on the right machines), `del`, several changes on one line, prints, and a final exception.
- `lib/viz/trace-py.test.ts` (`npm test`), in real Pyodide: trace a set of programs, convert with `toSteps`, replay the events, and assert the replayed globals and output equal what Python really left (the same guarantee `demos.test.ts` gives the demos). Also: no stdlib frames, a `while True` loop sets `truncated`, self-reference is safe, `except Exception` doesn't swallow the cap.
- **UI:** open a Python lesson, open Visualize, step, and assert the editor's highlighted line follows the steps; screenshots in light, dark and at 390 px.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Out of scope (later)
- Control flow on real code (gates, loop cursor) via `sys.monitoring` BRANCH_LEFT/BRANCH_RIGHT events.
- Dicts, sets, tuples, objects and nested lists as animated structures; reference connections from function locals.
- Other languages.

## Reference
- sys.settrace: https://docs.python.org/3.14/library/sys.html#sys.settrace
