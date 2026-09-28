# Predict → Run → Compare

## Context
`.design/thonglearn/research/write-only-learning-research.md` already made the case for PRIMM and
shipped its first slice: `PredictOutput`, a predict-then-reveal strip under each example, for
courses the **website can't run** (Dart, Flutter, C++ at the time). It compares the guess against
a *recorded* string from `npm run check:content -- --record`.

That left the majority of the platform out. Every **runnable** example — Python, PHP, Laravel,
TypeScript, React, C++ — got a bare **Try it** button and no prediction step. And the shipped
widget makes the guess optional with a Reveal button, which is the weaker form the same research
note flags:

> Predicting a demo's outcome improved understanding; watching alone didn't (Crouch et al. 2004);
> committing to a prediction beats judging afterwards (Brod, Hasselhorn & Bunge 2018).
> **Caveat: learner must commit to the guess.**

So this is not a new system. It is one inverted condition plus a join between three things that
already existed: the predict widget, the live runner, and the step visualizer.

**No lesson content was authored.** Every runnable fence becomes a prediction opportunity for
free, across every course.

## Flow

```
collapsed strip  →  textarea  →  Run it (disabled until non-empty)  ←── the commitment gate
                                     │
                                 run(code, undefined, course)        ← the shared runner
                                     │
                    comparePrediction(guess, printed, error)
                                     │
                    match → mint          mismatch → peach + two columns, bad line marked
                                                        │
                                          "See where it diverged"   (canTrace only)
                                                        │
                              trace() → toSteps() → divergenceStep() → VizPlayer startAt
```

## Decisions

**The guess is required before Run unlocks.** This is the whole point — see the caveat above.
It never gates the normal **Try it** button, which is untouched: pillar 1 is "run early, run
often", and predicting is an offer, not a toll.

**It runs through `run()` directly, not through the editor.** An earlier draft routed it through
`tryCode` + `execute()`. That was wrong three ways: `execute()` runs the `code` *state*, so
editing-then-running in one tick runs the previous program; `tryCode` overwrites the learner's
draft for that lesson; and `execute()` appends a `db.runs` row, which `lesson-steps.tsx:43` reads
as "Run code: done". Predicting an example in the reading column is not a challenge attempt.
Going straight to `run()` avoids all three. The Output pane still reflects it — "one run at a
time, app-wide" is a documented invariant, not a bug.

**Predictions get their own table, not a `runs` row.** `db.version(4)` adds
`predictions: "++id, lessonId, createdAt"` storing the code, the guess, `ok`, and `badLine`. Same
reason as above, plus it keeps run history meaning what it meant. Local-only, like `runs` —
`lib/sync.ts` is untouched.

**Degradation is by capability, with no dead ends.**

| | Behaviour |
|---|---|
| `!canRun` | the existing recorded-output `PredictOutput`, unchanged |
| `canRun`, `!canTrace` (php, laravel, ts, react, and rust/dart/flutter locally) | full predict → run → compare, no diverge offer |
| `canRun && canTrace` (python, cpp) | the whole loop |

**The visualizer renders inline, under the example.** Not in the Visualize tab: that tab traces
the *editor's* code keyed by doc, and the example isn't the editor's code — showing it there
would mean loading it into the editor and clobbering the draft. Inline also keeps the learner in
the reading column at the moment the explanation lands.

## The fix this exposed

`PredictRun` was the first component with state to live inside `Doc`'s markdown tree, and it
found a real bug: **every run destroyed it.** `Workspace` subscribes to the runner via
`useRunner()`, so any run re-renders it; its context value was a new object literal each render;
`Doc` consumes that and rebuilt its react-markdown `components` map; a fresh `pre` function
identity makes React unmount and remount the entire lesson body.

Fixed at the root rather than worked around with a module-level cache: `tryCode` is now stable
(the `executeRef` pattern already in that file), the context value is `useMemo`d, and `Doc`'s
`components` map is `useMemo`d. Also a real performance fix — the whole prose tree was remounting
on every Run.

## Code

| File | |
|---|---|
| `lib/viz/predict.ts` + `.test.ts` | **new.** `comparePrediction`, `claimsError`, `divergenceStep`. Pure; 14 cases under `node --test` |
| `components/predict-output.tsx` | adds `PredictRun`; `PredictOutput` now shares the comparator and verdict |
| `components/doc.tsx` | mounts `PredictRun` on runnable examples; memoised `components` |
| `components/workspace.tsx` | stable `tryCode`, memoised context value |
| `lib/db.ts` | v4 `predictions` |
| `lib/viz/use-player.ts`, `components/viz/viz-player.tsx` | optional `startAt` |

`divergenceStep` works because `print` is a first-class `VizEvent` (`lib/viz/events.ts`): walk
the steps, count printed lines, return the step that produced the bad one. Frame `i + 1` shows
step `i` (`framesOf`, `lib/viz/beat.ts`), which is what `startAt` receives.

`claimsError` is a keyword match, marked `ponytail:` — enough that "it crashes" isn't marked
wrong, not an attempt at understanding prose.

## Not done

- **The self-explanation prompt is a question in the verdict text, not an input.** Bisra et al.
  2018 puts self-explanation at g = 0.55, so a real prompt is worth having — but an input that
  stores nothing is worse than a question that makes you think. Pair it with ticket 03.
- **Nothing reads `db.predictions` yet.** It is the best misconception signal in the app
  (which example, which line, what they believed instead). `.scratch/understanding/issues/03`.
- **The `!canRun` path was not exercised in the browser**: on localhost `isLocal()` makes
  `canRun` true for every course, so the recorded-output branch can only be seen on the deployed
  site. The branch condition is textually unchanged and the shared verdict logic is covered by
  the new tests, but it wasn't run.
