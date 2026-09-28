# Transfer: same concept, unfamiliar context

Status: open
Blocked by: nothing

## What
A learner who solves `numbers.map(n => n * 2)` often cannot see that `users.map(u => u.name)` is
the same idea. They learned the example, not the concept. Transfer is the strongest available
evidence of understanding, and the metric worth tracking is **delayed** transfer: can they solve
a new problem a week later *without being told which concept to use*.

## Shape
Per concept, a short ladder that ends without a hint:
`worked example → practice → different domain → no-context problem → real-world application`.
The last rung must not name the concept. Evidence: faded worked examples and self-explanation
prompts improve transfer (Atkinson, Renkl & Merrill 2003; Bisra et al. 2018, g = 0.55) — both
already cited in `.design/thonglearn/research/write-only-learning-research.md`.

Fold in the "why am I learning this?" gap (source research §33) here rather than as its own
feature: each concept carries a one-line *used in* list (variables → UI state, API responses,
form values; loops → rendering lists, aggregation) so the unfamiliar context is a real one.

## Open question to settle first
Is a transfer challenge a new lesson kind, a new block in an existing lesson, or a separate
spaced queue that resurfaces days later? The spaced version is the one the evidence actually
supports, but it needs a scheduling store — `db.progress` today is one boolean per lesson.
Decide before authoring content.

## Done when
At least one Python section has a transfer rung per concept, the final rung names no concept, and
`npm run check:content -- python` passes.
