// Layer 2, visual state: stable identities and where execution is focused.
// A list element keeps its id while its neighbours shift, so the renderer can slide the
// same block instead of redrawing every box.

import type { PipelineStage, VizEvent } from "./events.ts"
import { listId, type Program } from "./program.ts"

export type Focus =
  | { kind: "var"; name: string }
  | { kind: "list"; list: string }
  | { kind: "element"; list: string; index: number }
  | { kind: "branch"; id: string; result: boolean }
  /** depth = frames on the stack after the event; 0 means back in the caller's code */
  | { kind: "fn"; fn: string; depth: number }
  | { kind: "stage"; stage: PipelineStage }
  | { kind: "output" }

export type Scene = {
  /** list id → element id per index */
  ids: Record<string, string[]>
  /** element id per stack frame, bottom first */
  frames: string[]
  next: number
  focus: Focus | null
}

export const EMPTY_SCENE: Scene = { ids: {}, frames: [], next: 1, focus: null }

/** Visual state after `ev`, which took the program from `before` to `after`. */
export function reduceScene(
  s: Scene,
  ev: VizEvent,
  before: Program,
  after: Program
): Scene {
  let next = s.next
  const fresh = () => `e${next++}`
  const withIds = (list: string, ids: string[]) => ({ ...s.ids, [list]: ids })

  switch (ev.type) {
    case "var.set":
      return { ...s, focus: { kind: "var", name: ev.name } }
    case "array.create": {
      const list = listId(after, ev.name)
      const ids = ev.values.map(fresh)
      return {
        ...s,
        ids: withIds(list, ids),
        next,
        focus: { kind: "list", list },
      }
    }
    case "array.insert": {
      const list = listId(before, ev.name)
      const ids = [...s.ids[list]]
      ids.splice(ev.index, 0, fresh())
      return {
        ...s,
        ids: withIds(list, ids),
        next,
        focus: { kind: "element", list, index: ev.index },
      }
    }
    case "array.remove": {
      const list = listId(before, ev.name)
      const ids = s.ids[list].filter((_, i) => i !== ev.index)
      return {
        ...s,
        ids: withIds(list, ids),
        focus: ev.into
          ? { kind: "var", name: ev.into }
          : { kind: "list", list },
      }
    }
    case "array.set":
    case "array.access":
      return {
        ...s,
        focus: {
          kind: "element",
          list: listId(before, ev.name),
          index: ev.index,
        },
      }
    case "loop.iter":
      return {
        ...s,
        focus: {
          kind: "element",
          list: listId(before, ev.array),
          index: ev.index,
        },
      }
    case "loop.end":
      return { ...s, focus: { kind: "list", list: listId(before, ev.array) } }
    case "cond.eval":
      return { ...s, focus: { kind: "branch", id: ev.id, result: ev.result } }
    case "call":
      return {
        ...s,
        frames: [...s.frames, fresh()],
        next,
        focus: { kind: "fn", fn: ev.fn, depth: after.frames.length },
      }
    case "return":
      return {
        ...s,
        frames: s.frames.slice(0, -1),
        focus: { kind: "fn", fn: ev.fn, depth: after.frames.length },
      }
    case "pipeline.stage":
      return { ...s, focus: { kind: "stage", stage: ev.stage } }
    case "print":
      return { ...s, focus: { kind: "output" } }
  }
}
