// Layer 1, program state: what the running program knows (names, lists, call stack,
// output). No ids, positions or animation here: that's scene.ts and beat.ts.

import {
  isAlias,
  type Arg,
  type PipelineStage,
  type Step,
  type Val,
  type VizEvent,
} from "./events.ts"

/** A name holds a plain value or points at a list on the heap. */
export type Binding = { val: Val } | { ref: string }

export type Frame = {
  fn: string
  args: [string, Arg][]
  /** the call's own variables (its parameters first) */
  locals: Record<string, Binding>
  /** last value a callee returned into it */
  got?: Val
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
  error?: string
}

export const EMPTY: Program = {
  globals: {},
  lists: {},
  frames: [],
  output: [],
  payloads: {},
}

/** Where a name lives right now: the running call's variables, else globals (Python's local-first lookup, simplified). */
export function resolve(
  p: Program,
  name: string
): { binding?: Binding; frame?: number } {
  const top = p.frames.length - 1
  if (top >= 0 && name in p.frames[top].locals)
    return { binding: p.frames[top].locals[name], frame: top }
  return { binding: p.globals[name] }
}

export function listId(p: Program, name: string): string {
  const b = resolve(p, name).binding
  if (!b || !("ref" in b)) throw new Error(`${name} is not a list`)
  return b.ref
}

/** Frame i's position on its own function's machine: how many earlier frames run the same function. */
export const machineSlot = (frames: Frame[], i: number) =>
  frames.slice(0, i).filter((f) => f.fn === frames[i].fn).length

function checkIndex(items: Val[], index: number, allowEnd = false) {
  const max = allowEnd ? items.length : items.length - 1
  if (!Number.isInteger(index) || index < 0 || index > max)
    throw new Error(`index ${index} out of range for a list of ${items.length}`)
}

/** Apply one event. Pure: returns a new state and never mutates `p`. */
export function apply(p: Program, ev: VizEvent): Program {
  // Assignments land in the running call's frame, else in globals.
  const bind = (name: string, b: Binding | undefined): Program => {
    const top = p.frames.length - 1
    if (top < 0) {
      const globals = { ...p.globals }
      if (b) globals[name] = b
      else delete globals[name]
      return { ...p, globals }
    }
    const frames = [...p.frames]
    const locals = { ...frames[top].locals }
    if (b) locals[name] = b
    else delete locals[name]
    frames[top] = { ...frames[top], locals }
    return { ...p, frames }
  }
  switch (ev.type) {
    case "var.set":
      return bind(ev.name, { val: ev.value })
    case "array.create": {
      const id = `L${Object.keys(p.lists).length + 1}`
      return {
        ...bind(ev.name, { ref: id }),
        lists: { ...p.lists, [id]: [...ev.values] },
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
      const q = ev.into ? bind(ev.into, { val: gone }) : p
      return { ...q, lists: { ...p.lists, [id]: items } }
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
      return ev.into ? bind(ev.into, { val: p.lists[id][ev.index] }) : p
    }
    case "loop.iter": {
      const id = listId(p, ev.array)
      checkIndex(p.lists[id], ev.index)
      return {
        ...bind(ev.variable, { val: p.lists[id][ev.index] }),
        loop: { list: id, index: ev.index },
      }
    }
    case "loop.end":
      return { ...p, loop: undefined }
    case "cond.eval":
      return { ...p, cond: { id: ev.id, result: ev.result } }
    case "call": {
      const locals: Record<string, Binding> = {}
      for (const [name, a] of ev.args)
        locals[name] = isAlias(a) ? { ref: listId(p, a.alias) } : { val: a }
      return {
        ...p,
        frames: [...p.frames, { fn: ev.fn, args: ev.args, locals }],
      }
    }
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
    case "ref.set":
      return bind(ev.name, { ref: listId(p, ev.to) })
    case "var.del":
      if (!resolve(p, ev.name).binding)
        throw new Error(`${ev.name} is not defined`)
      return bind(ev.name, undefined)
    case "error":
      return { ...p, error: ev.text }
  }
}

/** State after steps[0..i]; i = -1 is before the first step. */
export function replay(steps: Step[], i: number): Program {
  let p = EMPTY
  for (let k = 0; k <= i; k++) p = apply(p, steps[k].event)
  return p
}
