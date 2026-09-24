// Visual state → React Flow. Owns the geometry every node draws with, so node drawings,
// edge handles and flight anchors all agree. Node positions are fixed for a whole demo
// (the cast is taken from every frame up front); only what's inside a node moves.

import type { Edge, Node } from "@xyflow/react"

import { framesOf, nodeOf, type Beat, type Snapshot } from "./beat.ts"
import { argLabel, type PipelineStage, type Step, type Val } from "./events.ts"
import {
  boxBounds,
  project,
  topCenter,
  type Box,
  type P2,
  type P3,
  type PathKind,
} from "./iso.ts"
import type { Binding, Frame, Program } from "./program.ts"

export const BLOCK: Box = { w: 34, d: 34, h: 20 }
export const SLOT = 54
/** how far an active block rises */
export const LIFT = 10
const PAD = 14
/** headroom above a lifted block for the execution cursor */
const PIN = 30

/** A node's drawing: world (0,0,0) sits at `origin` inside width × height; anchors are node-local px. */
export type Canvas = {
  width: number
  height: number
  origin: P2
  anchors: Record<string, P2>
}

function fit(
  parts: { box: Box; at?: P3 }[],
  extra: Partial<Record<"top" | "right" | "bottom" | "left", number>> = {}
) {
  const b = parts.map((p) => boxBounds(p.box, p.at))
  const minX = Math.min(...b.map((x) => x.minX))
  const maxX = Math.max(...b.map((x) => x.maxX))
  const minY = Math.min(...b.map((x) => x.minY))
  const maxY = Math.max(...b.map((x) => x.maxY))
  const [t, r, bo, l] = [
    extra.top ?? 0,
    extra.right ?? 0,
    extra.bottom ?? 0,
    extra.left ?? 0,
  ]
  const origin = { x: -minX + PAD + l, y: -minY + PAD + t }
  return {
    width: Math.ceil(maxX - minX + 2 * PAD + l + r),
    height: Math.ceil(maxY - minY + 2 * PAD + t + bo),
    origin,
    /** world point → node-local px */
    at: (p: P3): P2 => {
      const q = project(p)
      return { x: q.x + origin.x, y: q.y + origin.y }
    },
  }
}

/** A row of slots on a plate: the global scope and every list. */
export function lane(capacity: number, title: string) {
  const plate: Box = {
    w: Math.max(1, capacity) * SLOT + 12,
    d: BLOCK.d + 18,
    h: 6,
  }
  const slot = (i: number): P3 => ({
    x: 6 + i * SLOT + (SLOT - BLOCK.w) / 2,
    y: 9,
    z: plate.h,
  })
  const f = fit(
    [
      { box: plate },
      { box: { ...BLOCK, h: BLOCK.h + LIFT + PIN }, at: slot(0) },
    ],
    {
      left: title.length * 7.5 + 12,
      bottom: 26,
    }
  )
  const anchors: Record<string, P2> = {
    in: f.at({ x: 0, y: plate.d, z: plate.h / 2 }),
    out: f.at({ x: plate.w, y: 0, z: plate.h / 2 }),
  }
  for (let i = 0; i < capacity; i++) {
    const top = topCenter(BLOCK, slot(i))
    anchors[`slot:${i}`] = { x: top.x + f.origin.x, y: top.y + f.origin.y }
  }
  return { ...f, plate, slot, anchors }
}

export const MACHINE: Box = { w: 96, d: 64, h: 34 }
export const FRAME: Box = { w: 76, d: 46, h: 12 }
const FRAME_GAP = 10

/** A function: a machine block with its call frames stacking up on top. */
export function machine(maxDepth: number) {
  const frame = (i: number): P3 => ({
    x: 10,
    y: 9,
    z: MACHINE.h + 4 + i * (FRAME.h + FRAME_GAP),
  })
  const stack: Box = { ...FRAME, h: 4 + maxDepth * (FRAME.h + FRAME_GAP) + PIN }
  const f = fit(
    [{ box: MACHINE }, { box: stack, at: { x: 10, y: 9, z: MACHINE.h } }],
    { right: 130, bottom: 10 }
  )
  const anchors: Record<string, P2> = {
    in: f.at({ x: 0, y: MACHINE.d, z: MACHINE.h / 2 }),
    out: f.at({ x: MACHINE.w, y: 0, z: MACHINE.h / 2 }),
  }
  for (let i = 0; i < maxDepth; i++) {
    const top = topCenter(FRAME, frame(i))
    anchors[`frame:${i}`] = { x: top.x + f.origin.x, y: top.y + f.origin.y }
  }
  return { ...f, frame, anchors }
}

