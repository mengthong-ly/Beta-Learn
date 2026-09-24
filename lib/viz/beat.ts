// Layer 3, animation state: what moves during one step. Derived from the states before
// and after the step, so the renderer never has to work it out from values.

import { formatVal, isAlias, type Step, type VizEvent } from "./events.ts"
import {
  apply,
  EMPTY,
  listId,
  machineSlot,
  resolve,
  type Program,
} from "./program.ts"
import { EMPTY_SCENE, reduceScene, type Focus, type Scene } from "./scene.ts"

/** A value travelling between two anchors (see layout.ts for how anchors resolve). */
export type Flight = { from: string; to: string; label: string }

export type Beat = {
  /** element/frame ids that appear or leave this step (the renderer animates them in/out) */
  entering: string[]
  exiting: string[]
  /** element ids or `var:<name>` whose value changed in place */
  changed: string[]
  flights: Flight[]
  /** edge ids (`<source node>-><target node>`) the execution particle travels along */
  particles: string[]
}

export const QUIET: Beat = {
  entering: [],
  exiting: [],
  changed: [],
  flights: [],
  particles: [],
}

/** Is `name` a global right now (not shadowed by the running call's variables)? */
const isGlobal = (p: Program, name: string) =>
  resolve(p, name).frame === undefined

const frameAnchor = (p: Program, i: number) =>
  `fn:${p.frames[i].fn}:frame:${machineSlot(p.frames, i)}`

/** Where a variable is drawn: its slot in the global scope, or its call's frame. */
function varAnchor(p: Program, name: string): string {
  const { frame } = resolve(p, name)
  return frame === undefined ? `var:${name}` : frameAnchor(p, frame)
}

/** The React Flow node a focus lives in. */
export function nodeOf(f: Focus | null, p: Program): string | undefined {
  if (!f) return undefined
  switch (f.kind) {
    case "var": {
      const { binding, frame } = resolve(p, f.name)
      if (frame !== undefined) return `fn:${p.frames[frame].fn}`
      return binding && "ref" in binding ? `list:${binding.ref}` : "scope"
    }
    case "list":
    case "element":
      return `list:${f.list}`
    case "branch":
      return `branch:${f.id}:${f.result}`
    case "fn":
      return `fn:${f.fn}`
    case "stage":
      return `stage:${f.stage}`
    case "output":
      return "output"
  }
}

/** The anchor a value leaves from when execution moves on from this focus. */
function anchorOf(f: Focus | null, s: Scene, p: Program): string | undefined {
  if (!f) return undefined
  switch (f.kind) {
    case "var":
      return varAnchor(p, f.name)
    case "element":
      return `el:${s.ids[f.list]?.[f.index]}`
    case "fn":
      return f.depth === 0 ? `fn:${f.fn}:out` : frameAnchor(p, f.depth - 1)
    default:
      return nodeOf(f, p)
  }
}

function beatFor(
  ev: VizEvent,
  prev: { p: Program; s: Scene },
  next: { p: Program; s: Scene }
): Beat {
  const all = (s: Scene) => [...Object.values(s.ids).flat(), ...s.frames]
  const before = new Set(all(prev.s))
  const after = new Set(all(next.s))
  const beat: Beat = {
    entering: [...after].filter((id) => !before.has(id)),
    exiting: [...before].filter((id) => !after.has(id)),
    changed: [],
    flights: [],
    particles: [],
  }
  const el = (list: string, i: number, s = prev.s) => `el:${s.ids[list][i]}`
  const from = nodeOf(prev.s.focus, prev.p)

  switch (ev.type) {
    case "var.set": {
      if (isGlobal(next.p, ev.name)) beat.changed.push(`var:${ev.name}`)
      const f = prev.s.focus
      if (f?.kind === "fn" && f.depth === 0)
        beat.flights.push({
          from: `fn:${f.fn}:out`,
          to: varAnchor(next.p, ev.name),
          label: formatVal(ev.value),
        })
      if (from && from !== "scope") beat.particles.push(`${from}->scope`)
      break
    }
    case "ref.set":
      if (isGlobal(next.p, ev.name)) beat.changed.push(`var:${ev.name}`)
      break
    case "array.set": {
      const list = (next.s.focus as { list: string }).list
      beat.changed.push(next.s.ids[list][ev.index])
      break
    }
    case "array.access":
    case "array.remove":
      if (ev.into) {
        const id = listId(prev.p, ev.name)
        if (isGlobal(next.p, ev.into)) beat.changed.push(`var:${ev.into}`)
        beat.flights.push({
          from: el(id, ev.index),
          to: varAnchor(next.p, ev.into),
          label: formatVal(prev.p.lists[id][ev.index]),
        })
      }
      break
    case "loop.iter": {
      const id = listId(prev.p, ev.array)
      if (isGlobal(next.p, ev.variable)) beat.changed.push(`var:${ev.variable}`)
      beat.flights.push({
        from: el(id, ev.index),
        to: varAnchor(next.p, ev.variable),
        label: formatVal(prev.p.lists[id][ev.index]),
      })
      break
    }
    case "cond.eval":
      beat.particles.push(`gate:${ev.id}->branch:${ev.id}:${ev.result}`)
      break
    case "call": {
      const depth = next.p.frames.length
      beat.flights.push({
        from: depth > 1 ? frameAnchor(prev.p, depth - 2) : "scope",
        to: frameAnchor(next.p, depth - 1),
        label: ev.args
          .map(([, a]) => (isAlias(a) ? a.alias : formatVal(a)))
          .join(", "),
      })
      if (depth === 1) beat.particles.push(`scope->fn:${ev.fn}`)
      break
    }
    case "return": {
      const depth = prev.p.frames.length
      beat.flights.push({
        from: frameAnchor(prev.p, depth - 1),
        to: depth > 1 ? frameAnchor(prev.p, depth - 2) : `fn:${ev.fn}:out`,
        label: formatVal(ev.value),
      })
      break
    }
    case "pipeline.stage":
      if (from?.startsWith("stage:"))
        beat.particles.push(`${from}->stage:${ev.stage}`)
      break
    case "print": {
      const a = anchorOf(prev.s.focus, prev.s, prev.p)
      if (from) beat.particles.push(`${from}->output`)
      if (a) beat.flights.push({ from: a, to: "output", label: ev.text })
      break
    }
  }
  return beat
}

export type Snapshot = {
  program: Program
  scene: Scene
  beat: Beat
  step?: Step
}

/** Every frame of a demo in one fold: [0] is before the first step, [i + 1] is after step i. */
export function framesOf(steps: Step[]): Snapshot[] {
  const out: Snapshot[] = [{ program: EMPTY, scene: EMPTY_SCENE, beat: QUIET }]
  for (const step of steps) {
    const { program: p, scene: s } = out[out.length - 1]
    const np = apply(p, step.event)
    const ns = reduceScene(s, step.event, p, np)
    out.push({
      program: np,
      scene: ns,
      beat: beatFor(step.event, { p, s }, { p: np, s: ns }),
      step,
    })
  }
  return out
}

/** Everything the renderer needs for step i (i = -1: before the first step). */
export const frameAt = (steps: Step[], i: number): Snapshot =>
  framesOf(steps.slice(0, i + 1))[i + 1]
