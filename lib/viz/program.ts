// Layer 1, program state: what the running program knows (names, lists, call stack,
// output). No ids, positions or animation here: that's scene.ts and beat.ts.

import type { PipelineStage, Step, Val, VizEvent } from "./events.ts"

/** A name holds a plain value or points at a list on the heap. */
export type Binding = { val: Val } | { ref: string }

export type Frame = {
  fn: string
  args: [string, Val][]
  /** last value a callee returned into it */ got?: Val
}

export type Program = {
  /** insertion-ordered, like a Python namespace */
  globals: Record<string, Binding>
  /** heap: list id → items */
  lists: Record<string, Val[]>
  frames: Frame[]
  output: string[]
  cond?: { id: string; result: boolean }
  loop?: { list: string; index: number }
  stage?: PipelineStage
  payloads: Partial<Record<PipelineStage, string[]>>
}

export const EMPTY: Program = {
  globals: {},
  lists: {},
  frames: [],
  output: [],
  payloads: {},
}

export function listId(p: Program, name: string): string {
  const b = p.globals[name]
  if (!b || !("ref" in b)) throw new Error(`${name} is not a list`)
  return b.ref
}

function checkIndex(items: Val[], index: number, allowEnd = false) {
  const max = allowEnd ? items.length : items.length - 1
  if (!Number.isInteger(index) || index < 0 || index > max)
    throw new Error(`index ${index} out of range for a list of ${items.length}`)
}

/** Apply one event. Pure: returns a new state and never mutates `p`. */
export function apply(p: Program, ev: VizEvent): Program {
  const set = (name: string, b: Binding) => ({ ...p.globals, [name]: b })
  switch (ev.type) {
    case "var.set":
      return { ...p, globals: set(ev.name, { val: ev.value }) }
    case "array.create": {
      const id = `L${Object.keys(p.lists).length + 1}`
      return {
        ...p,
        lists: { ...p.lists, [id]: [...ev.values] },
        globals: set(ev.name, { ref: id }),
      }
    }
    case "array.insert": {
      const id = listId(p, ev.name)
      const items = [...p.lists[id]]
      checkIndex(items, ev.index, true)
      items.splice(ev.index, 0, ev.value)
      return { ...p, lists: { ...p.lists, [id]: items } }
    }
    case "array.remove": {
      const id = listId(p, ev.name)
      const items = [...p.lists[id]]
      checkIndex(items, ev.index)
      const [gone] = items.splice(ev.index, 1)
      const globals = ev.into ? set(ev.into, { val: gone }) : p.globals
      return { ...p, globals, lists: { ...p.lists, [id]: items } }
    }
    case "array.set": {
      const id = listId(p, ev.name)
      const items = [...p.lists[id]]
      checkIndex(items, ev.index)
      items[ev.index] = ev.value
      return { ...p, lists: { ...p.lists, [id]: items } }
    }
    case "array.access": {
      const id = listId(p, ev.name)
      checkIndex(p.lists[id], ev.index)
      return ev.into
        ? { ...p, globals: set(ev.into, { val: p.lists[id][ev.index] }) }
        : p
    }
    case "loop.iter": {
      const id = listId(p, ev.array)
      checkIndex(p.lists[id], ev.index)
      return {
        ...p,
        globals: set(ev.variable, { val: p.lists[id][ev.index] }),
        loop: { list: id, index: ev.index },
      }
    }
    case "loop.end":
      return { ...p, loop: undefined }
    case "cond.eval":
      return { ...p, cond: { id: ev.id, result: ev.result } }
    case "call":
      return { ...p, frames: [...p.frames, { fn: ev.fn, args: ev.args }] }
    case "return": {
      const top = p.frames.at(-1)
      if (top?.fn !== ev.fn)
        throw new Error(
          `return from ${ev.fn} but ${top?.fn ?? "nothing"} is running`
        )
      const frames = p.frames.slice(0, -1)
      if (frames.length)
        frames[frames.length - 1] = {
          ...frames[frames.length - 1],
          got: ev.value,
        }
      return { ...p, frames }
    }
    case "pipeline.stage":
      return {
        ...p,
        stage: ev.stage,
        payloads: { ...p.payloads, [ev.stage]: ev.payload },
      }
    case "print":
      return { ...p, output: [...p.output, ev.text] }
  }
}

/** State after steps[0..i]; i = -1 is before the first step. */
export function replay(steps: Step[], i: number): Program {
  let p = EMPTY
  for (let k = 0; k <= i; k++) p = apply(p, steps[k].event)
  return p
}
