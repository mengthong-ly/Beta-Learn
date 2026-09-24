# ADR-0004: Trace C++ for the Visualize tab by rewriting the source

**Status:** Accepted, 2026-09-24.

## Context

The Visualize tab replays a learner's own program step by step. For Python it records the run with `sys.settrace` (`__trace__` in `public/inspect.py`): a snapshot of every frame's variables at each line. C++ runs as a `wasm32-wasi` program compiled by clang in the browser ([ADR-0003](0003-cpp-in-the-browser.md)), and nothing in it can observe its own lines or variables.

Options, measured with `@yowasp/clang` in Node:

| | |
| --- | --- |
| clang's JSON AST (`-Xclang -ast-dump=json`) | the dump includes every declaration in the std headers: over 4 GB for a 10-line program, and V8 ran out of memory. `-ast-dump-filter` cuts it to 0.5–1.3 MB, but it matches names by substring, so a function called `size` pulls in half of libc++. |
| DWARF (`-g`) and a debugger | the line table is there, but reading locals means evaluating DWARF location expressions and types in JavaScript, which is a debugger. |
| rewrite the source, then compile it | tree-sitter-cpp finds statements, declarations and functions; C++ overloads work out each variable's type. |

## Decision

`public/cpp-trace.js` parses the learner's file with tree-sitter-cpp (`web-tree-sitter` 0.27 and `tree-sitter-cpp` 0.23.4 from jsDelivr, about 1 MB compressed, loaded on the first trace) and inserts calls into a small runtime header, without changing any line's number:

- before every statement, `__viz::line(N, {the variables in scope})`: each is a pointer plus a serializer the compiler picks by type
- `__viz::Frame` at the top of each function body, method and constructor: a snapshot on entry and on exit
- `return e;` becomes `return __vf.result(e);` for scalars, strings, vectors, references and pointers. Wrapping a class-type return would turn copy elision into a copy or move and change what the program prints.
- a `friend` printer per class, so structs and classes show field by field, private fields included

Each snapshot reaches JavaScript through a wasm import (`viz.snap`), which also records how much stdout has been written. The snapshots use Python's shape, so `lib/viz/trace-events.ts` and the whole visualizer are shared. C++ values keep C++ spelling (`true`, `'x'`, `"hi"`, `{1, 2}`) because they arrive as cards; `toSteps(…, "cpp")` words the notes for C++ (vector, cout, "goes out of scope").

## Consequences

- Every C++ lesson and guide example traces. `npm run check:content -- cpp` traces each one and requires it to print what Run prints, except code that measures time with `<chrono>`, since recording adds time.
- A trace compiles once (~1.4 s), like a run. When the recording build doesn't compile, the plain file is checked on its own: its error is shown if it has one, otherwise "The visualizer can't follow this program yet."
- Limits:
  - `constexpr` functions run but don't open a frame, because a snapshot isn't a constant expression.
  - Lambdas run within their line.
  - Class templates show as a type-name card.
  - Pointers show as addresses, and an `int&` shows as a value, not an alias.
  - A class-type return shows its type (`Widget{…}`) instead of its value.
  - A global changed inside a function isn't redrawn, because the event model binds names in the running frame.
- Local variables are shown as they were at the frame's last snapshot once the function returns (they're destroyed by then); `this` and the parameters are read live, so a method's last change to `*this` still shows.
- Two fixes in the shared code came out of this and apply to Python too:
  - `toSteps` diffs a caller's frame against its own last snapshot, so a change made through a callee (a dict, `*this`) gets a step.
  - `toSteps` treats a `return` snapshot as ending its frame even when the next call lands at the same depth (`f() + g()`, `fib(n - 1) + fib(n - 2)`).
  - The layout stacks one machine per function instead of drawing them all at the same spot, and parses node ids that contain `::`.