export const GATE: Box = { w: 124, d: 46, h: 22 }
export function gate() {
  const f = fit([{ box: GATE }], { bottom: 20, right: 30 })
  return {
    ...f,
    anchors: {
      in: f.at({ x: 0, y: GATE.d, z: GATE.h / 2 }),
      true: f.at({ x: GATE.w * 0.4, y: GATE.d, z: 0 }),
      false: f.at({ x: GATE.w, y: GATE.d * 0.6, z: 0 }),
    } as Record<string, P2>,
  }
}

export const BRANCH: Box = { w: 132, d: 40, h: 8 }
export function branch() {
  const f = fit([{ box: BRANCH }])
  const top = topCenter(BRANCH)
  return {
    ...f,
    anchors: {
      in: { x: top.x + f.origin.x, y: top.y + f.origin.y },
      out: f.at({ x: BRANCH.w, y: 0, z: BRANCH.h / 2 }),
    } as Record<string, P2>,
  }
}

export const STAGE: Box = { w: 84, d: 52, h: 30 }
export const CARD = { width: 172, line: 15, head: 26 }
/** A pipeline stage: a module block with the data it produced on a card beside it. */
export function stage(lines: number) {
  const f = fit([{ box: STAGE }])
  const cardH = CARD.head + lines * CARD.line + 8
  const top = topCenter(STAGE)
  const card = {
    x: f.width - PAD + 12,
    y: PAD,
    width: CARD.width,
    height: cardH,
  }
  return {
    ...f,
    width: f.width + 12 + CARD.width,
    height: Math.max(f.height, cardH + 2 * PAD),
    card,
    anchors: {
      in: { x: top.x + f.origin.x, y: top.y + f.origin.y },
      out: f.at({ x: STAGE.w, y: STAGE.d, z: 0 }),
    } as Record<string, P2>,
  }
}

export const CONSOLE = { width: 196, head: 28, line: 18 }
export function outputCard(lines: number): Canvas {
  const height = CONSOLE.head + Math.max(1, lines) * CONSOLE.line + 12
  return {
    width: CONSOLE.width,
    height,
    origin: { x: 0, y: 0 },
    anchors: { in: { x: CONSOLE.width / 2, y: 0 } },
  }
}

// ---------- node data (what each concept visualizer receives) ----------

export type ItemState = "idle" | "active" | "changed"

export type ScopeData = {
  title: string
  capacity: number
  vars: { name: string; val?: Val; ref: boolean; state: ItemState }[]
}
export type ArrayData = {
  name: string
  capacity: number
  exists: boolean
  items: { id: string; val: Val; state: ItemState; entering: boolean }[]
  cursor: number | null
  loop: boolean
  done: boolean
  /** how neighbours should move this step: open a gap first, or close one after the lift */
  shift: "insert" | "remove" | null
}
export type GateData = { expr: string; result: boolean | null }
export type BranchData = {
  code: string
  label: "True" | "False"
  state: "idle" | "taken" | "skipped"
}
export type FnData = {
  name: string
  maxDepth: number
  frames: { id: string; label: string; got?: Val; active: boolean }[]
  busy: boolean
}
export type StageData = {
  stage: PipelineStage
  title: string
  lines: number
  payload?: string[]
  state: "idle" | "active" | "done"
}
export type OutputData = { lines: string[]; capacity: number; active: boolean }

export type VizNode =
  | Node<ScopeData, "scope">
  | Node<ArrayData, "array">
  | Node<GateData, "gate">
  | Node<BranchData, "branch">
  | Node<FnData, "fn">
  | Node<StageData, "stage">
  | Node<OutputData, "output">

