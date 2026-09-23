# ADR-0002: Run TypeScript, PHP and Laravel in the browser; the website never calls your machine

**Status:** Accepted, 2026-09-23. Partly supersedes ADR-0001: the local runner now covers only C++, Dart and Flutter.

## Context

ADR-0001 ran every non-Python course on the learner's own toolchains. On the hosted site that meant each learner cloning the repo and letting beta-learn.vercel.app call `http://127.0.0.1:3000` (a CORS bridge, `npm run dev:hosted`), which confused learners and needed a browser permission for local-network access. Research (`.design/thonglearn/research/online-execution-research.md`) found three of those runtimes now work in a browser:

- **TypeScript:** TS 7 has no browser build yet (planned for 7.1), but TypeScript 6.0 with `stableTypeOrdering` prints the same diagnostics TS 7 does for these lessons.
- **PHP:** WordPress Playground's php-wasm ships PHP 8.5.10 as WebAssembly.
- **Laravel:** a production-only Laravel 13 app boots on php-wasm (as the Liminal demo showed).

Dart, Flutter and C++ still need a server or a preview-quality compiler (DartPad's backend, `package:dartpad`, clang in wasm without exceptions).

## Decision

Two modes, with no bridge between them:

- **The website** runs only what a browser can run: Python (Pyodide), React (sandboxed iframe), and now TypeScript, Claude Code, PHP and Laravel. Dart, Flutter and C++ are **write-only** there (`useCanRun` in `lib/runner.ts`): no Run or Check, a "Run it on your computer" guide, and the learning aids below. The website never contacts the learner's machine; `RUNNER_ORIGINS`, CORS and the `dev:hosted`/`runner` scripts are gone.
- **A local copy** (`git clone`, `npm run setup:runtimes`, `npm run dev`) runs everything, the local-runner courses through ADR-0001's guarded runner.

A course uses the same runtime in both modes, so results match.

The new runtimes are module workers in `/public`, speaking the Python worker's protocol (`ready`, `phase`, `line`, `done`), one per runtime (`WORKERS` in `lib/runner.ts`):

- **`ts`** (`public/ts.worker.js`): TypeScript 6.0.3 type-checks and emits in memory with the local runner's old tsconfig (`public/ts-compile.js`). The JavaScript runs in a hidden sandboxed iframe (`public/ts-run.html`, opaque origin) that formats output like Node and imports the MCP SDK and zod from esm.sh. `scripts/build-ts-assets.mjs` prepares TypeScript and the `.d.ts` files in `public/generated/ts` before `dev`, `build` and `check:content`.
- **`php`** (`public/php.worker.js`): `@php-wasm/web-8-5` loads from jsDelivr (GPL-2.0-or-later, so we don't bundle or host it). The wasm compiles once; each run gets a fresh PHP instance running the php CLI (~30–80 ms) with the local runner's ini settings and check wrapper (`public/php-run.js`). Laravel lessons also copy in `public/laravel-app.json.gz` (a production-only app, 4.4 MB, built by `scripts/build-laravel-snapshot.ts` and committed because Vercel has no PHP) and boot it with `thonglearn-run.php` (~400 ms a run).

`npm run check:content` verifies these courses with the same code in Node (`typescript-6`, `@php-wasm/node-8-5`).

For courses that stay write-only, `npm run check:content -- --record <course>` stores each example's and solution's real output in `content/<course>/outputs.json`. Lessons show it as "Predict, then reveal", and the solution button opens a comparison (diff, the solution's output, a checklist from the check's `expect` messages, self-explanation prompts) instead of overwriting the learner's draft (`.design/thonglearn/research/write-only-learning-research.md`).

## Consequences

- 72 of the 99 non-Python lessons run on the website with no install. Only Dart (16), Flutter (10) and C++ (1) need a local copy.
- First run costs a download: TypeScript ~3 MB, PHP ~6 MB, the Laravel app ~5 MB more. Later runs in the same page are fast.
- TypeScript is checked by TS 6, not TS 7. When TS 7.1 publishes its WebAssembly build, swap `typescript-6` for it in `build-ts-assets.mjs` and `ts-compile.js`.
- The PHP runtime and the SDK load from jsDelivr and esm.sh at run time; if a CDN is down, those courses can't run.
- Laravel upgrades mean re-running `scripts/build-laravel-snapshot.ts` and committing the new snapshot.
- Write-only lessons can't be completed (progress still needs a passing Check); their recorded outputs go stale if a toolchain upgrade changes them, until the next `--record`.
