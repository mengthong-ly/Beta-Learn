# Runtimes

Six ways a learner's code runs. `runtime` in `lib/courses.ts` picks one.

| `runtime` | Courses | Where it runs | Entry point |
| --- | --- | --- | --- |
| `pyodide` | Python | a browser worker | `public/python.worker.js` |
| `react` | React | a sandboxed iframe | `public/react-preview.html` |
| `ts` | TypeScript, Claude Code | a browser worker, then a sandboxed iframe | `public/ts.worker.js`, `public/ts-run.html` |
| `php` | PHP, Laravel | a browser worker (php-wasm) | `public/php.worker.js` |
| `cpp` | C++ | a browser worker (clang in wasm, then WASI) | `public/cpp.worker.js` |
| `local` | Dart, Flutter | the learner's machine, in a local copy only | `lib/local-runner.ts` via `POST /api/run` |

Nothing runs on the deployed host, and **the website never calls the learner's machine**
([ADR-0002](adr/0002-browser-runtimes.md)). On the website, `local` courses are write-only
(`useCanRun` in `lib/runner.ts`); they run in a local copy (`npm run dev`).

Browser runtimes live in module workers served unbundled from `/public`, one per runtime
(`WORKERS` in `lib/runner.ts`), all speaking the same protocol: `ready`, `phase`, `line`, `done`
(plus `compiled` from the TypeScript worker). `warm(runtime)` boots a course's worker when its page
opens. A busy worker can't be interrupted, so Stop and timeouts terminate it and spawn a fresh one.

## Pyodide (Python)

`public/python.worker.js` loads Pyodide 314 (CPython 3.14) from the jsDelivr CDN.

- It is served **unbundled from `/public`** and created as a *module* worker. Turbopack would
  bundle it as a classic script, which Pyodide 314 refuses to run. Don't move it into `app/` or
  `lib/`, and keep the `turbopackIgnore` comment in `lib/runner.ts`.
- Every run gets a fresh globals dict, so lessons can't leak state into each other.
- Practice datasets (`public/data/*.csv`) are rewritten into Python's working directory before
  every run, so a lesson that overwrites one can't break the next.
- `input()` throws a helpful error instead of hanging — there's no stdin.
- pandas and numpy download from the Pyodide CDN on first import. That's the `installing` phase.
- `print("x", end="!")` would otherwise sit in Pyodide's buffer until a later run, so the worker
  explicitly `flush()`es and `fsync()`s both streams after each run.
- It pulls roughly 10 MB on first boot.

### The Inspect tab

`public/inspect.py` runs inside the same interpreter and returns JSON: disassembled bytecode per
code object, plus each variable's type, `repr`, `id`, refcount, size and mutability.
`lib/opcodes.ts` turns opcode names into the explanations shown in `components/inspect-pane.tsx`.
Inspect is Python-only.

### The Visualize tab

The worker also accepts `{ type: "trace", id, code }`: the same setup as a run, executed under
`__trace__` from `public/inspect.py` (a `sys.settrace` snapshot per line of the learner's code,
at most 500, with stdout captured). Its messages carry `job: "trace"` and the id, so `trace()`
in `lib/runner.ts` keeps them apart from Run and never touches the Output tab or history.
`lib/viz/trace-events.ts` turns the snapshots into visualizer steps.

## React (sandboxed iframe)

`public/react-preview.html` loads in an iframe with `allow-scripts` only, so it has an opaque
origin and can't touch the app. The parent posts `{ code, check }`; the page transpiles with
Sucrase, imports React from esm.sh, renders the `export default` component into `#root`, runs the
check against the live DOM, and posts `{ type: "line" | "done", … }` back.

`lib/runner.ts` registers the frame with `setPreviewFrame()` and ignores messages from any other
source. Stopping a runaway render loop means unmounting the iframe.

## TypeScript and Claude Code (TypeScript 6 in the browser)

TypeScript 7 has no browser build yet, so lessons are checked by **TypeScript 6.0.3** with
`stableTypeOrdering`, which prints diagnostics the way TS 7 does. Swap it for the TS 7 WebAssembly
build once 7.1 ships.

- `scripts/build-ts-assets.mjs` (run by `dev`, `build` and `check:content`) writes the gitignored
  `public/generated/ts/`: `typescript.mjs` (TS 6 wrapped as an ES module), `libs.json` (the
  `lib: ["esnext", "dom"]` declaration files) and `mcp-types.json` (the MCP SDK's and zod's types).
- `public/ts-compile.js` type-checks and emits `main.ts` (and the check wrapper, `check.ts`) in
  memory with the old tsconfig: strict, `nodenext`, `noEmitOnError`. Errors read like
  `tsc --pretty false`: `main.ts(3,7): error TS2322: …`.
