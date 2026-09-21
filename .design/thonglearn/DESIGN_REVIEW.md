# Design Review: PyLearn

Reviewed against: DESIGN_BRIEF.md
Philosophy: Notion's clean editorial system (DESIGN.md) in a Claude Code desktop shell, set in JetBrains Mono
Date: 2026-09-21

## Screenshots Captured

| Screenshot | Breakpoint | Description |
| --- | --- | --- |
| `screenshots/review-lesson-desktop-1280.png` | Desktop (1280×800), light | Dictionaries lesson after a passed challenge |
| `screenshots/review-error-dark-desktop-1280.png` | Desktop (1280×800), dark | "Reading errors" lesson, NameError traceback with the failing line highlighted |
| `screenshots/review-command-menu-desktop-1280.png` | Desktop (1280×800), light | ⌘K menu open |
| `screenshots/review-lesson-tablet-768.png` | Tablet (768×1024), light | Three-pane layout at tablet width |
| `screenshots/review-lesson-mobile-375.png` | Mobile (375×812), light | Lesson tab |

> All screenshots are in `.design/pylearn/screenshots/`. Post-fix captures use the `after-` prefix.

## Summary

The desktop experience matches the brief. Notion's calm surfaces and tinted callouts sit inside a Claude-desktop shell, purple is used only for Run, and the run → output → history loop reads clearly in both themes. The biggest problems are the **tablet layout** (three panes squeezed into 512px) and a handful of **contrast failures** in green, red and muted text. The **editor's font ligatures** also turn `!=` into `≠`, which misleads beginners about what to type.

## Must Fix

1. **Tablet layout breaks (768–1023px)**: the sidebar leaves 512px, which gets split three ways. Code blocks and the output pane scroll sideways and the empty state wraps word by word. See `screenshots/review-lesson-tablet-768.png`. _Fix: use the Lesson / Code / Output tab layout below 1024px, not only below 768px._
2. **Editor ligatures show `≠` for `!=`**: a beginner can't tell what to type. See line 4 in `screenshots/review-lesson-desktop-1280.png`. _Fix: `fontLigatures: false` in `code-editor.tsx`._
3. **Contrast failures (WCAG AA 4.5:1 for small text)**:
   - Muted `#787671` on the sidebar `#f6f5f4`: 4.17. Affects section counts, group labels and history timestamps.
   - Success green `#1aae39` on the mint tint: 2.5. Affects the "Completed" badge, the "Success" badge and "✅ passed".
   - Inline-code red `#eb5757` on the muted background: 3.2.
   - Error text `#e03131` on the error tint: 3.88.
   _Fix: in light mode, muted `#6b6962` (5.05), success `#0f7a2c` (4.65), inline code `#c4302b` (≥4.58 on every tint), destructive `#c92a2a` (4.69), warning `#a8480a` (4.93). This is a deliberate deviation from the DESIGN.md hexes in favor of AA._

## Should Fix

1. **Lesson doc keeps its scroll position between lessons**: opening a new lesson can land you at its bottom. See `screenshots/review-lesson-tablet-768.png`. _Fix: key the scroll container by lesson id._
2. **Mobile header wraps "15 / 33" onto two lines** and truncates the breadcrumb to "Collectio…". See `screenshots/review-lesson-mobile-375.png`. _Fix: hide the section on small screens and `whitespace-nowrap` the counter._
3. **Sidebar truncates lesson titles** ("try / except / fina…") because JetBrains Mono is wider than a proportional font. See `screenshots/review-error-dark-desktop-1280.png`. _Fix: widen the sidebar from 16rem to 17.5rem and add a `title` tooltip._
4. **Heavy default scrollbars** in the lesson doc and code blocks, especially the grey bar on dark. _Fix: thin scrollbars colored with the tokens (`scrollbar-width: thin`, `scrollbar-color` using the border token)._
5. **Hard-coded hex values in `lesson-doc.tsx`** (inline code red, the section badge text) bypass the tokens. _Fix: add `--code-inline` and `--tag-purple-fg` tokens._

## Could Improve

1. **The step list stays after a run** ("Compiling / Running"). It's useful while running but clutter afterwards. _Suggestion: collapse it into one summary line with the badge after completion._
2. **"0 lines" shows in the status bar on errors**, which is noise. _Suggestion: hide the line count when it's 0._
3. **The editor header reads as plain text** ("main.py"). _Suggestion: style it as a VS Code-like file tab with a Python icon, to reinforce the "VS Code" feel from the brief._
4. **The ⌘K menu floats without the modal elevation** that DESIGN.md specifies (Level 4 shadow). _Suggestion: apply the `--shadow-modal` token, which is defined but unused._
5. **Code in callouts**: inline code on tinted callouts gets muted-grey chips that fight the tint. _Suggestion: a translucent white chip inside callouts._

## What Works Well

- **Aesthetic fidelity on desktop**: the tinted callouts (peach gotcha, lavender challenge, mint pass), hairline borders and flat surfaces read as Notion at a glance. Purple is reserved for Run, exactly as DESIGN.md prescribes.
- **Claude-desktop shell**: collapsible sidebar sessions (history grouped by day), the breadcrumb header, and the toggleable right pane with underline tabs all feel familiar and calm.
- **Feedback loop**: step list, streamed output, status badge and the red error line in the editor tie cause to effect well. The traceback is cleaned down to the learner's own frames.
- **Dark mode feels designed, not inverted**: warm greys, tints turned into low-alpha washes, a lightened primary, and matching Monaco themes.
- **Motion and accessibility basics are in place**: `prefers-reduced-motion` is honored everywhere, the output pane is `aria-live`, and icon buttons have labels.

## Resolution (same day)

Every item above was applied and re-verified with fresh screenshots:

| Finding | Fix | Verified in |
| --- | --- | --- |
| Tablet layout | Tab layout below 1024px (`useMediaQuery` in `App.tsx`) | `screenshots/after-lesson-tablet-768.png` (no horizontal overflow) |
| Ligatures | `fontLigatures: false` in Monaco, plus `font-variant-ligatures: none` app-wide (the lesson tables showed `≠` too) | `screenshots/after-lesson-desktop-1280.png` |
| Contrast | New muted / success / destructive / warning / inline-code values, all ≥ 4.5:1 | computed ratios in the review notes |
| Scroll reset | Doc scroller keyed by lesson id | `screenshots/after-lesson-tablet-768.png` (opens at the top) |
| Mobile header | Section hidden below `sm`, counter `nowrap` | `screenshots/after-lesson-mobile-375.png` |
| Sidebar truncation | 17.5rem width plus a `title` tooltip | `screenshots/after-lesson-desktop-1280.png` |
| Scrollbars | Thin scrollbars using the border token | all `after-` shots |
| Hard-coded hex | `--code-inline` and `--tag-purple-fg` tokens | `lesson-doc.tsx` |
| Step list clutter | Shown while running, lingers 0.7s with its checkmarks, then folds | `screenshots/after-run-settling-desktop-1280.png` → `after-run-done-desktop-1280.png` |
| "0 lines" | Line count hidden when 0 | — |
| Editor header | VS Code-style `main.py` tab with a file icon | `screenshots/after-lesson-desktop-1280.png` |
| ⌘K elevation | `shadow-modal` on the command dialog | — |
| Callout code chips | Translucent white chips inside tints | `screenshots/after-lesson-tablet-768.png` |