export type EdgeData = {
  kind: PathKind
  look: "flow" | "reference" | "branch"
  active: boolean
  hidden: boolean
  /** changes every step the particle should travel; undefined = no particle */
  pulse?: number
}
export type VizEdge = Edge<EdgeData, "iso">

export type Flight = { key: string; from: P2; to: P2; label: string }

export const STAGE_TITLES: Record<PipelineStage, string> = {
  source: "Source",
  tokens: "Tokenizer",
  ast: "Parser → AST",
  bytecode: "Compiler → bytecode",
  run: "Interpreter",
}
const STAGES = Object.keys(STAGE_TITLES) as PipelineStage[]
/** A big program still has to fit on screen: the rest are counted, not drawn. */
const MAX_VARS = 12
const MAX_LISTS = 6

type Placed = {
  id: string
  type: VizNode["type"]
  x: number
  y: number
  canvas: Canvas
}
type EdgeSpec = {
  id: string
  source: string
  sourceHandle: string
  target: string
  targetHandle: string
  kind: PathKind
  look: EdgeData["look"]
  /** a reference edge: only drawn while `name` refers to `list` */
  bind?: { name: string; list: string }
}

export type Layout = ReturnType<typeof layoutOf>

/** Everything about a world that doesn't change between steps. */
export function layoutOf(steps: Step[]) {
  const frames = framesOf(steps)
  const last = frames[frames.length - 1].program

  // ----- the cast: every entity that exists at any point -----
  const scopeNames: string[] = []
  const bindings = new Set<string>() // `${name}:${listId}`: every name → list reference ever made
  const lists = new Map<
    string,
    { name: string; capacity: number; loop: boolean }
  >()
  const fns = new Map<string, number>()
  const conds = new Map<
    string,
    { expr: string; then: string; otherwise: string }
  >()
  let outputLines = 0
  const printFrom = new Set<string>()
  steps.forEach((st, i) => {
    const ev = st.event
    const p = frames[i + 1].program
    for (const name of Object.keys(p.globals))
      if (!scopeNames.includes(name)) scopeNames.push(name)
    for (const [id, items] of Object.entries(p.lists)) {
      const holds = (b: Binding) => "ref" in b && b.ref === id
      const name =
        Object.keys(p.globals).find((n) => holds(p.globals[n])) ??
        p.frames
          .flatMap((f) => Object.entries(f.locals))
          .find(([, b]) => holds(b))?.[0] ??
        id
      const known = lists.get(id)
      lists.set(id, {
        name: known?.name ?? name,
        capacity: Math.max(known?.capacity ?? 0, items.length),
        loop: known?.loop || ev.type === "loop.iter",
      })
    }
    for (const [name, b] of Object.entries(p.globals))
      if ("ref" in b) bindings.add(`${name}:${b.ref}`)
    if (ev.type === "call")
      fns.set(
        ev.fn,
        Math.max(
          fns.get(ev.fn) ?? 0,
          p.frames.filter((f) => f.fn === ev.fn).length
        )
      )
    if (ev.type === "cond.eval") conds.set(ev.id, ev)
    if (ev.type === "print") {
      outputLines = p.output.length
      const src = nodeOf(frames[i].scene.focus, frames[i].program)
      if (src) printFrom.add(src)
    }
  })
  const pipeline = steps.some((s) => s.event.type === "pipeline.stage")
  const hidden = {
    vars: Math.max(0, scopeNames.length - MAX_VARS),
    lists: Math.max(0, lists.size - MAX_LISTS),
  }
  scopeNames.splice(MAX_VARS)
  const shownLists = [...lists.keys()].slice(0, MAX_LISTS)

  // ----- canvases -----
  const placed: Placed[] = []
  const scope = lane(scopeNames.length, "Global")
  const listCanvas = new Map(
    shownLists.map((id) => [
      id,
      lane(lists.get(id)!.capacity, lists.get(id)!.name),
    ])
  )
  const gateCanvas = gate()
  const branchCanvas = branch()
  const outCanvas = outputCard(outputLines)
  const right = () => Math.max(...placed.map((p) => p.x + p.canvas.width))
  const bottom = () => Math.max(...placed.map((p) => p.y + p.canvas.height))

  if (pipeline) {
    let y = 0
    STAGES.forEach((st, i) => {
      const c = stage(last.payloads[st]?.length ?? 1)
      placed.push({ id: `stage:${st}`, type: "stage", x: i * 36, y, canvas: c })
      y += c.height + 18
    })
    const run = placed[placed.length - 1]
    placed.push({
      id: "scope",
      type: "scope",
      x: right() + 40,
      y: run.y - 40,
      canvas: scope,
    })
  } else {
    placed.push({ id: "scope", type: "scope", x: 0, y: 0, canvas: scope })
    for (const [id, c] of listCanvas)
      placed.push({
        id: `list:${id}`,
        type: "array",
        x: 30,
        y: bottom() + 24,
        canvas: c,
      })
    const x0 = right() + 56
    let y = 0 // one machine per function, in a column, in the order they're first called
    for (const [name, depth] of fns) {
      const canvas = machine(depth)
      placed.push({ id: `fn:${name}`, type: "fn", x: x0, y, canvas })
      y += canvas.height + 24
    }
    for (const id of conds.keys()) {
      placed.push({
        id: `gate:${id}`,
        type: "gate",
        x: x0,
        y: 0,
        canvas: gateCanvas,
      })
      const y = gateCanvas.height + 40
      placed.push({
        id: `branch:${id}:true`,
        type: "branch",
        x: x0 - 40,
        y,
        canvas: branchCanvas,
      })
      placed.push({
        id: `branch:${id}:false`,
        type: "branch",
        x: x0 + branchCanvas.width - 10,
        y: y + 30,
        canvas: branchCanvas,
      })
    }
  }
  // Output sits below the world, under the first node that prints, so prints travel down into it.
  if (outputLines) {
    const s0 = placed.find((p) => p.id === "scope")!
    placed.push(
      pipeline
        ? {
            id: "output",
            type: "output",
            x: s0.x + 20,
            y: s0.y + s0.canvas.height + 36,
            canvas: outCanvas,
          }
        : {
            id: "output",
            type: "output",
            x: placed.find((p) => printFrom.has(p.id))?.x ?? 0,
            y: bottom() + 44,
            canvas: outCanvas,
          }
    )
  }

  // ----- edges -----
  const edges: EdgeSpec[] = []
  const edge = (
    source: string,
    sourceHandle: string,
    target: string,
    targetHandle: string,
    kind: PathKind,
    look: EdgeData["look"] = "flow",
    id = `${source}->${target}`,
    bind?: EdgeSpec["bind"]
  ) =>
    edges.push({
      id,
      source,
      sourceHandle,
      target,
      targetHandle,
      kind,
      look,
      bind,
    })
  for (const key of bindings) {
    const [name, list] = key.split(":")
    if (scopeNames.includes(name) && shownLists.includes(list))
      edge(
        "scope",
        `slot:${scopeNames.indexOf(name)}`,
        `list:${list}`,
        "in",
        "curve",
        "reference",
        `ref:${name}:${list}`,
        { name, list }
      )
  }
  for (const name of fns.keys())
    edge("scope", "out", `fn:${name}`, "in", "hcurve")
  for (const id of conds.keys()) {
    edge("scope", "out", `gate:${id}`, "in", "hcurve")
    edge(`gate:${id}`, "true", `branch:${id}:true`, "in", "curve", "branch")
    edge(`gate:${id}`, "false", `branch:${id}:false`, "in", "curve", "branch")
  }
  if (pipeline) {
    STAGES.slice(1).forEach((st, i) =>
      edge(`stage:${STAGES[i]}`, "out", `stage:${st}`, "in", "curve")
    )
    edge("stage:run", "out", "scope", "in", "curve")
  }
  for (const src of printFrom)
    if (placed.some((p) => p.id === src))
      edge(src, "out", "output", "in", "curve")

  return {
    frames,
    hidden,
    placed,
    edges,
    scopeNames,
    lists,
    fns,
    conds,
    outputLines,
  }
}

