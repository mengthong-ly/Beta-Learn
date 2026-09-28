# Track misconceptions, not just wrong answers

Status: open
Blocked by: 01 and 02 (they generate the signal)

## What
"❌ Incorrect" teaches nothing. Naming the *belief* does: "you assumed a function parameter
changes the caller's variable — that's a common one, here it is in the visualizer." A 2025 study
of 651 students found some misconceptions fade with experience while others persist
(Bastian & Mühling, https://doi.org/10.1145/3702652.3744209).

## The signal already exists
Phase 1 added `db.predictions` (`lib/db.ts` v4): every committed prediction, the real output,
whether it matched, and **which output line first diverged**. That is a far better misconception
signal than a pass/fail, and nothing reads it yet. Start there before inventing new capture.

## Shape
1. A small, *hand-written* catalogue of misconceptions per concept, each with a matcher over a
   prediction row (e.g. on the aliasing example, a guess of `[1, 2]` for line 1 means "assumed
   `b = a` copies the list"). Hand-written, not inferred — a wrong guess has many causes, and a
   confidently mislabelled misconception is worse than none.
2. When one recurs, offer targeted practice: "this has come up 4 times — 3 minutes on it?"
3. Never show a confidence score to the learner.

## Careful
The source research's §13 JSON sketch implies automatic classification with a confidence number.
Don't. Keep matchers explicit and few, and prefer saying nothing over guessing at what someone
believes.

## Done when
At least five catalogued misconceptions across the Python list/scope lessons, matched from real
`db.predictions` rows, with a targeted-practice offer. Pure matching logic in `lib/` with a
sibling `*.test.ts`.
