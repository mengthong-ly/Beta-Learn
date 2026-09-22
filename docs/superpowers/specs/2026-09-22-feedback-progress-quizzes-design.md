# Feedback, interactive progress & quizzes

## Context
Right now a successful run gives no visual reward, and progress is just a `3/5` badge plus a bar on the course card. The goal is to make learning feel rewarding and to test understanding:
- a green glow on the editor after every clean run, with a bigger celebration when a challenge Check passes
- interactive progress: animated rings, celebrations when a lesson, section or course is finished, a streak and XP, and a step tracker inside each lesson
- quizzes that go from easy to hard at three levels: **lesson → section ("chapter") → course final ("session")**

Python gets its quiz content first. The other courses get the system right away and their content later.

Decisions already made with you: chapter = section, session = whole course, glow on every clean run, all four progress features, Python first.

## Phases (each one ships and can be tested on its own)

### Phase 1: Run feedback (glow + celebration)
- `components/workspace.tsx` `execute()` (~line 207): after `run()`, if `res.status === "done"`, bump a `glow` counter in state. Wrap the `<CodeEditor>` container in a div with `key={glow}` and `data-glow={glow ? (res.check?.pass ? "pass" : "ok") : undefined}`.
- `app/globals.css`: add `@keyframes glow` (an inset box-shadow in `var(--success)` that fades over about 900ms) that runs on `[data-glow]`. `pass` gets a stronger or longer version. Turn it off under `prefers-reduced-motion`.
- New `components/celebrate.tsx`: a burst of about 24 motion `<span>` particles (the app already has `motion`, so there's no new dependency). It's fired imperatively through `celebrate()`, a small module-level event, the same way `toast()` works. It's called when a Check passes, a quiz is passed, a section is finished or the course is finished (with a bigger burst). It returns early under reduced motion.

### Phase 2: Quiz format + lesson quizzes
- **Format:** a fenced ` ```quiz ` block at the end of a lesson `.md`. Our own tiny line-based syntax, so no YAML dependency:
  ```
  ? easy: What does `print("a", "b", sep="-")` show?
  - a b
  + a-b
  > sep is placed between values.
  ```
  `?` is the question with its level (easy/medium/hard), `+` is the right answer, `-` is a wrong answer, and `>` is the explanation. An optional `~~~python` code block under `?` makes it a "what does this print?" question.
- `lib/lesson-parser.ts`: pull the `quiz` fence out the same way as starter/solution/check, and add `quiz?: Question[]` to `Lesson`. Questions are sorted easy→medium→hard.
- `scripts/check-content.ts`: validate every quiz (exactly one `+`, a valid level). For questions with code, **run the snippet and assert that the `+` answer equals its real stdout**. That makes the answers follow rule 2 automatically.
- New `components/quiz.tsx`: one question at a time, options shuffled, instant right/wrong feedback with the explanation, a difficulty chip, a progress bar, and a score screen at the end. You pass at ≥70%. Rendered at the bottom of the lesson in `components/doc.tsx`.
- `lib/db.ts` v3: add a `quizzes` table `{ key, best, total, passedAt? }`. The key is `python/print`, `python/section:2` or `python/final`.

### Phase 3: Section & course quizzes
- Auto-assembled from lesson quizzes, so there's no extra content to write. The **section quiz** takes the medium and hard questions from that section's lessons (up to 10). The **course final** takes up to 20 from all sections, weighted toward hard, in easy→hard order. `// ponytail: reuses lesson questions; add authored cross-lesson files under content/<course>/quizzes/ if they feel repetitive.`
- New route `app/[course]/quiz/[id]/page.tsx` (id = section number or `final`). Read `node_modules/next/dist/docs/` for the dynamic-route and params API first. The `Workspace` route switch treats `quiz` like the playground for the editor.
- Sidebar (`components/app-sidebar.tsx`): a "Section quiz" row at the end of each section, and a "Final exam" row under the sections. Each gets a check once passed.

### Phase 4: Interactive progress
- **Lesson steps:** a small stepper at the top of each lesson: Read → Run code → Pass challenge → Pass quiz.
  - Read = a sentinel at the end of the doc was seen (IntersectionObserver). Stored in a new Dexie `reads` table (v3).
  - Run = `docRuns.length > 0`, which is already queried.
  - Challenge = `done`.
  - Quiz = `quizzes.passedAt`.
- **Progress rings:** an SVG ring per section in the sidebar (replaces the `count/total` badge) that animates its stroke-dashoffset. The course card bar already animates, so it gets a ring and a quiz count added.
- **Streak + XP:** derived, no new storage.
  - Streak = the number of consecutive days that have any `runs.createdAt`.
  - XP = 10 per lesson + 2 per quiz point + 50 per section quiz passed + 200 for the final.
  - Shown in the sidebar header as `🔥 3 · 240 XP`, with the numbers animating when they change.
- **Celebrations:** in `execute()`'s completion branch, if this lesson finished its section, show a section-complete toast and `celebrate("big")`. Finishing the course gets the same.

### Content: Python quizzes (19 lessons)
Each of the 19 lessons in `content/python/lessons/` gets 5–6 questions (2 easy, 2 medium, 1–2 hard), fact-checked against docs.python.org with WebFetch per rule 2. At least 2 per lesson are "predict the output" questions so the checker verifies them. `npm run check:content -- python` must pass.

## Files
- Modify: `components/workspace.tsx`, `app/globals.css`, `lib/lesson-parser.ts`, `lib/db.ts`, `components/doc.tsx`, `components/app-sidebar.tsx`, `components/course-card.tsx`, `scripts/check-content.ts`, `content/python/lessons/*.md`
- New: `components/celebrate.tsx`, `components/quiz.tsx`, `app/[course]/quiz/[id]/page.tsx`, `lib/quiz.ts` (parse + assemble the section and final quizzes, with a small assert self-check)

## Skills to use during implementation
`superpowers:writing-plans` → per phase `tdd` (for the quiz parser/assembler), `frontend-design`/`make-interfaces-feel-better`/`improve-animations` (glow, rings, confetti), `shadcn` if a primitive is needed (e.g. `progress`, `radio-group` via CLI), `accessibility` (quiz is keyboard-operable, options are a radiogroup, results announced via `aria-live`), `research` + WebFetch for the quiz facts, and `context7` for motion and Dexie APIs.

## Verification
1. `npm run typecheck && npm run lint`
2. `npm run check:content -- python`: the quizzes validate and the output answers match real Pyodide output. Break one answer on purpose and confirm the check fails.
3. `npm run dev`, then drive it in the in-app browser:
   - a clean run glows green, an error doesn't glow, and Check passing shows the glow plus confetti
   - a lesson quiz can be answered by keyboard, scores, and persists after a reload
   - the steps tick off one by one
   - finishing the last lesson of a section celebrates
   - the section quiz and final exam open from the sidebar, run easy→hard, and ring/XP/streak update
4. Toggle reduced motion and check that the glow and confetti are suppressed.