// ---------- per step ----------

const varState = (name: string, f: Snapshot): ItemState =>
  f.beat.changed.includes(`var:${name}`)
    ? "changed"
    : f.scene.focus?.kind === "var" && f.scene.focus.name === name
      ? "active"
      : "idle"

/** `factorial(n=3) · total=6`; a list shows the global name that holds it (`nums → data`). */
function frameLabel(fr: Frame, p: Program): string {
  const show = (k: string, b: Binding) => {
    if ("val" in b) return argLabel(k, b.val)
    const g = Object.keys(p.globals).find((n) => {
      const x = p.globals[n]
      return "ref" in x && x.ref === b.ref
    })
    return `${k} → ${g ?? "a list"}`
  }
  const params = fr.args.map(([k]) => k)
  const args = params
    .filter((k) => k in fr.locals)
    .map((k) => show(k, fr.locals[k]))
  const rest = Object.entries(fr.locals)
    .filter(([k]) => !params.includes(k))
    .map(([k, b]) => show(k, b))
  return `${fr.fn}(${args.join(", ")})${rest.length ? ` · ${rest.join(", ")}` : ""}`
}

function dataFor(
  n: Placed,
  L: Layout,
  f: Snapshot,
  prev: Snapshot
): VizNode["data"] {
  const { program: p, scene: s } = f
  const focus = s.focus
  // everything after the kind: a C++ function key like Shelf::add has colons of its own
  const key = n.id.slice(n.id.indexOf(":") + 1)
  switch (n.type) {
    case "scope":
      return {
        title: "Global",
        capacity: L.scopeNames.length,
        vars: L.scopeNames.map((name) => {
          const b = p.globals[name]
          return {
            name,
            val: b && "val" in b ? b.val : undefined,
            ref: !!b && "ref" in b,
            state: b ? varState(name, f) : "idle",
          }
        }),
      } satisfies ScopeData
    case "array": {
      const meta = L.lists.get(key)!
      const items = p.lists[key] ?? []
      const here =
        (focus?.kind === "element" || focus?.kind === "list") &&
        focus.list === key
      return {
        name: meta.name,
        capacity: meta.capacity,
        exists: key in p.lists,
        items: items.map((val, i) => {
          const id = s.ids[key][i]
          const state: ItemState = f.beat.changed.includes(id)
            ? "changed"
            : here && focus.kind === "element" && focus.index === i
              ? "active"
              : "idle"
          return { id, val, state, entering: f.beat.entering.includes(id) }
        }),
        cursor: here && focus.kind === "element" ? focus.index : null,
        loop: meta.loop,
        done:
          here &&
          focus.kind === "list" &&
          meta.loop &&
          f.step?.event.type === "loop.end",
        shift: f.beat.entering.some((id) => s.ids[key]?.includes(id))
          ? "insert"
          : f.beat.exiting.some((id) => prev.scene.ids[key]?.includes(id))
            ? "remove"
            : null,
      } satisfies ArrayData
    }
    case "gate": {
      const c = L.conds.get(key)!
      return {
        expr: c.expr,
        result: p.cond?.id === key ? p.cond.result : null,
      } satisfies GateData
    }
    case "branch": {
      const [, id, which] = n.id.split(":")
      const c = L.conds.get(id)!
      const taken =
        p.cond?.id === id ? p.cond.result === (which === "true") : null
      return {
        code: which === "true" ? c.then : c.otherwise,
        label: which === "true" ? "True" : "False",
        state: taken === null ? "idle" : taken ? "taken" : "skipped",
      } satisfies BranchData
    }
    case "fn": {
      const mine = p.frames
        .map((fr, i) => ({ fr, i }))
        .filter(({ fr }) => fr.fn === key)
      return {
        name: key,
        maxDepth: L.fns.get(key)!,
        frames: mine.map(({ fr, i }) => ({
          id: s.frames[i],
          label: frameLabel(fr, p),
          got: fr.got,
          active: i === p.frames.length - 1,
        })),
        busy: focus?.kind === "fn" && focus.fn === key && focus.depth > 0,
      } satisfies FnData
    }
    case "stage": {
      const st = key as PipelineStage
      const reached =
        STAGES.indexOf(st) <=
          STAGES.indexOf(p.stage ?? ("" as PipelineStage)) && !!p.stage
      return {
        stage: st,
        title: STAGE_TITLES[st],
        lines: L.frames.at(-1)!.program.payloads[st]?.length ?? 1,
        payload: p.payloads[st],
        state:
          focus?.kind === "stage" && focus.stage === st
            ? "active"
            : reached
              ? "done"
              : "idle",
      } satisfies StageData
    }
    case "output":
      return {
        lines: p.output,
        capacity: L.outputLines,
        active: focus?.kind === "output",
      } satisfies OutputData
  }
}

