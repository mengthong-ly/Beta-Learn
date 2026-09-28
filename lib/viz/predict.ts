// Comparing a learner's committed prediction with what their program really did.
// Pure: the widget renders whatever this returns, and the tests run it under plain node.

import type { Step } from "./events.ts"

/** Trailing spaces and trailing blank lines are never what a prediction got wrong. */
const lines = (s: string) => {
  const t = s.replace(/\s+$/, "")
  return t ? t.split("\n").map((l) => l.trimEnd()) : []
}

// ponytail: keyword match, not NLP. Enough to stop "it crashes" being marked wrong;
// upgrade only if learners report predictions being missed.
const ERROR_WORDS =
  /\b(error|exception|fails?|crash(es)?|raises?|throws?|traceback)\b/i

/** Does the guess claim the program blows up — by saying so, or by naming the exception? */
export function claimsError(guess: string, error: string): boolean {
  if (ERROR_WORDS.test(guess)) return true
  const named = error.match(/\b[A-Za-z_]\w*(?:Error|Exception)\b/)?.[0]
  return !!named && guess.toLowerCase().includes(named.toLowerCase())
}

export type Comparison = {
  match: boolean
  /** 1-based output line where the two first differ; undefined when they match */
  firstBadLine?: number
  guess: string[]
  actual: string[]
}

/**
 * `actual` is what the program printed; `error` is set when it stopped early. A learner
 * can't be expected to reproduce a traceback, so predicting *that* it fails is a match.
 */
export function comparePrediction(
  guess: string,
  actual: string,
  error?: string
): Comparison {
  const g = lines(guess)
  const a = lines(actual)
  if (error) {
    const match = claimsError(guess, error)
    return { match, firstBadLine: match ? undefined : 1, guess: g, actual: a }
  }
  for (let i = 0; i < Math.max(g.length, a.length); i++)
    if (g[i] !== a[i])
      return { match: false, firstBadLine: i + 1, guess: g, actual: a }
  return { match: true, guess: g, actual: a }
}

/**
 * The step that produced output line `badLine` — the moment the learner's model and the
 * program parted ways. Undefined when nothing printed that far, so the caller can hide
 * the offer instead of seeking somewhere arbitrary.
 */
export function divergenceStep(
  steps: Step[],
  badLine: number
): number | undefined {
  let printed = 0
  for (let i = 0; i < steps.length; i++) {
    const ev = steps[i].event
    if (ev.type === "error") return i
    if (ev.type !== "print") continue
    printed += lines(ev.text).length || 1
    if (printed >= badLine) return i
  }
  return undefined
}
