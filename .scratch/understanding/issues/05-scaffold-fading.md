# From a blank editor to a real project

Status: open
Blocked by: nothing

## What
Two linked gaps: "I know the syntax but don't know how to start", and the jump from exercises to
building something. Completing a partly written program beats writing from scratch for novices
(van Merriënboer 1990), and subgoal labels reduce drops and fails (Margulieux, Morrison & Decker
2020) — both already in `.design/thonglearn/research/write-only-learning-research.md`.

## Shape
Two pieces that should ship together:

**Decomposition before code.** Before the editor opens on a harder challenge: what are the
inputs, what is the output, what are the steps, then pseudocode — *then* code. Subgoal-labelled
solutions are the cheap version of this and work on existing content.

**Fading.** A challenge should be authorable at a scaffold level, and the level should drop as a
concept is mastered: everything given → some lines removed → pseudocode only → requirements only
→ blank. Today every challenge is a single fixed `starter` block.

Then the exercise→project ladder: fill in the blank → complete the function → implement a
requirement → modify → debug → build a feature → build a project. The middle rungs mostly exist;
the ends don't.

## Careful
Expertise reversal (Kalyuga et al. 2003): scaffolding that helps a novice *hurts* a learner who
no longer needs it. Fading must be driven by demonstrated mastery (ticket 04), not by lesson
number — which is why this is worth doing properly or not at all.

## Done when
One Python section is authored at three scaffold levels, the level a learner sees is chosen by
something real, and `npm run check:content -- python` passes (note: the checker requires the
starter to fail the check — a near-complete starter must still fail).
