# Build Tasks: PyLearn

Generated from: .design/pylearn/DESIGN_BRIEF.md
Date: 2026-09-21

## Foundation
- [x] **Run Python end to end**: the Pyodide worker streams output line by line; Stop and the 10s timeout terminate the worker and start a new one; a 2,000-line limit guards against runaway output. _New: `lib/python.worker.ts`, `lib/runner.ts`, `lib/traceback.ts`._
- [x] **Notion tokens (JetBrains Mono UI)**: `DESIGN.md` mapped into shadcn variables, with a derived dark palette. _Modifies: `src/index.css`._

## Core UI
- [x] **Claude-desktop shell**: sidebar, resizable lesson/editor split, collapsible right pane, header breadcrumb, previous/next. _Reuses: shadcn Sidebar, Resizable._
- [x] **Monaco editor**: bundled locally, Notion themes, ⌘↵, error-line decoration. _New: `code-editor.tsx`._
- [x] **Lesson doc**: markdown, tinted callouts, code blocks with "Try it". _New: `lesson-doc.tsx`._

## Interactions & States
- [x] **Output pane animation**: covers booting, compiling, running, success, error, timeout, stopped, check pass and check fail. _New: `output-pane.tsx`._
- [x] **History**: autosaved runs in Dexie, grouped list, restore through `#/run/:id`, delete. _New: `lib/db.ts`, `history-list.tsx`._
- [x] **Challenges and progress**: Check, sidebar ✓, n/total per section, toast with "Next lesson".
- [x] **Drafts**: editor content autosaved per lesson (400ms debounce).
- [x] **⌘K menu and shortcuts**: ⌘↵ run, ⌘. stop, ⌘K search, ⌘B sidebar, ⌘\ right pane, D theme.

## Content
- [x] **33 lessons in 7 sections**, each verified in real Python by `npm run check:lessons`: the solution passes its check, the starter fails it, and every example runs.

## Responsive & Polish
- [x] **Mobile**: Sheet sidebar; Lesson / Code / Output tabs that switch automatically.
- [x] **Accessibility**: aria-live on the output pane, aria-labels, reduced motion.
- [x] **Design review**: see DESIGN_REVIEW.md (13 findings, all resolved).
