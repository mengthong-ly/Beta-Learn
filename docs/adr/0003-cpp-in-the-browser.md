# ADR-0003: Compile C++ in the browser with clang in WebAssembly

**Status:** Accepted, 2026-09-23. Supersedes ADR-0002's treatment of C++: it is no longer write-only on the website.

## Context

[ADR-0002](0002-browser-runtimes.md) moved TypeScript, PHP and Laravel into the browser and left C++, Dart and Flutter on the learner's own toolchains, write-only on the website. The research behind it (`.design/thonglearn/research/online-execution-research.md`) had already found the option for C++ and rejected it:

> YoWASP clang 22 (ISC): 22.8 MB + 4.3 MB gzip, libc++ with C++23 headers, but built with `LIBCXX_ENABLE_EXCEPTIONS=OFF`, which breaks the check wrapper.

Two things changed. The check wrapper is ours, and it only needed exceptions because `expect()` threw — it can report a failure and exit instead. And the C++ course grew from one lesson to eight, so "you can read it but not run it on the website" now costs a whole course rather than a single page.

Measured before deciding (`@yowasp/clang@22.0.0-git20542-10` from jsDelivr, Apple M-series, Chromium):

| | |
| --- | --- |
| Download | 19.4 MB (`llvm.core.wasm`) + 3.6 MB (sysroot tar) + 23 KB brotli ≈ **23 MB** |
| First run in the browser | ~6.0 s, including that download |
| Later runs | ~1.4 s for a compile, link and run with a check |
| Exceptions | none: the sysroot's libc++ has no `__cxa_throw`, with any of `-fexceptions`, `-fwasm-exceptions` or the default |

## Decision

C++ becomes a browser runtime like Python, TypeScript and PHP: `runtime: "cpp"`, a module worker at `public/cpp.worker.js`, compiling with `@yowasp/clang` and running the result under WASI with `@bjorn3/browser_wasi_shim`, both loaded from jsDelivr. The local runner drops C++ entirely, so there is **one** C++ runtime and the website and a local copy give the same answer — ADR-0002's rule that a course uses the same runtime in both modes.

Everything compiles `-fno-exceptions`. The check wrapper reports its verdict with `std::exit` instead of `throw`. `scripts/check-content.ts` imports the same `public/cpp-run.js` and runs it in Node.

## Consequences

- All eight C++ lessons run on the website with no install: Run, Check, progress and the quizzes. `content/cpp/outputs.json` and its `--record` pass are gone, and only Dart (16) and Flutter (10) are still write-only there.
- **C++ exceptions can't be taught or used.** A failed `.at()` or `std::stoi` stops the program instead of throwing, and no lesson can `try`/`catch`. The strings and vectors lessons say so where they mention throwing. If that becomes unacceptable, the fix is a libc++ built with wasm EH, which means owning an LLVM build.
- The first compile downloads ~23 MB — the heaviest runtime in the app (Python is ~10 MB, PHP ~6 MB). It lands on the first **run**, not on page load, and the browser caches it.
- A run costs ~1.4 s against ~0.7 s for a local `c++`. Compiling is the whole of it; the program itself runs in milliseconds.
- We now depend on a third-party clang build. `@yowasp/clang` is pinned; upgrading it means re-running `npm run check:content -- cpp`.
- `printf` and other stdio go to WASI's stdout, so they appear in the output but are invisible to `output` in a check, which only captures `std::cout`.
