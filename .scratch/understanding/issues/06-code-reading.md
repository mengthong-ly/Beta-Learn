# Reading code is a separate skill

Status: open
Blocked by: nothing

## What
The platform teaches writing. Professionals mostly read. Novices frequently cannot predict the
output of a short program they didn't write (Lister et al. 2004), and tracing ability correlates
with writing ability (Lopez et al. 2008; Venables, Tan & Lister 2009) — so reading isn't a nice
extra, it's upstream of the thing the course already teaches.

## Shape
Take one small function and ask several different questions about it, rather than one question
about several functions:
- What does this return?
- What happens if the input is empty?
- What if this field is missing?
- Rewrite it without `filter()`.
- Where would you add logging to debug it?
- What assumption does this code make?

Plus two cheap variants worth their own blocks:
- **Break the code:** given working code, what one small change breaks it, and what happens?
  (Develops causal understanding, and pairs directly with the visualizer.)
- **Compare two implementations:** a `map` and the equivalent loop — what's the same, what
  differs, which concept is shared? (Teaches the abstraction rather than the idiom.)

## Reuse
The prediction question type already exists twice: `lib/quiz.ts` supports a `~~~<lang>` block
that makes a question "what does this print?", with answers verified for Python and C++ by
`scripts/check-content.ts`. Check whether extending the quiz format covers most of this before
adding a new block kind.

## Done when
At least one Python section has reading questions that aren't "write the code", authored in
whichever existing format fits, and `npm run check:content -- python` passes.
