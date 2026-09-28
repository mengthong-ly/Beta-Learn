# Spec: understanding, not just correctness

Status: Phase 1 (predict → run → compare) done 2026-09-26 · the rest is open

## Goal

From `coding_learning_platform_student_pain_points_research.md` (25 Sep 2026): learners pass
exercises without a mental model of what the computer did. The thesis is

> teach learners to **see, predict, explain, debug and transfer** what their code is doing —
> not just to produce code that passes.

This spec maps the ten gaps that research names onto what ThongLearn already has, what Phase 1
added, and what is still open. One ticket per open gap in `issues/`.

## What ThongLearn already answered, before any of this

Worth stating, because the source research assumes a blank slate and it isn't one:

| Gap | Already shipped |
|---|---|
| Mental model | The step visualizer: records a learner's own Python/C++ run and replays it isometrically (`components/viz/`, ADR-0004) |
| Predict | `PredictOutput` — predict-then-reveal on write-only courses (`components/predict-output.tsx`) |
| Retrieval practice | Quiz blocks with verified "what does this print?" answers (`lib/quiz.ts`), section and final quizzes |
| Attempt-then-compare | `components/solution-compare.tsx` + the `expect()` checklist from `lib/check-items.ts` |
| Habit without punishment | The streak counts *reading* as well as running (`lib/stats.ts`) |

The evidence for all of the above is already collected in
`.design/thonglearn/research/write-only-learning-research.md` — PRIMM, tracing, worked examples,
subgoal labels, Parsons problems, self-explanation. **Use that note, not the source research doc,
as the citation base.** It is sourced and caveated; the source doc is not.

## The ten gaps

| # | Gap ("I can't…") | Use case | Evidence | UX | Status |
|---|---|---|---|---|---|
| 1 | know what the computer is doing | step a real run and watch state change | Sorva 2013; Nelson/Xie/Ko 2017 | Visualize tab | **shipped** |
| 2 | predict what my code will do | commit a guess, run for real, see where it broke | Brod 2018; Sentance 2019 | Predict strip on every runnable example | **shipped (Phase 1)** |
| 3 | find why my code is wrong | guided observe → hypothesise → test → fix | Yang et al. 2024 | Debugging lessons | `issues/01` |
| 4 | solve a *new* problem with the same idea | same concept, unfamiliar context, unnamed | Atkinson/Renkl 2003 | Transfer challenges | `issues/02` |
| 5 | see *why* I keep getting this wrong | name the misconception, not just "incorrect" | Bastian & Mühling 2025 | Misconception tracking | `issues/03` |
| 6 | tell whether I actually understand | mastery per skill, not per lesson | — | Multi-dimensional mastery | `issues/04` |
| 7 | start from a blank editor | decomposition, then fading scaffolds | Margulieux 2012; van Merriënboer 1990 | Scaffold fading | `issues/05` |
| 8 | read code I didn't write | what does this do / what if input is empty | Lister 2004; Lopez 2008 | Code-reading exercises | `issues/06` |
| 9 | learn faster than AI can answer | hints that scaffold, never solve | Dependency-trap review 2026 | Socratic tutor | `issues/07` (deferred) |
| 10 | see why this concept matters | concept → where real software uses it | — | Folded into `issues/02` |

## Phase 1, shipped

Predict → Run → Compare, `docs/superpowers/specs/2026-09-26-predict-run-compare-design.md`.
It inverted an existing condition rather than building a system: the predict widget existed but
was wired only to examples the site *cannot* run. No lesson content was authored.

## Two corrections to the source research

Record these, because the repo's own research contradicts the source doc and the source doc is
the more persuasive of the two:

1. **Gamification (§28–29).** `.design/thonglearn/research/focus-timer-adhd-research.md` rates
   gamification "moderate but small, weaker when it is only points and badges", and puts
   **streaks that punish a missed day** on an explicit don't-build list. The source doc's XP and
   streak enthusiasm should be read against that. The shipped streak already counts reading,
   which is that finding applied — don't undo it.
2. **The AI tutor (§23–27).** There is no LLM integration, no server-side execution, and
   `.design/thonglearn/DESIGN_BRIEF.md` lists an AI tutor under **Out of Scope**. Adding one means
   a backend, keys and a cost model — a real departure from
   "the deployed host executes zero lesson code" (`docs/architecture.md`). Deferred, see
   `issues/07`.

## Note on `.design/thonglearn/`

`DESIGN_BRIEF.md`, `INFORMATION_ARCHITECTURE.md`, `DESIGN_REVIEW.md` and `TASKS.md` are
**pre-rewrite artifacts** — they say "PyLearn", `src/index.css`, `npm run check:lessons` and hash
routes, none of which exist. Treat them as historical intent. The live design direction is
`app/globals.css` (tokens), `docs/architecture.md`, and `docs/superpowers/specs/`. The `research/`
subfolder is current and good.
