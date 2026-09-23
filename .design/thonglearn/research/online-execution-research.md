# Running the local-runner courses without the learner's computer

Researched 2026-09-23. "Measured" means `npm view`, a tarball streamed through gzip/brotli, or a live API call timed by hand. **UNVERIFIED** marks what still needs a prototype.

Decisions taken from this (see `docs/adr/0002-browser-runtimes.md`): TypeScript and Claude Code run on `typescript@6.0.3` in the browser; PHP and Laravel run on `@php-wasm/web` 8.5; Dart, Flutter and C++ stay write-only on the website and run on the learner's own toolchains in a local copy.

## Corrections to courses-research.md and ADR-0001

- **Dart and Flutter have an in-browser compiler in preview.** [`package:dartpad`](https://github.com/dart-lang/sdk/tree/main/pkg/dartpad) 0.0.7 (pub.dev, 2026-09-19, BSD-3) is "a dart2wasm compiled Web Worker" with an in-memory file system, the analyzer, DDC and a subset of `pub`. It ships Dart **3.14.0-edge** and Flutter **3.48.0-1.0.pre**, and includes `flutter_test` since 0.0.4 ([changelog](https://pub.dev/packages/dartpad/changelog)). It speaks JSON-RPC over a `MessagePort` (`doc/worker-protocol.md`).
- **DartPad's embed still works, unofficially.** The wiki says the embed API is unsupported ([Embedding Guide](https://github.com/dart-lang/dart-pad/wiki/Embedding-Guide)), but `?embed=true&run=true` plus `postMessage({type:'sourceCode'})` is handled ([embed/web.dart](https://github.com/dart-lang/dart-pad/blob/main/pkgs/dartpad_ui/lib/app/embed/web.dart)) and dart.dev uses it ([embedded_dartpad.dart](https://github.com/dart-lang/site-www/blob/main/site/lib/src/components/dartpad/embedded_dartpad.dart)). It sends no output back to the host, so checks can't run through it.
- **Laravel runs in the browser.** [Liminal](https://github.com/aschmelyun/liminal) (MIT, 2026) boots Laravel 13 on `@php-wasm/web-8-4` from a zipped `composer install --no-dev` app, SQLite, and `HttpKernel->handle()`. playwithlaravel.com now redirects elsewhere.
- **TypeScript 7 in WebAssembly is coming.** Draft WASI build: [TypeScript#64174](https://github.com/microsoft/TypeScript/pull/64174). Draft TS 7 playground: [TypeScript-Website#3653](https://github.com/microsoft/TypeScript-Website/pull/3653). The [7.1 iteration plan](https://github.com/microsoft/TypeScript/issues/63703) lists "Publish wasm (wasip1?) Build", with stable planned for 2026-11-24. An unofficial [`tsgo-wasm`](https://github.com/sxzz/tsgo-wasm) 7.0.2 exists.
- **Measured:**
  - `typescript@6.0.3` `lib/typescript.js`: 9.1 MB raw, 1.64 MB gzip, 1.29 MB brotli.
  - PHP 8.5.10 wasm: 21 MB raw, 7.8 MB gzip, 5.7 MB brotli.
  - Monaco 0.56.0 (pinned in `components/code-editor.tsx`) bundles TypeScript **5.9.3**.

## Summary

| Course | Best option | Size / latency | Fidelity | License / terms | Cost | Main risk |
|---|---|---|---|---|---|---|
| TypeScript (14) | `typescript@6.0.3` in a worker, run JS in a sandboxed iframe | ~1.3–1.6 MB + lib `.d.ts` ~0.37 MB gzip | Same check results; error text matches TS 7 with `stableTypeOrdering` | Apache-2.0 | $0 | Drift from TS 7 |
| Claude Code (25) | Same, plus MCP SDK 1.30.0 and zod 4.6.5 as ESM and their `.d.ts` (685 KB + 367 KB) | SDK bundle **UNVERIFIED** | Same SDK code; runnable blocks use `InMemoryTransport` and web transports only | MIT | $0 | ajv uses `new Function` |
| PHP (22) | `@php-wasm/web-8-5` in a module worker | 5.7 MB brotli; startup **UNVERIFIED** | Exact: PHP 8.5.10 | GPL-2.0-or-later | $0 | License; first load |
| Laravel (11) | Same, plus a prebuilt Laravel snapshot | +~5.1 MB gzip; boot **UNVERIFIED** | Real Laravel 13.32, SQLite `:memory:` | MIT + GPL | $0 | Boot speed; ~8k files |
| C++ (1) | Vercel Sandbox or Compiler Explorer API | CE ~3.8 s per run; YoWASP ~27 MB gzip | Sandbox/CE exact; YoWASP has no exceptions | CE has no third-party policy | Sandbox ~$0.78 / 1k runs | Policy, size |
| Dart (16) | DartPad backend compile, or Vercel Sandbox | Compile ~0.5 s; SDK JS 2.6 MB gzip | Web semantics (`12.0` prints `12`, no `dart:io`) | Google ToS, undocumented API | $0 / ~$0.78 per 1k | Undocumented API |
| Flutter (10) | Vercel Sandbox for `flutter test`; DartPad for preview | ~10–20 s per test **UNVERIFIED** | Exact in the Sandbox | Google ToS | ~$2.5 / 1k tests | Cost, latency |

## Per course

### PHP 8.5
- `@php-wasm/web` 3.1.55 (WordPress Playground, GPL-2.0-or-later). One package per PHP version: `@php-wasm/web-8-5` ships PHP 8.5.10 in `jspi/` and `asyncify/` builds, ~21 MB each. Skip the 30.8 MB `icu.dat` (only `intl` needs it).
- API ([README](https://www.npmjs.com/package/@php-wasm/web)): `new PHP(await loadWebRuntime('8.5'))`, `php.writeFile()`, `php.runStream({scriptPath})`.
- Built-in extensions include pdo_sqlite, sqlite3, mbstring, openssl, tokenizer, ctype, fileinfo, session, dom ([Dockerfile](https://github.com/WordPress/wordpress-playground/blob/trunk/packages/php-wasm/compile/php/Dockerfile); [extensions](https://developer.wordpress.org/playground/developers/apis/javascript-api/php-extensions/)).
- Playground says PHP "must run in a web worker" ([browser concepts](https://developer.wordpress.org/playground/developers/architecture/browser-concepts/)).
- `@php-wasm/node-8-5` 3.1.55 exists, so the same runtime can verify lessons in Node.
- Alternative: [seanmorris/php-wasm](https://github.com/seanmorris/php-wasm) (Apache-2.0, PHP 8.0–8.5).
- Hosted APIs are too old: Wandbox tops out at PHP 8.3.12, Judge0 CE at 8.3.11; the pipe-operator lesson needs 8.5.

### Laravel 13
- Liminal's [`usePhp.ts`](https://github.com/aschmelyun/liminal/blob/main/src/composables/usePhp.ts): unzip `app.zip` into the wasm FS → `require vendor/autoload.php` → bootstrap → `HttpKernel->handle(Request::create(...))`. Its [`_headers`](https://github.com/aschmelyun/liminal/blob/main/public/_headers) set COOP/COEP; whether php-wasm needs them is **UNVERIFIED**.
- Measured from `runtimes/laravel` (laravel/framework 13.32.0): without dev packages and `tests/` the app is a 46 MB tar, 5.1 MB with `gzip -9`. Carbon's language files (3.3 MB raw) can go too.
- Lessons use routes, middleware, CSRF, resources, JSON responses, Blade, sessions: all in-process, no network, no subprocesses.

### TypeScript 7
- `typescript@7.0.2` ships native binaries only; "TypeScript 7.0 does not yet ship with an API" ([announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)).
- `tsgo-wasm@7.0.2` is unofficial (49 MB raw, 8.7 MB brotli) and needs a Node-style `fs` shim, e.g. [`@ttsc/wasm`](https://ttsc.dev/docs/wasm/).
- TS 5.9.3 prints unions in declaration order, while TS 7 orders them deterministically; TS 6.0's `--stableTypeOrdering` matches 7.0 ([TS 6.0 notes](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/)). Checks assert on runtime behaviour, so pass/fail results match.

### Claude Code (MCP)
- Runnable blocks import only `@modelcontextprotocol/sdk` (`client/index.js`, `server/mcp.js`, `inMemory.js`, `types.js`, `client/streamableHttp.js`, `server/webStandardStreamableHttp.js`) and `zod`. Stdio transports appear only in `typescript-snippet` blocks.
- Those SDK modules have no `node:` imports in 1.30.0. esm.sh serves them.
- **UNVERIFIED:** `crypto.randomUUID` (lesson 18) inside a sandboxed, opaque-origin iframe.

### C++
- YoWASP clang 22 (ISC): 22.8 MB + 4.3 MB gzip, libc++ with C++23 headers, but built with `LIBCXX_ENABLE_EXCEPTIONS=OFF` ([build.sh](https://github.com/YoWASP/clang/blob/develop/build.sh)), which breaks the check wrapper.
- Wasmer clang: ~100 MB ([blog](https://wasmer.io/posts/clang-in-browser)); `@wasmer/sdk` has a modified MIT license and needs COOP/COEP.
- [Compiler Explorer API](https://github.com/compiler-explorer/compiler-explorer/blob/main/docs/API.md) executes code (`filters.execute`), CORS open, but has no stated third-party policy.
- [Wandbox](https://github.com/melpon/wandbox) allows lectures and commercial use with per-IP limits. Judge0 hosted plans: €27–107/month ([judge0.com](https://judge0.com/)). [Piston](https://github.com/engineer-man/piston) closed its public API on 2026-02-15.

### Dart 3.13
- DartPad backend: `stable.api.dartpad.dev/api/v3/version` reports Dart 3.13.4 / Flutter 3.47.5; routes `analyze`, `compileDDC`, `compileNewDDC` ([common_server.dart](https://github.com/dart-lang/dart-pad/blob/main/pkgs/dart_services/lib/src/common_server.dart)). Measured: compile 0.53 s, analyze 0.47 s. Terms: Google's general ToS ([dart.dev/terms](https://dart.dev/terms)); no public contract.
- On the web, `1.0` prints as `1` ([number representation](https://dart.dev/resources/language/number-representation)), and only multi-platform `dart:*` libraries work ([DartPad docs](https://dart.dev/tools/dartpad)). `DART_CHECK` uses `dart:io`, and lessons 03/04 depend on VM number printing.

### Flutter 3.47
- Widget tests compile on the DartPad backend; running them in a browser frame is **UNVERIFIED**. `package:dartpad`'s Flutter set is ~31.5 MB gzip.
- The Flutter web preview costs ~9 MB gzip plus CanvasKit (~2.9 MB gzip).

## Vercel Sandbox (server-side option, not taken)
- Firecracker microVMs "designed for untrusted code" ([concepts](https://vercel.com/docs/sandbox/concepts)); `deny-all` network policy ([firewall](https://vercel.com/docs/sandbox/concepts/firewall)); custom `linux/amd64` OCI images ([images](https://vercel.com/docs/sandbox/concepts/images)); snapshots expire after 30 days unused.
- Pro pricing ([pricing](https://vercel.com/docs/sandbox/pricing)): $0.128 per vCPU-hour, $0.0212 per GB-hour with 1-minute minimums, $0.60 per million creations. Hobby: 5,000 creations and 10 concurrent sandboxes a month.
- Estimate: ~$0.72–0.78 per 1,000 runs (1 vCPU, 2 GB, fresh sandbox per run); Flutter tests ~$2.5 per 1,000.

## Still UNVERIFIED
php-wasm startup and Laravel boot times; whether php-wasm needs cross-origin isolation; MCP SDK bundle size via esm.sh; YoWASP compile speed; Vercel Sandbox cold starts; `flutter_test` inside DartPad; Compiler Explorer third-party policy.
