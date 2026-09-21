# Design Brief: PyLearn

## Problem

I want to learn Python fast, but tutorials split reading from doing. I read a concept in one tab and try it in another tool, and whatever I tried is gone once I close it. It's slow, and I can't see whether I'm improving.

## Solution

A single workspace in the spirit of Claude Code desktop. The lesson reads like a Notion page, a real VS Code editor sits right below it, and a live output pane on the right shows the code compiling and running as it happens. Every run is kept, so the history of attempts becomes a record of progress.

## Experience Principles

1. **Run early, run often.** The editor is always one keypress (⌘↵) away, and every example has "Try it".
2. **Short explanation, live example.** Prose stays under a screen per concept; the example does the teaching.
3. **Calm chrome, lively feedback.** The interface stays still. Motion is reserved for compile, run and result.

## Aesthetic Direction

- **Philosophy**: Notion's clean editorial system (see `DESIGN.md`) inside a Claude Code desktop shell.
- **Tone**: calm, focused, encouraging.
- **Reference points**: Notion pages and callouts; Claude Code desktop (sidebar sessions, main pane, toggleable side pane, ⌘K); the VS Code editor.
- **Anti-references**: gamified kids' coding sites, loud gradients, dashboard clutter.

## Existing Patterns

Greenfield. The foundation is the shadcn `radix-nova` preset:
- **Typography**: JetBrains Mono across the whole UI and in code, at your request. It replaces Notion Sans, which is proprietary.
- **Colors**: the Notion tokens in `DESIGN.md`, mapped to shadcn CSS variables in `src/index.css`. The dark palette is derived.
- **Spacing**: Tailwind's 4px scale, matching the Notion spacing tokens.
- **Components**: shadcn Sidebar, Resizable, Tabs, Command, Button, Badge, Empty, Kbd, Tooltip, Sonner, Collapsible, Spinner.

## Component Inventory

| Component | Status | Notes |
| --- | --- | --- |
| App shell (Sidebar + resizable panes) | New | `App.tsx`; mobile collapses to Lesson / Code / Output tabs |
| App sidebar | New | lessons by section with n/total progress; history grouped Today / Yesterday / Earlier |
| Lesson doc | New | react-markdown; tinted callouts; code blocks with "Try it" |
| Code editor | New | Monaco, bundled locally, with Notion light/dark themes, ⌘↵, error-line decoration |
| Output pane | New | step list (Loading Python → Compiling → Running), shimmer bar, staggered lines, status bar, check result |
| History list | New | shared by the sidebar and the right-pane History tab |
| Command menu | New | ⌘K: lessons, playground, recent runs |

## Key Interactions

- **Run (⌘↵)**: a shimmer bar sweeps in and the steps tick through Compiling → Running. Output lines stream in, then fade and slide up 30ms apart. A status badge pops in (Success / Error / Timed out / Stopped) with the time taken.
- **Error**: the traceback shows in a red block, cleaned of Pyodide's internal frames, and the failing line is highlighted in the editor.
- **Check**: runs the code, then the lesson's hidden asserts. A pass shows a mint card, marks the sidebar ✓ and offers a toast with "Next lesson". A failure shows a peach card with the assert message.
- **Stop (⌘.) / 10s timeout / 2,000-line limit**: the worker is terminated and a new one starts on its own.
- **History**: clicking any run opens `#/run/:id` and restores that run's code, output and error highlight.

## Responsive Behavior

- **Wide screens (≥ 768px)**: sidebar, then the main area (lesson above editor, resizable vertically), then the right pane (resizable and collapsible with ⌘\).
- **Mobile (under 768px)**: the sidebar becomes a Sheet; the main area becomes Lesson / Code / Output tabs. "Try it" jumps to Code and Run jumps to Output.

## Accessibility Requirements

- The output pane is `aria-live="polite"` and `aria-busy` while running.
- Every icon-only button has an `aria-label`, and every tooltip shows its keyboard shortcut.
- All motion honors `prefers-reduced-motion`.
- Text contrast is AA on both themes. Muted `#787671` on white is about 4.6:1.

## Out of Scope

Accounts and cloud sync, an AI tutor, pip packages, `input()` (it needs SharedArrayBuffer), multi-file projects, and deployment.
