# Course research: Dart, Flutter, PHP, Laravel 13, TypeScript, React

Researched 2026-09-22 against primary sources (official docs, official repos, npm registry). Anything not confirmed from a primary source is marked **UNVERIFIED**.

## Summary

| Course | Official source to base lessons on | Stable version | Browser runtime (no server of ours) | Offline? | Risk |
|---|---|---|---|---|---|
| Dart | dart.dev/language + dart.dev/learn/tutorial | Dart 3.13 | DartPad iframe (compiles on Google's `dart_services` backend) | No | Medium: depends on Google's backend; embed API "no longer supported", only gist iframes |
| Flutter | docs.flutter.dev/learn/pathway (18 steps) | Flutter 3.47.2 | DartPad iframe with Flutter (same backend) | No | High: heavy iframe; the pathway is project-based and needs a local SDK |
| PHP | php.net/manual/en/langref.php (23 chapters) | PHP 8.5 (8.5 released 2025-11-20) | `@php-wasm/web` 3.1.55 (WordPress Playground), PHP 5.2 to 8.5 | Yes | Low–medium: GPL-2.0-or-later licence; large download |
| Laravel 13 | laravel.com/framework/docs (13.x sidebar) | Laravel 13 (2026-03-17), needs PHP ≥ 8.3 | No realistic full-framework runtime; plain PHP via php-wasm only | Partial | High: framework needs Composer vendor, HTTP server and DB |
| TypeScript | typescriptlang.org Handbook | TS 7.0.2 (npm `latest`) | `typescript@6.0.3` JS compiler in a Worker (TS 7 has no JS or browser build) | Yes | Medium: lessons would teach TS 7 but check on the 6.0 engine |
| React | react.dev/learn (4 "Learn React" chapters, 34 pages) | React 19.3.0 (2026-09-09) | Transpile JSX (TS 6 `transpileModule` or `esbuild-wasm`) and render in a sandboxed iframe; react/react-dom as local ESM via an import map | Yes | Low–medium |

### Surprises (contradict common assumptions)

- **TypeScript 7 (stable 2026-07-08) is the native Go port. The npm package now ships only per-platform native binaries** (`optionalDependencies: @typescript/typescript-darwin-arm64 …`, 2.5 MB unpacked). There is no `typescript.js` to load in a browser, and a stable programmatic API is expected "at least several months later with TypeScript 7.1". The last JS compiler is **6.0.3** (24 MB unpacked).
- **DartPad compiles on a server.** The repo's `dart_services` package is "the backend service for DartPad". The old embed API is "no longer supported by DartPad", and the lightweight-embed issue (#2702) was **closed as not planned**. Dart and Flutter cannot run offline or without Google's backend.
- **Laravel's docs moved** to `laravel.com/framework/docs/...`, and 13.x is current. Laravel 13 needs **PHP 8.3–8.5**.
- **`@php-wasm/web` is GPL-2.0-or-later.** Every other runtime here is MIT, Apache-2.0 or BSD.

---

## Dart

**Version:** Dart 3.13 (shown on dart.dev/language).

**Official curriculum, dart.dev/language sidebar:**
1. Introduction · Variables · Operators · Comments
2. Types: Built-in types, Records, Collections, Generics, Typedefs, Type system
3. Patterns: Overview & usage, Pattern types, Applied tutorial
4. Control flow: Loops, Branches, Error handling
5. Functions · Metadata · Libraries & imports
6. Classes & objects: Classes, Constructors, Primary constructors, Methods, Extend a class, Mixins, Enums, Dot shorthands, Extension methods, Extension types, Callable objects
7. Class modifiers: Overview & usage, For API maintainers, Reference
8. Concurrency: Overview, Asynchronous programming, Isolates
9. Null safety: Sound null safety, Understanding null safety
10. Dart keywords · Language versioning

Beginner tutorial: dart.dev/learn/tutorial ("build an interactive CLI app"). Its chapter list was not exposed on the index page (**UNVERIFIED** chapter titles).

**Runtime options**
- **DartPad iframe** (`https://dartpad.dev/?id=<gist-id>`): the only official embed. The code comes from a GitHub gist, and compiling happens on `dart_services`. The embedding guide says: "The form of embedding previously documented here is no longer supported by DartPad." Licence BSD-3-Clause.
  - Pros: official, real Dart.
  - Cons: needs the network, lesson code must live in gists, there's no hook for our Check or Inspect, and we can't write drafts back.
- **In-browser compiler:** none official. dart2js and dart2wasm run in the Dart SDK, not in a browser (**UNVERIFIED** that no maintained in-browser compiler exists).
- **Read-only:** syntax-highlighted examples with no Run button.

**Recommendation:** start read-only with a "Open in DartPad" link per example (a URL, not an embed). Revisit if Google ships a new embed.

**Sources:** https://dart.dev/language · https://dart.dev/learn · https://github.com/dart-lang/dart-pad · https://github.com/dart-lang/dart-pad/wiki/Embedding-Guide · https://github.com/dart-lang/dart-pad/issues/2702

## Flutter

**Version:** Flutter 3.47.2 (docs.flutter.dev/learn).

**Official curriculum, "Dart and Flutter getting started" pathway** (docs.flutter.dev/learn/pathway). It requires the Dart tutorial first.
1. Quick install
2. Introduction to Flutter UI: Tutorial intro, Create a Flutter app, Widget fundamentals, Layout widgets on a screen, DevTools, Handle user input, Stateful widgets, Implicit animations
3. State in Flutter apps: The state management project, Make HTTP requests, `ChangeNotifier`, `ListenableBuilder`
4. Flutter UI 102: Advanced UI features, Adaptive layouts, Scrolling and slivers, Stack-based navigation
5. How Flutter works

Beyond the pathway: the App Architecture guide (MVVM; UI layer, data layer, DI, testing) and topic sections for UI, data & backend, testing, performance and deployment.

**Runtime:** the same DartPad backend, which supports Flutter (**UNVERIFIED** from a primary source in this pass; the README doesn't say). There's no offline option.

**Recommendation:** Flutter comes after Dart. Make it read-only with widget-tree diagrams and screenshots, plus "Open in DartPad" links. Its lessons can't have auto-checks.

**Sources:** https://docs.flutter.dev/learn · https://docs.flutter.dev/learn/pathway

## PHP

**Version:** 8.5 is the newest branch (released 2025-11-20; active support until 2027-12-31, security until 2029-12-31). 8.2 to 8.5 are supported. Each branch gets 2 years of active support plus 2 years of security fixes.

**Official curriculum, PHP Manual Language Reference:** Basic syntax · Types · Variables · Constants · Expressions · Operators · Control Structures · Functions · Classes and Objects · Namespaces · Enumerations · Errors · Exceptions · Fibers · Generators · Attributes · References Explained · Predefined Variables · Predefined Exceptions · Predefined Interfaces and Classes · Predefined Attributes · Context options and parameters · Supported Protocols and Wrappers.

**Runtime options**
- **`@php-wasm/web` 3.1.55** (WordPress/wordpress-playground; "PHP.wasm for the web"). It ships per-version builds `@php-wasm/web-5-2` through `web-8-5`, so we can load **only 8.5**. Licence **GPL-2.0-or-later**. The whole package is 31.5 MB unpacked because it includes every PHP version. The size of one version's `.wasm` is **UNVERIFIED**; measure it in a prototype. Web Worker support needs confirming in a prototype (**UNVERIFIED**).
- seanmorris/php-wasm: not checked in this pass (**UNVERIFIED**).

**Auto-check:** run the student's code, then a `check` PHP snippet that uses `assert()` or throws. This mirrors Python's `check` blocks.

**Recommendation:** use php-wasm (8.5 only) in a module worker, following the `python.worker.js` pattern. Decide whether the GPL licence is acceptable.

**Sources:** https://www.php.net/manual/en/langref.php · https://www.php.net/supported-versions.php · npm registry `@php-wasm/web` (version, licence, deps, size via `npm view`)

## Laravel 13

**Version:** Laravel 13, released 2026-03-17. Bug fixes until Q3 2027, security fixes until 2028-03-17. PHP 8.3–8.5. Laravel ships a major version yearly (~Q1). New in 13: the AI SDK, JSON:API resources, `PreventRequestForgery`, queue routing, expanded attributes, `Cache::touch`, vector search.

**Official curriculum, 13.x docs sidebar:**
- Prologue: Release Notes, Upgrade Guide, Contribution Guide
- Getting Started: Installation, Configuration, Agentic Development, Directory Structure, Frontend, Starter Kits, Deployment
- Architecture Concepts: Request Lifecycle, Service Container, Service Providers, Facades
- The Basics: Routing, Middleware, CSRF Protection, Controllers, Requests, Responses, Views, Blade Templates, Asset Bundling, URL Generation, Session, Validation, Error Handling, Logging
- Digging Deeper: Artisan Console, Broadcasting, Cache, Collections, Concurrency, Context, Contracts, Events, File Storage, Helpers, HTTP Client, Images, Localization, Mail, Notifications, Package Development, Processes, Queues, Rate Limiting, Search, Strings, Task Scheduling
- Security: Authentication, Authorization, Email Verification, Encryption, Hashing, Password Reset
- Database: Getting Started, Query Builder, Pagination, Migrations, Seeding, Redis, MongoDB
- Eloquent ORM: Getting Started, Relationships, Collections, Mutators/Casts, API Resources, Serialization, Factories
- AI: AI SDK, MCP, Boost
- Testing: Getting Started, HTTP Tests, Console Tests, Browser Tests, Database, Mocking
- Packages: Cashier, Dusk, Envoy, Fortify, Folio, Horizon, Octane, Passport, Pennant, Pint, Precognition, Prompts, Pulse, Reverb, Sail, Sanctum, Scout, Socialite, Telescope, Valet …

Laravel Bootcamp / Learn: laravel.com/learn exists and wasn't explored (**UNVERIFIED**).

**Runtime:** there's no credible source for running a full Laravel app in browser php-wasm (**UNVERIFIED** either way). It would need Composer's `vendor/`, a request pipeline and SQLite, which is a large download for a lesson. The realistic option is read-only framework lessons. A few standalone packages (e.g. `illuminate/collections`) could run in php-wasm, but vendoring them is **UNVERIFIED**.

**Recommendation:** Laravel becomes a read-only course after PHP. Examples are annotated file trees plus code; runnable exercises only where they're plain PHP.

**Sources:** https://laravel.com/docs/13.x · https://laravel.com/framework/docs/releases · https://raw.githubusercontent.com/laravel/docs/13.x/documentation.md

## TypeScript

**Version:** npm `latest` is **7.0.2** (TS 7.0 stable 2026-07-08, the Go native port, ~10× faster). `next` is 7.1.0-dev. The last JS-based compiler is **6.0.3**.

**Official curriculum, the Handbook:** The Basics · Everyday Types · Narrowing · More on Functions · Object Types · Type Manipulation (Creating Types from Types, Generics, Keyof, Typeof, Indexed Access, Conditional, Mapped, Template Literal Types) · Classes · Modules. Then Reference: Utility Types, Decorators, Declaration Merging, Enums, Iterators and Generators, JSX, Mixins, Namespaces, Symbols, Type Compatibility, Type Inference, Variable Declaration. Entry points: "TS for the New Programmer" and "TS for JS Programmers".

**Runtime options**
- **`typescript@6.0.3`** in a module worker. `ts.transpileModule` for running code; a full `createProgram` with a virtual FS (`@typescript/vfs` 1.6.4, MIT) to show **type errors**, the thing a TS course is about. Licence Apache-2.0. Size is large: 24 MB unpacked across the package, and the size of `typescript.js` alone is **UNVERIFIED**, so measure it.
- **TS 7:** no browser build and no stable API until ≥ 7.1. The team says the API arrives "at least several months" later.
- Executing the output: run the JS in a sandboxed Worker and capture `console.log`.

**Auto-check:** a `check` block that asserts on values, plus an "expect no type errors" or "expect error TS2322 on line N" check from the diagnostics.

**Recommendation:** pin TS 6.0.3 in the browser, and teach syntax that's the same in 6 and 7. Flag any 7-only behaviour.

**Sources:** https://www.typescriptlang.org/docs/handbook/intro.html · https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/ · npm registry `typescript`, `@typescript/vfs`

## React

**Version:** React **19.3.0**, released 2026-09-09 (react.dev/versions).

**Official curriculum, react.dev/learn:**
- Get started: Quick Start, Tutorial: Tic-Tac-Toe, Thinking in React. Installation / Setup / React Compiler pages are tooling and not runnable.
- Describing the UI: Your First Component, Importing and Exporting, Writing Markup with JSX, JS in JSX with Curly Braces, Passing Props, Conditional Rendering, Rendering Lists, Keeping Components Pure, Your UI as a Tree
- Adding Interactivity: Responding to Events, State: A Component's Memory, Render and Commit, State as a Snapshot, Queueing State Updates, Updating Objects in State, Updating Arrays in State
- Managing State: Reacting to Input with State, Choosing the State Structure, Sharing State Between Components, Preserving and Resetting State, Reducers, Context, Scaling Up with Reducer and Context
- Escape Hatches: Refs, Manipulating the DOM with Refs, Effects, You Might Not Need an Effect, Lifecycle of Reactive Effects, Separating Events from Effects, Removing Effect Dependencies, Custom Hooks

**Runtime options**
- **Transpile, then run in a sandboxed iframe.** Transpile JSX with TS 6 `transpileModule` (shared with the TS course) or `esbuild-wasm` 0.28.2 (MIT; the npm package is 14.5 MB unpacked). esbuild's browser docs: call `initialize()` with `wasmURL`, and the transform API supports the `jsx`/`tsx` loaders. Then render in a sandboxed `<iframe>` with an import map pointing `react`/`react-dom` at locally hosted ESM builds. Works offline.
- **Sandpack** (`@codesandbox/sandpack-react` 2.20.0, Apache-2.0; react.dev uses it, **UNVERIFIED** from the react.dev repo in this pass). By default it evaluates in a CodeSandbox-hosted bundler iframe, and `bundlerURL` allows self-hosting ("Hosting the Bundler" guide). Heavier, and it duplicates our Monaco editor.

**Auto-check:** query the rendered DOM in the iframe (e.g. `document.querySelector('h1').textContent === 'Hello'`), or run assertions over the exported component.

**Recommendation:** the transpile-plus-iframe option, reusing the TS 6 transpiler. React follows TypeScript.

**Sources:** https://react.dev/llms.txt · https://react.dev/versions · https://esbuild.github.io/api/#running-in-the-browser · https://sandpack.codesandbox.io/docs/advanced-usage/bundlers · npm registry `react`, `esbuild-wasm`, `@codesandbox/sandpack-react`

## Claude Code (extra course)

**Scope:** Claude Code basics, Agent Skills, tool use, MCP and agentic workflows. Listed under "Extra courses" on Home, apart from the language courses.

**Runtime:** the local TypeScript runner (TS 7.0.2 sandbox in `runtimes/typescript`). The sandbox also has `@modelcontextprotocol/sdk` 1.30.0 and `zod` 4.6.5, so MCP lessons run a real server and client in-process over `InMemoryTransport`. Anything that needs an API key or network (Messages API, Agent SDK, stdio and remote servers) appears as `typescript-snippet`, and challenges use a scripted fake model.

**Sources:**
- Claude Code: https://code.claude.com/docs (index https://code.claude.com/docs/llms.txt)
- Claude API, tool use, Agent Skills, MCP connector, evals: https://platform.claude.com/docs/en/home (index https://platform.claude.com/llms.txt)
- MCP: https://modelcontextprotocol.io and the TypeScript SDK (v1.x branch)
- Workflow patterns: https://www.anthropic.com/engineering/building-effective-agents
