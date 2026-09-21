"use client"

import { useSyncExternalStore } from "react"

export type Line = { kind: "out" | "err"; text: string }
export type Phase = "booting" | "compiling" | "running"
export type Status =
  "idle" | "running" | "done" | "error" | "timeout" | "stopped"

export type Inspect = {
  bytecode: { name: string; ops: [number, string, string, number | null][] }[]
  vars: {
    name: string
    type: string
    repr: string
    id: string
    refs: number
    size: number
    mutable: boolean
  }[]
}

export type RunState = {
  status: Status
  phase?: Phase
  booted: boolean
  lines: Line[]
  ms?: number
  error?: string
  errorLine?: number
  check?: { pass: boolean; message?: string }
  inspect?: Inspect
  /** bumps on every new run so the output pane can replay its animation */
  runKey: number
}

const TIMEOUT_MS = 10_000
const MAX_LINES = 2_000

let state: RunState = { status: "idle", booted: false, lines: [], runKey: 0 }
const listeners = new Set<() => void>()
let frame = 0

function set(patch: Partial<RunState>, now = true) {
  state = { ...state, ...patch }
  if (now) {
    cancelAnimationFrame(frame)
    frame = 0
    listeners.forEach((l) => l())
  } else if (!frame) {
    // Output lines can arrive thousands per second; flush once per frame.
    frame = requestAnimationFrame(() => {
      frame = 0
      listeners.forEach((l) => l())
    })
  }
}

let worker: Worker
let settle: ((s: RunState) => void) | undefined
let timer: ReturnType<typeof setTimeout>

function spawn() {
  // Served unbundled from /public: Pyodide needs a *module* worker (see the file header).
  worker = new Worker(/* turbopackIgnore: true */ "/python.worker.js", {
    type: "module",
  })
  worker.onmessage = ({ data }) => {
    if (data.type === "ready")
      return set({
        booted: true,
        phase: state.status === "running" ? "compiling" : state.phase,
      })
    if (data.type === "phase") {
      if (data.phase === "running") {
        timer = setTimeout(
          () =>
            finish({
              status: "timeout",
              error: `Stopped after ${TIMEOUT_MS / 1000}s: is there an infinite loop?`,
            }),
          TIMEOUT_MS
        )
      }
      return set({ phase: data.phase })
    }
    if (data.type === "line") {
      if (state.lines.length >= MAX_LINES)
        return finish({
          status: "stopped",
          error: `Stopped: more than ${MAX_LINES} lines of output.`,
        })
      return set(
        { lines: [...state.lines, { kind: data.kind, text: data.text }] },
        false
      )
    }
    if (data.type === "done") {
      finish({
        status: data.error ? "error" : "done",
        ms: data.ms,
        error: data.error,
        errorLine: data.errorLine,
        check: data.check,
        inspect: data.inspect,
      })
    }
  }
}
// Boot Python as soon as the app loads in a browser (never during server rendering).
if (typeof window !== "undefined") spawn()

function finish(patch: Partial<RunState>) {
  clearTimeout(timer)
  set({ ...patch, phase: undefined })
  if (patch.status === "timeout" || patch.status === "stopped") {
    // A busy worker can't be interrupted without SharedArrayBuffer; replace it.
    worker.terminate()
    state = { ...state, booted: false }
    spawn()
  }
  settle?.(state)
  settle = undefined
}

export function run(code: string, check?: string): Promise<RunState> {
  if (state.status === "running") stop()
  set({
    status: "running",
    phase: state.booted ? "compiling" : "booting",
    lines: [],
    ms: undefined,
    error: undefined,
    errorLine: undefined,
    check: undefined,
    inspect: undefined,
    runKey: state.runKey + 1,
  })
  worker.postMessage({ code, check })
  return new Promise((resolve) => (settle = resolve))
}

export function stop() {
  if (state.status === "running")
    finish({ status: "stopped", error: "Stopped by you." })
}

/** Show a past run (from history) in the output pane. */
export function show(
  r: Pick<
    RunState,
    "status" | "lines" | "ms" | "error" | "errorLine" | "check" | "inspect"
  >
) {
  if (state.status === "running") stop()
  set({ ...r, phase: undefined, runKey: state.runKey + 1 })
}

export function reset() {
  set({
    status: "idle",
    lines: [],
    ms: undefined,
    error: undefined,
    errorLine: undefined,
    check: undefined,
    inspect: undefined,
    phase: undefined,
  })
}

export function useRunner() {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => state,
    () => state
  )
}