/** Resolve a beat anchor (`var:x`, `el:e3`, `fn:f:frame:1`, a node id…) to flow coordinates. */
function anchor(
  L: Layout,
  ref: string,
  prev: Snapshot,
  next: Snapshot,
  role: "from" | "to"
): P2 | undefined {
  const node = (id: string) => L.placed.find((p) => p.id === id)
  const pt = (n: Placed | undefined, a: string) => {
    const q = n?.canvas.anchors[a]
    return q && { x: n!.x + q.x, y: n!.y + q.y }
  }
  if (ref.startsWith("var:"))
    return pt(node("scope"), `slot:${L.scopeNames.indexOf(ref.slice(4))}`)
  if (ref.startsWith("el:")) {
    const id = ref.slice(3)
    for (const f of [next, prev])
      for (const [list, ids] of Object.entries(f.scene.ids)) {
        const i = ids.indexOf(id)
        if (i >= 0) {
          const q = pt(node(`list:${list}`), `slot:${i}`)
          return q && { x: q.x, y: q.y - LIFT }
        }
      }
    return undefined
  }
  const fn = ref.match(/^fn:(.+):(in|out|frame:\d+)$/)
  if (fn) return pt(node(`fn:${fn[1]}`), fn[2])
  return pt(node(ref), role === "from" ? "out" : "in")
}

