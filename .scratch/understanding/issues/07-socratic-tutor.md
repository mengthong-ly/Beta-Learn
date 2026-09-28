# AI tutor that protects thinking — deferred

Status: deferred (deliberately, not forgotten)
Blocked by: an architecture decision, not by work

## Why deferred
The source research is right that AI changes the product, and right about the design: hints
should scaffold, not answer. A 2026 randomised study found AI support can improve performance
while leaving learning unchanged (https://doi.org/10.1016/j.caeai.2025.100537), and a 2026
systematic review documents the dependency trap
(https://www.nature.com/articles/s41599-026-08959-2).

But building it breaks three things that are currently true of this codebase:
1. **No LLM integration exists.** Nothing in `package.json`; the one `@anthropic-ai/*` dependency
   is `sandbox-runtime`, an OS sandbox. All the `ANTHROPIC_API_KEY` hits are *lesson prose* in
   the course that teaches the Claude API.
2. **"The deployed host executes zero lesson code"** (`docs/architecture.md`). A tutor needs a
   server route, a key, and a per-learner cost model.
3. `.design/thonglearn/DESIGN_BRIEF.md` lists an AI tutor under **Out of Scope**.

None of that makes it wrong — it makes it a decision someone should take deliberately.

## If it is taken, the design is already settled
- Hint ladder: nudge → Socratic question → explain the concept → similar example → partial →
  full, unlocked by effort rather than by asking.
- Separate **assisted performance** from **independent mastery** in whatever ticket 04 builds. A
  100% scored with heavy help is not 100% mastery, and recording it as such is dishonest.
- The tutor should read `db.predictions` and the misconception catalogue (ticket 03) so its first
  question is about *this* learner's actual wrong belief.

## Cheaper thing to do first
Most of the value here is a good hint ladder, and hints today are all-or-nothing (`solution` plus
`solution-compare.tsx`, and `lib/check-items.ts` already scrapes `expect()` messages into a
"your code should…" checklist but only shows it in write-only mode). Surfacing that checklist
progressively after a failed attempt is hand-written, needs no model, and captures a real share
of the benefit. Consider it before reaching for an API.
