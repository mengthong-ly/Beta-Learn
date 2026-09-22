# React: full curriculum

Status: claimed
Blocked by: Phase A (done)

## What
Write the full React course, about **34 lessons** and **6 guide chapters**, following the official structure:

react.dev/learn, in order: Quick Start and Thinking in React, then Describing the UI (Your First Component … Your UI as a Tree), Adding Interactivity (Responding to Events … Updating Arrays in State), Managing State (Reacting to Input … Scaling Up with Reducer and Context), Escape Hatches (Refs … Custom Hooks). Skip the install/setup/compiler pages. Guide: a reference (rendering model, rules of hooks, state as a snapshot, effects lifecycle, keys and identity, React 19 APIs such as use/actions where documented).

## Runtime & check helpers
Runtime: React 19.3 in the browser (Sucrase transpile, TSX allowed). Every runnable example and solution is a module with `export default function App()` (or another component name), importing hooks from `react`. Check helpers run in the preview iframe after render: `$(sel)`, `$$(sel)`, `await click(el)`, `await type(input, value)`, `await tick(ms)`, `expect(ok, msg)`, `output` (console.log lines) and `root`. `npm run check:content -- react` only transpiles and server-renders (checks need a DOM), so **also verify each challenge in a browser**: run `LOCAL_RUNNER=1 npx next dev -H 127.0.0.1 -p <free port>`, open the lesson, press Show solution then Check, and confirm the starter fails.

## Conventions (all courses)

- **Files:** `content/react/lessons/NN-slug.md` numbered `01…`, plus a guide in `content/react/guide/NN-slug.md`. Keep the existing `01-*.md` tracer lesson, revising it if needed.
- **Lesson frontmatter:**
  ```
  ---
  title: Short title
  section: N · Section name
  ---
  ```
  Sections group lessons in the sidebar, and each one mirrors a chapter of the official docs.
- **Guide frontmatter:** `title`, `section: Guide Book`, and a one-line `summary`. Each guide chapter needs **at least 3** runnable examples. `> 🔍 **Behind the scenes: …**` renders as a collapsible and `> 🧭 **Scenario:**` as a card.
- **Lesson shape:** short prose (explain *why*), runnable examples, then `## Challenge` with `> 🎯 **Challenge:** …` and three fenced blocks: `tsx starter`, `tsx solution`, `tsx check`. The starter must NOT pass the check; the solution must.
- **Runnable examples** are fences in the course lang (```tsx), which get a "Try it" button and are executed by the checker. Use ```tsx-snippet for fragments that aren't whole programs, and `bash`/`text`/`yaml`/`blade` for anything else. An example that is *meant* to fail must contain the comment `// error!`.
- **Every file ends with** `**Reference:** [Page title](official URL)` linking the official page the content is based on.
- **Facts come only from the official docs**, via WebFetch (CLAUDE.md rule 2). Never rely on memory for semantics, defaults, error messages or version-specific behaviour. Target the installed versions: React 19.3 in the browser (Sucrase transpile, TSX allowed).
- **Voice:** match `content/python/lessons/*.md`: short, friendly, concrete, one idea per section, and 💡 tips sparingly.
- **Done when** `npm run check:content -- react` prints "All content passes". Only touch `content/react/` and this ticket file. If the runner itself seems wrong, stop and report it; don't change `lib/` or `scripts/`.

## Comments
