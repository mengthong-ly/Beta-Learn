@AGENTS.md

# ThongLearn

Programming course app (Python, PHP, Laravel 13, TypeScript, React, Dart, Flutter). Python runs in the browser via Pyodide and React in a sandboxed iframe. The other courses run on the learner's own toolchains through the opt-in local runner (`lib/local-runner.ts`, `/api/run`, see `docs/adr/0001-local-runner.md`). There is no other server-side code execution.

## Tech stack

| Layer           | What we use                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------------- |
| Framework       | Next.js 16.3 (App Router, Turbopack), React 19.2, TypeScript 5                                 |
| Styling / UI    | Tailwind v4 (`app/globals.css`, no config file), shadcn/ui (`radix-nova` style), lucide-react, motion |
| Editor          | Monaco via `@monaco-editor/react` (loaded from CDN)                                            |
| Python runtime  | Pyodide 314 (CPython 3.14) in `public/python.worker.js`, which is an unbundled **module** worker. Inspect data comes from `public/inspect.py` |
| Storage         | Dexie over IndexedDB (`lib/db.ts`), browser only: history, progress, drafts                    |
| Content         | Markdown in `content/lessons/*.md` and `content/guide/*.md`, parsed by `lib/lesson-parser.ts`, `lib/content.ts`, `lib/docs.ts` |
| Design docs     | `.design/thonglearn/`                                                                          |

Commands: `npm run dev` (turns on the local runner and binds to 127.0.0.1), `npm run setup:runtimes` (run once: creates the TypeScript 7, Laravel 13 and Flutter sandboxes in `runtimes/`), `npm run lint`, `npm run typecheck`, `npm run check:content [-- course…]` (runs every lesson and guide example for real), `npm run check:runner`, `npm run build`.

Native apps (Capacitor 8, `ios/` and `android/`): the apps load the running Next.js server from `server.url` in `capacitor.config.ts` (default is the dev server; set `CAP_SERVER_URL` for release). Run `npx cap sync` after changing config or plugins, then `npx cap open ios|android`. On Android, run `adb reverse tcp:3000 tcp:3000` first.

## Rules

### 1. Always read the documentation first

- **Next.js:** read the relevant guide in `node_modules/next/dist/docs/` before writing any Next.js code. This version differs from your training data.
- **Every other library** (React, Tailwind v4, shadcn, Pyodide, Dexie, Monaco, motion, react-markdown, next-themes, and so on): fetch the current docs with Context7 (`resolve-library-id`, then `query-docs`) before using an API. Do this even when you think you know it.
- Follow deprecation notices. Match the versions installed in `package.json`, not the latest version you remember.

### 2. Base every lesson on an official reference

- Before you write or edit anything in `content/lessons/` or `content/guide/`, check the facts against official Python sources:
  - https://docs.python.org/3/ (tutorial, library reference, language reference)
  - https://docs.python.org/3/whatsnew/ for behavior specific to 3.14
  - https://peps.python.org/ for the reasons behind a feature
- Use WebFetch on docs.python.org. Do not rely on memory for semantics, defaults, edge cases or error messages.
- Other courses: use the official sources listed per course in `.design/thonglearn/research/courses-research.md` (php.net, laravel.com/docs/13.x, typescriptlang.org, react.dev, dart.dev, docs.flutter.dev).
- Add a short "Reference" link to the official page you used at the end of each lesson or guide chapter.
- After you change content, run `npm run check:content`. Every example must run in real Python.

### 3. Always use the global skills in `~/.claude/skills`

Before starting a task, find the skill that fits it and invoke it with the Skill tool. If more than one fits, run the process skill first and the implementation skill second. When you delegate to subagents, tell each one which skill to invoke.

| Task                                  | Skills                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------- |
| New feature or behavior change        | `superpowers:brainstorming`, then `superpowers:writing-plans`              |
| Bug or failing check                  | `superpowers:systematic-debugging` / `diagnosing-bugs`                     |
| Tests / verification                  | `tdd`, `superpowers:verification-before-completion`, `webapp-testing`      |
| Lesson or guide research              | `research`, `context7-mcp`                                                 |
| Review before finishing               | `code-review`, `simplify`                                                  |
| Parallel work across agents           | `superpowers:dispatching-parallel-agents`, `superpowers:subagent-driven-development` |

### 4. Use skills for both UI and backend work

**UI** (`app/`, `components/`, `globals.css`):

- Components: `shadcn` (add components through the shadcn CLI, never hand-roll them in `components/ui/`)
- Build: `frontend-design`, `senior-frontend`, `impeccable`
- Polish: `make-interfaces-feel-better`, `emil-design-eng`, `better-ui`
- Motion: `improve-animations`, `vercel-react-view-transitions`
- Accessibility: `accessibility`, `web-design-guidelines`
- Design process: `design-brief`, `design-review`, `design-tokens`

**Backend / runtime** (`lib/`, `public/python.worker.js`, `public/inspect.py`, `scripts/`, Dexie, the content pipeline):

- Structure: `codebase-design`, `clean-code`
- Debugging: `superpowers:systematic-debugging`, `diagnosing-bugs`
- Tests: `tdd`, `superpowers:test-driven-development`
- Library APIs (Pyodide, Dexie, Next.js route/server APIs): `context7-mcp` and rule 1

## Project gotchas

- Keep `public/python.worker.js` as a plain module worker. Turbopack bundles workers as classic scripts, and Pyodide 314 rejects those.
- Lesson challenges use fenced blocks named `<lang> starter`, `<lang> solution` and `<lang> check`, where `<lang>` is the course's `lang` in `lib/courses.ts`. A fence in that lang is a runnable example (it gets **Try it** and is checked); use `<lang>-snippet` for fragments. Check helpers per runtime: Python has `__stdout__`; PHP and Laravel have `$output` and `expect()` (Laravel also has `visit()`); TypeScript and Dart have `output`, `expect()` and `lesson.*`; React has `$`, `$$`, `click`, `type`, `tick` and `expect()`; Flutter check blocks are a `testWidgets` body. In the guide, `> 🔍 **Behind the scenes: …**` renders as a collapsible and `> 🧭 **Scenario:**` renders as a card.
- Lesson files are ordered by their numeric prefix (`NN-slug.md`). When you renumber lessons, update every cross-link.

## Agent skills

### Issue tracker

Local markdown: specs and tickets live under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
