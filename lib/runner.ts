"use client"

import { useSyncExternalStore } from "react"

import type { Course } from "./courses"

export type Line = { kind: "out" | "err"; text: string }
export type Phase = "booting" | "compiling" | "installing" | "running"
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
  /** what the "running" step says, e.g. "Running with dart" */
  label?: string
  /** React and Flutter render into the Preview tab */
  preview?:
    | { kind: "react"; code: string; check?: string }
    | { kind: "url"; url: string }
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

let worker: Worker | undefined
let settle: ((s: RunState) => void) | undefined
let timer: ReturnType<typeof setTimeout>
let aborter: AbortController | undefined
let previewFrame: Window | null = null

/** Boot Python ahead of the first run (only Python pages call this: it downloads ~10 MB). */
export function warmPython() {
  if (typeof window !== "undefined" && !worker) spawn()
}

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
function finish(patch: Partial<RunState>) {
  clearTimeout(timer)
  set({ ...patch, phase: undefined })
  if (patch.status === "timeout" || patch.status === "stopped") {
    aborter?.abort() // the local runner kills the process when the request goes away
    if (state.preview?.kind === "react") set({ preview: undefined }) // unmounting ends a runaway loop
    if (worker && busyWorker) {
      // A busy worker can't be interrupted without SharedArrayBuffer; replace it.
      worker.terminate()
      state = { ...state, booted: false }
      spawn()
    }
  }
  busyWorker = false
  aborter = undefined
  settle?.(state)
  settle = undefined
}
let busyWorker = false

const isLocal = () => ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname)

const runnerOff =
  "This course runs on your computer, and the local runner is off. Start ThongLearn with `npm run dev` (and run `npm run setup:runtimes` once)."

/** Whether Run and Check work here: browser runtimes anywhere; local ones only in a local copy (the website never calls your machine). */
export function useCanRun(course: Pick<Course, "runtime">) {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => course.runtime !== "local" || isLocal(),
    () => course.runtime !== "local"
  )
}

export function run(
  code: string,
  check: string | undefined,
  course: Pick<Course, "id" | "runtime">
): Promise<RunState> {
  if (state.status === "running") stop()
  const fresh = {
    status: "running" as const,
    lines: [],
    ms: undefined,
    error: undefined,
    errorLine: undefined,
    check: undefined,
    inspect: undefined,
    label: undefined,
    runKey: state.runKey + 1,
  }
  const done = new Promise<RunState>((resolve) => (settle = resolve))

  if (course.runtime === "pyodide") {
    warmPython()
    busyWorker = true
    set({ ...fresh, phase: state.booted ? "compiling" : "booting" })
    worker!.postMessage({ code, check })
  } else if (course.runtime === "react") {
    set({ ...fresh, phase: "running", label: "Rendering", preview: { kind: "react", code, check } })
    timer = setTimeout(
      () => finish({ status: "timeout", error: `Stopped after ${TIMEOUT_MS / 1000}s: is there an infinite loop?` }),
      TIMEOUT_MS
    )
  } else {
    const building = course.id === "flutter" && !check
    set({
      ...fresh,
      phase: "running",
      label: building
        ? "Building with Flutter (the first build takes a while)"
        : `Running on your computer (${course.id === "flutter" ? "flutter test" : course.id})`,
    })
    aborter = new AbortController()
    fetch("/api/run", {
      method: "POST",
      headers: { "content-type": "application/json", "x-thonglearn-run": "1" },
      body: JSON.stringify({ course: course.id, code, check }),
      signal: aborter.signal,
    })
      .then(async (res) => {
        if (res.status === 403) return finish({ status: "error", error: runnerOff })
        const r = await res.json()
        finish({
          status: r.error ? "error" : "done",
          lines: r.lines ?? [],
          ms: r.ms,
          error: r.error,
          errorLine: r.errorLine,
          check: r.check,
          ...(r.previewUrl && { preview: { kind: "url" as const, url: r.previewUrl } }),
        })
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") finish({ status: "error", error: runnerOff })
      })
  }
  return done
}

export function stop() {
  if (state.status === "running")
    finish({ status: "stopped", error: "Stopped by you." })
}

/** The Preview tab registers its React iframe; only messages from it are trusted. */
export function setPreviewFrame(w: Window | null) {
  previewFrame = w
}

if (typeof window !== "undefined")
  window.addEventListener("message", ({ source, data }) => {
    if (!previewFrame || source !== previewFrame || !data?.thonglearn) return
    if (state.status !== "running") return
    if (data.type === "line")
      return set({ lines: [...state.lines, { kind: data.kind, text: data.text }].slice(0, MAX_LINES) }, false)
    if (data.type === "done")
      finish({
        status: data.error ? "error" : "done",
        ms: data.ms,
        error: data.error,
        errorLine: data.errorLine,
        check: data.check,
      })
  })

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
    preview: undefined,
    label: undefined,
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
