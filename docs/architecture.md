# Architecture

For the dependency-by-dependency inventory, see [tech-stack.md](tech-stack.md).

## Overview

ThongLearn is a **content-driven app with no application database in the critical path**. Lessons
are Markdown files read at build time; learner data lives in the browser; code execution is
pushed to the edges — a browser worker, a sandboxed iframe, or the learner's own machine. The
deployed server renders pages and nothing else.

```
┌─ BROWSER ────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  Workspace (persistent client shell)                                         │
│  ┌────────────┬──────────────────────┬──────────────────────────┐            │
│  │  Sidebar   │  Document            │  Monaco editor           │            │
│  │  sections  │  (server-rendered)   │  (CDN, client-only)      │            │
│  │  lessons   │                      ├──────────────────────────┤            │
│  │  guide     │                      │ Output │ Inspect │       │            │
│  │  quizzes   │                      │ Preview│ History │       │            │
│  └────────────┴──────────────────────┴──────────┬───────────────┘            │
│                                                 │                            │
│                    lib/runner.ts  ◄─────────────┘  one run at a time,        │
│                    (module store, useSyncExternalStore)   app-wide           │
│                          │                                                   │
│         ┌────────────────┼─────────────────────┐                             │
│         ▼                ▼                     ▼                             │
│   ┌───────────┐   ┌─────────────┐        (HTTP, localhost only)              │
│   │ Pyodide   │   │ React iframe│              │                             │
│   │ worker    │   │ sandboxed,  │              │                             │
│   │ CPython   │   │ Sucrase +   │              │                             │
│   │ 3.14      │   │ esm.sh      │              │                             │
│   └───────────┘   └─────────────┘              │                             │
│                                                │                             │
│   ┌─────────────────────────────┐              │                             │
│   │ Dexie / IndexedDB           │              │                             │
│   │ runs · progress · drafts    │              │                             │
│   │ quizzes · reads             │              │                             │
│   └──────────┬──────────────────┘              │                             │
└──────────────┼─────────────────────────────────┼─────────────────────────────┘
               │ POST /api/sync                  │ POST /api/run
               │ (only when signed in)           │ (only when LOCAL_RUNNER=1)
               ▼                                 ▼
┌─ NEXT.JS SERVER ─────────────┐   ┌─ LEARNER'S MACHINE ──────────────────────┐
│                              │   │                                          │
│  App Router (RSC)            │   │  app/api/run/guard.ts   3 checks         │
│    app/[course]/…            │   │            ▼                             │
│    static, dynamicParams off │   │  lib/local-runner.ts    temp dir,        │
│                              │   │            ▼            timeout, caps    │
│  lib/content.ts  ◄── content/│   │  lib/sandbox.ts         OS sandbox:      │
│    read once per process     │   │            ▼            no net, no $HOME │
│                              │   │  php · c++ · dart · node · flutter       │
│  lib/auth.ts (better-auth)   │   │                                          │
│  lib/merge.ts (pure)         │   │  runtimes/  typescript · laravel ·       │
│         │                    │   │             flutter  (generated)         │
│         ▼                    │   └──────────────────────────────────────────┘
│  Prisma ──► PostgreSQL       │     Same process as the dev server, but only
│  optional: accounts only     │     ever reachable from 127.0.0.1.
└──────────────────────────────┘
```

Four properties follow from this shape, and most design decisions trace back to one of them:

1. **Content is files, not rows.** `lib/content.ts` reads `content/` once per server process and
   caches it; every lesson page is statically generated (`dynamicParams = false`). A content
   change is a rebuild, and `npm run check:content` is its test suite.
2. **The browser owns learner data.** Dexie is the source of truth. An account is a merged copy,
   never a replacement, so the app works fully signed out and a stale client can't undo progress.
3. **Nothing untrusted runs on our server.** Python runs in a browser worker, React in an
   `allow-scripts` iframe, and everything else on the learner's own machine behind three guard
   checks and an OS sandbox. The deployed host executes no lesson code at all — see
   [ADR-0001](adr/0001-local-runner.md).
4. **One run at a time, app-wide.** Run state is a module-level store in `lib/runner.ts`, not
   React state, so it survives navigation between lessons.

## The shape of the app

Everything a learner does happens inside one persistent **workspace**: a sidebar, a document, an
editor and an output pane. Navigating between lessons swaps the document without unmounting the
editor, so your code and your output survive the move.

```
app/[course]/layout.tsx      ──► components/workspace.tsx   (client, persistent)
  │                                 ├── AppSidebar          sections, lessons, guide, quizzes
  │                                 ├── {children}          the document (server-rendered)
  │                                 ├── CodeEditor          Monaco, loaded from CDN, client-only
  │                                 └── Output | Inspect | Preview | History tabs
  └── app/[course]/lesson/[slug]/page.tsx  ──► components/doc.tsx
```

The layout is a server component: it reads the course's content (cached per server process) and
hands `lessons` + `guide` to the workspace as props. Course and lesson routes set
`dynamicParams = false` with `generateStaticParams`, so every page is known at build time. Panel sizes and sidebar state come from cookies so
the server renders them and a refresh doesn't jump.

### Routes

| Route | What it is |
| --- | --- |
| `/` | landing page |
| `/courses` | course picker |
| `/[course]` | course home |
| `/[course]/lesson/[slug]` | a lesson (prose + challenge) |
| `/[course]/guide`, `/[course]/guide/[chapter]` | the Guide Book (Python only today) |
| `/[course]/playground` | blank scratchpad |
| `/[course]/quiz/[id]` | a section quiz (`2`) or the final (`final`) |
| `/[course]/run/[id]` | replays a saved run from IndexedDB |
| `/setup` | which toolchains this machine has (calls `/api/runtime`) |
| `/login` | sign-in / sign-up |

