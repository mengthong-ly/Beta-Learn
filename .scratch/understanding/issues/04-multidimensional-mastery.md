# Mastery per skill, not a percentage per lesson

Status: open
Blocked by: 01, 02, 03 (they supply the dimensions)

## What
Today progress is one boolean per lesson: `db.progress` = `{lessonId, completedAt}`, written when
a check passes. "Arrays 80%" hides the thing worth knowing — that a learner can write array code
but can't debug or transfer it.

Track instead, per concept: **recognition · tracing · writing · debugging · transfer ·
explanation**. Then the app can say "you know the syntax, you struggle to debug it", which is
actionable, where 80% isn't.

## What already feeds this
- writing → `db.progress` (check passed)
- tracing/prediction → `db.predictions` (Phase 1: ok / badLine per example)
- recognition → `db.quizzes`
- debugging → ticket 01
- transfer → ticket 02
- explanation → not captured anywhere, and probably shouldn't be without a grader

So four of six dimensions already have a data source. Build the model over what exists; don't
add capture for explanation until there's something that can judge it.

## Also in scope
There is **no dashboard route** today (no `/progress`, `/dashboard`, `/profile`) — progress is
scattered across the sidebar, course cards and `lesson-steps.tsx`. This ticket owns the first one.

## Careful
`.design/thonglearn/DESIGN_BRIEF.md` names "dashboard clutter" as an anti-reference, and
`research/focus-timer-adhd-research.md` rates gamification small. Six progress bars per concept
across nine courses is exactly the clutter it warns about. Lead with *one* actionable line
("today's weakness: loop boundaries — 5 minutes"), and keep the full grid behind it.

## Done when
A mastery model in `lib/` with a sibling `*.test.ts`, derived from the existing tables, and one
surface that turns it into a single next action.
