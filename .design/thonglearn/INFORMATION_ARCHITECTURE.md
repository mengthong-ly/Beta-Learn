# Information Architecture: PyLearn

## Site Map

- Root `#/`: redirects to the first incomplete lesson
- Lesson `#/lesson/<slug>`: 33 lessons, e.g. `#/lesson/lists`
- Past run `#/run/<id>`: that run's lesson, with its code and output restored
- Playground `#/playground`: a free scratchpad

## Navigation Model

- **Primary**: the left sidebar (⌘B): Search (⌘K), Playground, then Lessons (7 collapsible sections with progress), then History.
- **Secondary**: the header breadcrumb (Section / Lesson) plus ‹ n/33 › for previous and next.
- **Utility**: the theme toggle in the sidebar footer (or press D), and the right-pane toggle (⌘\).
- **Mobile**: the sidebar opens as a Sheet; the main area uses Lesson / Code / Output tabs.

## Content Hierarchy

### Lesson view (where you spend 80% of your time)
1. Lesson title and section badge: where am I
2. Explanation with runnable examples: learn
3. Editor with Run and Check: do
4. Output: feedback
5. History tab: past attempts

## User Flows

### Learn a lesson
1. Open the app and land on the first incomplete lesson.
2. Read, and press "Try it" on an example to load it into the editor.
3. Run it (⌘↵) and watch the output.
4. Write the challenge solution, then press Check.
   - If it passes, you get a ✓, a toast and a "Next lesson" button.
   - If it fails, you get the assert message; fix the code and check again.
   - If you're stuck, the 💡 button shows the solution.

### Revisit past work
1. Click a run in the sidebar's History or in the right pane's History tab.
2. The code, output and error line are restored, and you can edit and run again.

## Naming Conventions

| Concept | Label in UI | Notes |
| --- | --- | --- |
| One execution | Run | stored in the `runs` table |
| Lesson's graded task | Challenge / Check | the 🎯 callout and the Check button |
| Saved executions | History | grouped Today / Yesterday / Earlier |
| Free scratchpad | Playground | not part of any lesson |

## Component Reuse Map

| Component | Used on | Behavior differences |
| --- | --- | --- |
| HistoryList | sidebar, right-pane History tab | the sidebar shows lesson titles; the tab shows the first line of code |
| OutputPane | every view | fed by live runs or by restored runs |

## Content Growth Plan

- **Lessons**: add a `src/lessons/NN-slug.md` file. The numeric prefix sets the order and the frontmatter `section` groups it. Run `npm run check:lessons` to verify.
- **History**: grows without limit in IndexedDB. The sidebar shows the latest 30, and the ⌘K menu shows the latest 8.

## URL Strategy

- Hash routes, so the app works from any static host or `file://` with no server rewrites.
- The only dynamic segments are the lesson slug (the filename without its number) and the run id.
