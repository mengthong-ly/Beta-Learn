# C++ in the Visualize tab

**Status:** approved in chat, 2026-09-24.

## Goal

The Visualize tab that Python has, on C++ lessons: step through your own C++ and see variables, vectors, structs, calls, returns and `cout` output. In the browser, on the clang C++ already uses (ADR-0003).

## Approach: instrument the source

C++ has no `sys.settrace`. Rejected: clang's JSON AST (a full dump with the std headers exceeds 4 GB; the name filter is a substring match) and DWARF (a debugger in JS).

`public/cpp-trace.js` parses the learner's file with tree-sitter-cpp and rewrites it:

- before every statement in a block: `__viz_line(N, <vars in scope>)`; a single-statement `if`/`for`/`while` body gets braces
- loop conditions become `(__viz_line(L, …), cond)`, so the header lights every iteration
- each function, method and constructor body opens with `__viz::Frame __vf("Shelf::add", line, {params, this})`: a call now, a return when destroyed. `return e;` becomes `return __vf.ret(e);`
- after each struct/class: a generated `__viz_fields(w, const T&)`, plus a `friend` line inside the class
- globals register into frame 0, so `main()` opens a frame of its own

A prepended header (then `#line 1`) serializes values by overload: numbers, `bool` and `std::string` plain, `char` as a card, `std::vector` and C arrays as lists keyed by address (a `vector&` parameter is an alias), structs as `Book{title: "Dune", pages: 412}`, anything else as a card with its type name.

Each snapshot calls the wasm import `viz.snap(ptr, len)`; JS records it with the stdout length at that moment. The result is Python's `{snaps, truncated, stdout, error, errorLine}`, so `toSteps` and the player are shared.

Limits: 500 steps (the import throws), 10 s timeout, lambdas not stepped into, class templates not printed field by field, pointers shown as addresses, `int&` shown as a value.

Errors: compile the instrumented file; if that fails, compile the plain file. Its error wins; if only the instrumented one fails, "The visualizer can't follow this program yet."

## Integration

- `trace(code, runtime)` in `lib/runner.ts`; the timeout replaces the tracing worker.
- `cpp.worker.js` handles `{type: "trace"}` like `python.worker.js`.
- The Visualize tab shows for `cpp`. `toSteps`/`noteFor` take the language: vector, cout.

## Done when

- rewrite tests and end-to-end replay tests (real clang) pass
- every runnable example in the eight C++ lessons traces without the fallback
- lint, typecheck, test, `check:content -- cpp` pass; lessons 06 and 08 work in the real app
- ADR-0004 and `docs/runtimes.md` updated