`/lesson/:slug`, `/guide`, `/playground` and `/run/:id` permanently redirect to their `/python`
equivalents (`next.config.ts`) — Python lived at the root before the app had courses.

### API routes

| Route | Purpose |
| --- | --- |
| `POST /api/run` | runs one lesson on a local toolchain. Guarded — see [ADR-0001](adr/0001-local-runner.md) |
| `GET /api/runtime`, `POST /api/runtime` | toolchain status for `/setup`; POST cleans one cache |
| `GET /api/flutter/[[...path]]` | serves the last `flutter build web` to the Preview tab |
| `/api/auth/[...all]` | better-auth handler |
| `POST /api/sync` | merges browser data into the signed-in account and returns the merged set |

All of `/api/run`, `/api/runtime` and `/api/flutter` go through `app/api/run/guard.ts`. Nothing
there is reachable unless `LOCAL_RUNNER=1`.

## Courses are data

`lib/courses.ts` is the single source of truth. A course exists once it's listed there and has a
`content/<id>/lessons` folder.

```ts
{
  id: "dart", name: "Dart", mark: "Da",
  tagline: "…",
  runtime: "local",     // "pyodide" | "local" | "react"
  lang: "dart",         // the Markdown fence name AND the Monaco language
  file: "main.dart",    // filename shown above the editor
  comment: "//",
  hello: "void main() { … }",   // the playground's starting code
  extra: true,          // optional: listed apart from the language courses
}
```

`runtime` decides which of the three execution paths a Run press takes; see
[runtimes.md](runtimes.md). `lang` is what makes ```` ```dart starter ```` work in a lesson file,
so changing it changes every lesson in that course.

Adding a course = one entry here + a `content/<id>/lessons/` folder. If `runtime` is `"local"`,
also add the course to `LOCAL_COURSES` and a `runLocal` case in `lib/local-runner.ts`, a timeout
in `TIMEOUT`, and a row in `requirements()` in `lib/runner-status.ts`.

## Content pipeline

Markdown on disk → parsed once per server process → rendered as a document, with the challenge
pulled out into the editor.

```
content/<course>/lessons/NN-slug.md
  └─ lib/content.ts      reads the folder (server-only), sorted by filename
       └─ lib/lesson-parser.ts   splits frontmatter / prose / starter / solution / check / quiz
            └─ lib/docs.ts       keys, hrefs, grouping into sections, quiz docs
                 └─ components/doc.tsx    react-markdown + remark-gfm, "Try it" buttons
```

`lib/content.ts` reads every course at module load and caches it for the process's lifetime —
content only changes on rebuild. It's `server-only`; never import it from a client component.

Key identifiers, all from `lib/docs.ts`:

- **`docKey(doc)`** — a doc's key inside its course. Guide chapters get a `guide:` prefix so a
  chapter and a lesson can share a slug.
- **`storageKey(course, key)`** — `"python/print"`. This is what IndexedDB and Postgres store, so
  renaming a lesson file orphans that learner's progress.
- Lesson order comes from the numeric filename prefix (`01-print.md`). Renumbering means updating
  every cross-link by hand.

## Run state

`lib/runner.ts` is a module-level store — not React state — exposed through
`useSyncExternalStore`. One run at a time, app-wide.

```
run(code, check, course)
  ├─ pyodide → postMessage to public/python.worker.js
  ├─ react   → the Preview iframe renders it and posts results back
  └─ local   → POST /api/run
                    ↓
       RunState { status, phase, lines[], ms, error, errorLine, check, inspect, preview }
                    ↓
       useRunner() → OutputPane / InspectPane / PreviewPane
```

Two details worth knowing before you touch it:

- Output lines are flushed once per animation frame (`set(patch, false)`), because a loop can
  print thousands of lines a second. A run caps at 2 000 lines and 10 s in the browser.
- A busy Pyodide worker can't be interrupted without `SharedArrayBuffer`, so **Stop** terminates
  the worker and spawns a fresh one. The local runner instead aborts the fetch, and the route
  kills the whole process group.

## Client state and storage

| Where | What | Module |
| --- | --- | --- |
| IndexedDB (Dexie) | run history, progress, drafts, quiz results, lessons read | `lib/db.ts` |
| Postgres (Prisma) | the same, minus run history, for signed-in learners | `prisma/schema.prisma` |
| Cookies | sidebar open, panel sizes | `app/[course]/layout.tsx` |
| `localStorage` | theme (next-themes), focus timer | `components/theme-provider.tsx`, `components/focus-timer.tsx` |

Dexie is always the source of truth. An account is a merged copy. See
[accounts-and-storage.md](accounts-and-storage.md).

## Conventions

- **Read the docs first.** Next.js 16 differs from training data — read
  `node_modules/next/dist/docs/` before writing Next.js code. For every other library, fetch
  current docs with Context7. This is enforced by `CLAUDE.md` rule 1.
- **shadcn components** are added through the shadcn CLI, never hand-written into
  `components/ui/`. Style is `radix-nova`; Tailwind v4 with no config file (`app/globals.css`).
- **Pure logic goes in `lib/` with a `*.test.ts` next to it** (`merge`, `quiz`, `stats`,
  `focus-timer`). Those run under `node --test` with no framework and no DOM. Anything needing a
  browser or a toolchain is covered by `check:content` / `check:runner` instead.
- **Erasable TypeScript, no path aliases** in `lib/local-runner.ts`, `lib/sandbox.ts`,
  `lib/runner-status.ts` and `scripts/*` — Node executes those files directly.
- **`public/python.worker.js` stays a plain module worker.** Turbopack bundles workers as classic
  scripts and Pyodide 314 rejects those, hence the `/* turbopackIgnore: true */` on the `new
  Worker` call.