- `public/ts.worker.js` runs that compiler and posts `compiled`; `lib/runner.ts` then mounts
  `ScriptFrame` (`components/preview-pane.tsx`), a hidden sandboxed iframe loading
  `public/ts-run.html`. It imports the emitted JavaScript from blob URLs, prints values the way
  Node's `util.inspect` would, resolves `@modelcontextprotocol/sdk` and `zod` from esm.sh (pinned,
  sharing one zod), and reports `line` / `done` like the React preview.
- Check helpers: `output`, `expect()`, `lesson.*`.

## PHP and Laravel (php-wasm in the browser)

`public/php.worker.js` loads WordPress Playground's PHP 8.5.10 WebAssembly build
(`@php-wasm/web-8-5`) **from jsDelivr**. It's GPL-2.0-or-later, so we don't bundle or host it. The
package's loader imports its `.wasm` the way a bundler would, so the worker fetches the loader and
points that import at the CDN file.

- The 21 MB module compiles once per worker. Each run then gets a **fresh PHP instance** (~30 ms)
  and runs the php CLI once, so nothing leaks between runs.
- `public/php-run.js` holds the local runner's ini settings (`display_errors=stderr`, assertions
  on) and check wrapper (`$output`, `expect()`), shared with `check-content`.
- **Laravel** lessons copy a production-only Laravel 13 app into the instance
  (`public/laravel-app.json.gz`, ~5,700 files, ~70 ms) and boot it with
  `thonglearn-run.php`: SQLite `:memory:` migrated per run, array cache and session, and `visit()`
  for requests through the HTTP kernel. About 400 ms a run.
- The snapshot is built by `node --no-warnings scripts/build-laravel-snapshot.ts` (needs `php`
  and `composer`) and committed, because Vercel has no PHP. Re-run it after upgrading Laravel.

## C++ (clang in WebAssembly)