/** React Flow nodes, edges and value flights for frame i (0 = before the first step). */
export function sceneAt(L: Layout, i: number, forward: boolean) {
  const f = L.frames[i]
  const prev = L.frames[Math.max(0, i - 1)]
  const beat: Beat = forward
    ? f.beat
    : { ...f.beat, flights: [], particles: [] }

  const nodes = L.placed.map(
    (n) =>
      ({
        id: n.id,
        type: n.type,
        position: { x: n.x, y: n.y },
        width: n.canvas.width,
        height: n.canvas.height,
        data: dataFor(n, L, { ...f, beat }, prev),
        draggable: false,
        selectable: false,
      }) as VizNode
  )

  const exists = (id: string) => {
    if (id.startsWith("list:")) return id.slice(5) in f.program.lists
    return true
  }
  const bound = (b?: EdgeSpec["bind"]) => {
    if (!b) return true
    const x = f.program.globals[b.name]
    return !!x && "ref" in x && x.ref === b.list
  }
  const edges: VizEdge[] = L.edges.map((e) => {
    const taken =
      e.look === "branch" &&
      f.program.cond &&
      e.target === `branch:${f.program.cond.id}:${f.program.cond.result}`
    const pulsing = beat.particles.includes(e.id)
    // Print connections only exist while a value travels to the output: drawn on top, then gone.
    const transient = e.target === "output"
    return {
      id: e.id,
      type: "iso",
      zIndex: transient ? 1000 : 0,
      source: e.source,
      sourceHandle: e.sourceHandle,
      target: e.target,
      targetHandle: e.targetHandle,
      selectable: false,
      data: {
        kind: e.kind,
        look: e.look,
        active: pulsing || !!taken,
        hidden:
          !exists(e.source) ||
          !exists(e.target) ||
          (transient && !pulsing) ||
          !bound(e.bind),
        pulse: pulsing ? i : undefined,
      },
    }
  })

  const flights: Flight[] = beat.flights.flatMap((fl, k) => {
    const from = anchor(L, fl.from, prev, f, "from")
    const to = anchor(L, fl.to, prev, f, "to")
    return from && to ? [{ key: `${i}:${k}`, from, to, label: fl.label }] : []
  })

  return { nodes, edges, flights }
}
