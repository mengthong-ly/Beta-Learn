# ADR-0001: Run non-browser languages on the learner's own toolchain

**Status:** Accepted, 2026-09-22

## Context

ThongLearn ran all code in the browser (Pyodide). Research (`.design/thonglearn/research/courses-research.md`) showed the new courses can't all do that:

- Dart and Flutter compile only on Google's DartPad backend, whose embed API is no longer supported.
- Laravel needs a whole app: Composer's `vendor/`, an HTTP kernel and a database.
- TypeScript 7 (the Go port) ships native binaries only, with no browser build and no stable API before 7.1.

## Decision

A **local runner** runs PHP, Laravel, TypeScript, C++, Dart and Flutter with the learner's real toolchains, through `POST /api/run` (`lib/local-runner.ts`). React stays in the browser: a sandboxed iframe with Sucrase, plus React from esm.sh (`public/react-preview.html`). Python stays in Pyodide.

The runner executes arbitrary code on the machine, so every request must pass all of these checks (`app/api/run/guard.ts`):

1. `LOCAL_RUNNER=1` is set. Only `npm run dev` sets it, and it also binds to `127.0.0.1`, so other machines on the network can't connect.
2. The `Host` header is `localhost`, `127.0.0.1` or `[::1]`, which blocks DNS rebinding.
3. The custom header `x-thonglearn-run: 1` is present. That forces a CORS preflight, which we never approve, so no other website can post to the runner.
4. Each run gets its own temp directory, a timeout, an output cap and a process-group kill.

## Consequences

- Courses that run locally only work when ThongLearn runs on your own machine (`npm run setup:runtimes` once, then `npm run dev`). A hosted copy shows "the local runner is off" for those courses.
- `npm run check:content` verifies every course against the real toolchains, so a toolchain upgrade that breaks a lesson fails the check.
- Each Flutter run is a full `flutter build web` (~15 s). A persistent `flutter run -d web-server` with hot reload is the upgrade path if that's too slow.
- React checks run against a live DOM, so `check:content` only transpiles and server-renders React lessons. The checks themselves are verified in the browser.
