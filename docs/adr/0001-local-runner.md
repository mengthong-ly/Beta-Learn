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
3. The custom header `x-thonglearn-run: 1` is present. That forces a CORS preflight, which we approve only for the origins in `RUNNER_ORIGINS`, so no other website can post to the runner. The list is empty unless the learner opts in with `npm run dev:hosted`, which trusts `https://beta-learn.vercel.app`.
4. Each run gets its own temp directory, a timeout, an output cap and a process-group kill.
5. Each run is inside an OS sandbox (`lib/sandbox.ts`, `@anthropic-ai/sandbox-runtime`: `sandbox-exec` on macOS, bubblewrap on Linux). A run's output goes back to the page, so anything it can read, it can leak. The sandbox therefore enforces:
   - **Reads:** nothing under `$HOME` except `runtimes/`, the toolchains and `~/.pub-cache`. That keeps out `~/.ssh`, other projects and this repo's `.env*`.
   - **Writes:** only the run's own directories.
   - **Network:** none.
   - **Environment:** only an allowlist of variables, so the server's secrets never reach a run.

   If the sandbox can't start (Windows, or Linux without bubblewrap), nothing runs. `THONGLEARN_UNSANDBOXED=1` turns it off for local debugging, and is refused whenever `RUNNER_ORIGINS` is set.

## Consequences

- Courses that run locally need ThongLearn running on the learner's machine (`npm run setup:runtimes` once, then `npm run dev`). To use the hosted copy instead, the learner runs `npm run dev:hosted`, and the hosted copy calls that runner at `http://127.0.0.1:3000` from their browser (`runnerUrl` in `lib/runner.ts`). It shows "the local runner is off" when it can't reach the runner.
- Residual risk: whoever controls a trusted origin's code can still run code on the learner's machine, but only inside the sandbox. It can use CPU for up to the timeout, write into `runtimes/`, and read the toolchains. It can't read the learner's files or secrets or reach the network. On macOS, a `flutter test` run may connect to localhost ports, because the test device talks over a loopback socket and srt only allows that for all of localhost.
- The Flutter SDK's `dart` and `flutter` scripts write stamps into the SDK on every call, and the SDK must stay read-only. So the sandbox asks them once, outside, for what they finally run, and calls that directly. The Flutter tool gets a private `HOME` (`runtimes/.flutter-home`) for its own state.
- `npm run check:content` verifies every course against the real toolchains, so a toolchain upgrade that breaks a lesson fails the check.
- Each Flutter run is a full `flutter build web` (~15 s). A persistent `flutter run -d web-server` with hot reload is the upgrade path if that's too slow.
- React checks run against a live DOM, so `check:content` only transpiles and server-renders React lessons. The checks themselves are verified in the browser.