`public/cpp.worker.js` loads [`@yowasp/clang`](https://github.com/YoWASP/clang) (LLVM 22, ISC) and
[`@bjorn3/browser_wasi_shim`](https://github.com/bjorn3/browser_wasi_shim) (MIT) from jsDelivr.
Each run compiles the lesson to a `wasm32-wasi` program and runs it under WASI, which is where its
`std::cout` and `std::cerr` come from. Compiling and running live in `public/cpp-run.js`, which
`scripts/check-content.ts` imports too, so the website and the check judge lessons identically.

- The toolchain is **~23 MB brotli** (a 75 MB `llvm.core.wasm` and a 30 MB sysroot tar), downloaded
  on the **first compile**, not at boot, and cached by the browser after that. That run reports the
  `installing` phase ("Downloading clang"); later runs take about 1.5 s.
- **There are no exceptions.** The sysroot's libc++ is built without them (no `__cxa_throw`), so
  everything compiles `-fno-exceptions`: a failed `at()` traps instead of throwing, and a lesson
  can't `try`/`catch`. Two lessons say so where it matters. This is the one thing a desktop
  compiler does differently, and the reason the course stayed local until now
  ([ADR-0003](adr/0003-cpp-in-the-browser.md)).
- The check is compiled **with** the lesson: `lesson.hpp` is the learner's file with `main` renamed
  `lesson_main` (same lines, so diagnostics keep their numbers), and `check.cpp` calls it with
  `std::cout` redirected into a `std::ostringstream`. Checks get `output` and `expect()`, and can
  call the lesson's own functions and types. `expect()` prints the verdict and exits rather than
  throwing.
- Renaming `main` costs it main's implicit `return 0`, which would turn "falls off the end" into a
  trap, so **check builds only** add `-fno-strict-return`.
- When a check build fails, the lesson is recompiled alone with `-fsyntax-only` and *that* error is
  reported, so the learner never sees the wrapper's cascading errors.
- `printf` goes straight to WASI's stdout, so it shows in the output but is invisible to `output`
  in a check. Lessons use `std::cout`.

## Local runner (Dart, Flutter)

**Read [ADR-0001](adr/0001-local-runner.md) before touching anything here.** It is the security
model, not background reading. It only runs in a local copy: the website never calls it.

```
browser  ──POST /api/run { course, code, check? }──►  app/api/run/route.ts
                                                            │ guard.ts: 3 checks
                                                            ▼
                                                     lib/local-runner.ts
                                                            │ temp dir, timeout, output cap
                                                            ▼
                                                     lib/sandbox.ts  (OS sandbox)
                                                            │
                                                            ▼
                                                     c++ / dart / flutter
```

### The guard

Every request must pass all three (`app/api/run/guard.ts`):

1. `LOCAL_RUNNER=1`, which only `npm run dev` sets — and it also binds the server to
   `127.0.0.1`, so other machines on the network can't connect.
2. A loopback `Host` header, which blocks DNS rebinding.
3. The custom header `x-thonglearn-run: 1`. It forces a CORS preflight, which is never
   approved, so no other website can post to the runner.

`/api/flutter` skips check 3 (an iframe can't send custom headers on its own subresource loads)
but keeps 1 and 2, and it refuses any path that escapes `runtimes/flutter/build/web`.

### The sandbox

`lib/sandbox.ts` wraps every process with `@anthropic-ai/sandbox-runtime` — `sandbox-exec` on
macOS, bubblewrap on Linux. A run's output goes straight back to the page, so **anything it can
read, it can leak**. Hence:

- **Reads:** `$HOME` is denied except `runtimes/`, the toolchains themselves and `~/.pub-cache`.
  That keeps out `~/.ssh`, other projects and this repo's `.env*`.
- **Writes:** only the directories that run's runner names.
- **Network:** none. (`flutter test` is the exception: its test device talks over a loopback
  socket, so that one run gets `allowLocalBinding`.)
- **Env:** an allowlist only (`ENV_KEYS`). The server's `DATABASE_URL` and auth secrets never
  reach a run.

If the sandbox can't start — Windows, or Linux without bubblewrap — **nothing runs**. That's
deliberate. `THONGLEARN_UNSANDBOXED=1` turns it off for local debugging.

### Per-course behaviour

| Course | How | Timeout | Check helpers |
| --- | --- | --- | --- |
| `dart` | `dart --enable-asserts` on the file directly | 30 s | `output`, `expect()`, `lesson.*` |
| `flutter` | `flutter test` when there's a check, `flutter build web` otherwise | 300 s | a `testWidgets` body |

Two recurring patterns:

- **Checks run in a generated wrapper**, not in the learner's file. The wrapper imports or
  includes the lesson, captures its output, runs the check, and prints
  `@@thonglearn-check {"pass":…}` on stderr. `settle()` pulls that line out of the output and
  turns it into the verdict.
- **Error lines are mapped back to the learner's file**, out of whatever file the toolchain
  actually compiled.

Flutter is the awkward one. It uses a single shared project (`runtimes/flutter`), so runs are
serialized through `serially()`. The SDK's `dart` and `flutter` wrappers write stamps into the
SDK on every call and the SDK must stay read-only, so `findLaunchers()` asks them once, outside
the sandbox, what they'd finally exec, and the sandbox calls that directly. The tool gets a
private `HOME` at `runtimes/.flutter-home`. A failed build restores the previous `main.dart` so
the Preview tab keeps showing the last working app.

### `runtimes/`

Generated by `npm run setup:runtimes`, gitignored, safe to re-run (existing sandboxes are kept):

- `runtimes/flutter` — `flutter create --platforms web`

Dart needs nothing beyond `dart` on your PATH. `runtimes/laravel` is only the
source of the Laravel snapshot: `scripts/build-laravel-snapshot.ts` creates it when missing.

Delete the whole folder and re-run the script if it gets into a bad state.

### Environment

| Variable | Set by | Effect |
| --- | --- | --- |
| `LOCAL_RUNNER=1` | `npm run dev` | without it, every runner route returns 403 |
| `THONGLEARN_UNSANDBOXED=1` | you, for debugging | skips the OS sandbox |
| `THONGLEARN_SANDBOX_READ` | you | extra `PATH`-separated read paths, for a toolchain in an unusual place |

## Troubleshooting

**"This course runs on your computer, and the local runner is off."** The dev server was started
without `LOCAL_RUNNER=1` (use `npm run dev`, not `next dev`).

**No Run or Check button for Dart or Flutter on the website.** By design: those courses are
write-only there ([ADR-0002](adr/0002-browser-runtimes.md)). Run a local copy.

**A TypeScript, PHP or Laravel run says it's loading for a while.** The first run downloads the
runtime from jsDelivr / esm.sh (TypeScript ~3 MB, PHP ~6 MB, the Laravel app ~5 MB, clang ~23 MB).
If a CDN is unreachable, those courses can't run.

**`/setup` says a tool is missing that you have installed.** The status endpoint resolves tools
from `PATH` as the dev server sees it. Version managers that only patch your interactive shell
(asdf, mise, nvm) often aren't on that `PATH` — start the dev server from a shell where
`which dart` works.

**Runs fail with a sandbox message.** On Linux: `sudo apt install bubblewrap socat`. Windows isn't
supported. If a toolchain lives somewhere the sandbox can't read, add it to
`THONGLEARN_SANDBOX_READ`.

**A Flutter run takes ~15 s.** Each one is a full `flutter build web`. A persistent
`flutter run -d web-server` with hot reload is the upgrade path if that becomes a problem.

**Verify the runner itself:** `npm run check:runner` exercises output, error lines and check
verdicts for each toolchain and prints which ones pass.
