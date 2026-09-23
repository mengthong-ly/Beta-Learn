// Focus/break timer as a pure state machine. Time left is always derived from an absolute
// end time, never from counted ticks, so it stays right in throttled background tabs and
// across reloads. See .design/thonglearn/research/focus-timer-adhd-research.md.

export const PRESETS = [15, 25, 45] as const
export type Preset = (typeof PRESETS)[number]
export const BREAK_MIN: Record<Preset, number> = { 15: 3, 25: 5, 45: 10 }

const MIN = 60_000

export type Timer =
  | { phase: "idle" }
  | { phase: "focus" | "break"; preset: Preset; endsAt: number }
  | { phase: "paused"; preset: Preset; remaining: number }
  // Focus ended; waits for the learner rather than forcing a break on them.
  | { phase: "done"; preset: Preset }

export const IDLE: Timer = { phase: "idle" }

export const start = (preset: Preset, now: number): Timer => ({
  phase: "focus",
  preset,
  endsAt: now + preset * MIN,
})

export const startBreak = (t: Timer, now: number): Timer =>
  t.phase === "idle" ? t : { phase: "break", preset: t.preset, endsAt: now + BREAK_MIN[t.preset] * MIN }

export const pause = (t: Timer, now: number): Timer =>
  t.phase === "focus" ? { phase: "paused", preset: t.preset, remaining: left(t, now) } : t

export const resume = (t: Timer, now: number): Timer =>
  t.phase === "paused" ? { phase: "focus", preset: t.preset, endsAt: now + t.remaining } : t

/** +5 min of focus: on a running or paused block, or to keep going after one ends. */
export function extend(t: Timer, now: number): Timer {
  if (t.phase === "focus") return { ...t, endsAt: t.endsAt + 5 * MIN }
  if (t.phase === "paused") return { ...t, remaining: t.remaining + 5 * MIN }
  if (t.phase === "done") return { phase: "focus", preset: t.preset, endsAt: now + 5 * MIN }
  return t
}

export function left(t: Timer, now: number): number {
  if (t.phase === "focus" || t.phase === "break") return Math.max(0, t.endsAt - now)
  return t.phase === "paused" ? t.remaining : 0
}

/** Moves an expired focus block to "done" and an expired break to idle; otherwise returns t. */
export function tick(t: Timer, now: number): Timer {
  if (t.phase === "focus" && now >= t.endsAt) return { phase: "done", preset: t.preset }
  if (t.phase === "break" && now >= t.endsAt) return IDLE
  return t
}
