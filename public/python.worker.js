// ThongLearn's Python runtime. A plain *module* worker served from /public:
// Turbopack would bundle a worker as a classic script, and Pyodide 314 refuses to
// run in classic workers. Created with new Worker("/python.worker.js", { type: "module" }).
import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs"

import { cleanTraceback } from "./traceback.js"

// Practice datasets (public/data) for the file and pandas lessons. Written into Python's
// working directory before every run, so a lesson that overwrites one can't break the next.
const DATASETS = ["sales.csv", "sales_raw.csv", "students.csv", "branches.csv"]
let datasets = []

const ready = (async () => {
  const py = await loadPyodide()
  py.setStdin({
    stdin: () => {
      throw new Error("input() isn't supported here yet: assign the value in code instead.")
    },
  })
  py.runPython(await (await fetch("/inspect.py")).text())
  datasets = await Promise.all(
    DATASETS.map(async (name) => [name, await (await fetch(`/data/${name}`)).text()])
  )
  postMessage({ type: "ready" })
  return py
})()

// Visualize tab: the same setup as a run, but under __trace__ (public/inspect.py), and every
// message tagged with the job id so the runner never mixes it up with a Run.
async function traceJob(py, { id, code }) {
  const post = (m) => postMessage({ ...m, job: "trace", id })
  const ns = py.globals.get("dict")()
  ns.set("__name__", "__main__")
  ns.set("__src__", code)
  const t0 = performance.now()
  try {
    post({ type: "phase", phase: "compiling" })
    py.runPython("__code__ = compile(__src__, '<exec>', 'exec')", { globals: ns, filename: "<thonglearn>" })
    await py.loadPackagesFromImports(code, { messageCallback: () => post({ type: "phase", phase: "installing" }) })
    post({ type: "phase", phase: "running" })
    const res = JSON.parse(py.globals.get("__trace__")(ns, ns.get("__code__")))
    const err = res.error ? cleanTraceback(res.error) : undefined
    post({
      type: "done",
      ms: performance.now() - t0,
      trace: { snaps: res.snaps, truncated: res.truncated, stdout: res.stdout },
      error: err?.text,
      errorLine: err?.line,
    })
  } catch (e) {
    // a syntax error: nothing ran, so there's nothing to trace
    const { text, line } = cleanTraceback(String(e.message))
    post({ type: "done", ms: performance.now() - t0, error: text, errorLine: line })
  } finally {
    ns.destroy()
  }
}

self.onmessage = async ({ data }) => {
  const py = await ready
  for (const [name, text] of datasets) py.FS.writeFile(name, text)
  if (data.type === "trace") return traceJob(py, data)
  const stdout = []
  py.setStdout({
    batched: (line) => {
      stdout.push(line)
      postMessage({ type: "line", kind: "out", text: line })
    },
  })
  py.setStderr({ batched: (line) => postMessage({ type: "line", kind: "err", text: line }) })

  // Fresh namespace per run so lessons never leak state into each other.
  const ns = py.globals.get("dict")()
  ns.set("__name__", "__main__")
  ns.set("__src__", data.code)
  const t0 = performance.now()
  let inspect
  // The batched handlers only see a line once it ends in "\n" or the fd is fsync'd (flush() alone isn't enough), so
  // print("x", end="!") would sit in the buffer until some later run.
  const flush = () =>
    py.runPython("import os, sys\nfor f in (sys.stdout, sys.stderr): f.flush(); os.fsync(f.fileno())")
  const collect = () => {
    try {
      inspect = JSON.parse(py.globals.get("__inspect__")(ns, ns.get("__code__")))
    } catch {
      /* no code object (syntax error) → nothing to inspect */
    }
  }
  try {
    postMessage({ type: "phase", phase: "compiling" })
    py.runPython("__code__ = compile(__src__, '<exec>', 'exec')", { globals: ns, filename: "<thonglearn>" })
    // pandas & numpy download on first import. Loading and importing them happens here,
    // before the "running" phase, so it never counts against the run timeout.
    await py.loadPackagesFromImports(data.code, {
      messageCallback: () => postMessage({ type: "phase", phase: "installing" }),
    })
    if (py.loadedPackages.pandas)
      py.runPython("import pandas\npandas.set_option('display.width', 120, 'display.max_columns', 20)")
    postMessage({ type: "phase", phase: "running" })
    py.runPython("exec(__code__, globals())", { globals: ns, filename: "<thonglearn>" })
  } catch (e) {
    flush()
    const { text, line } = cleanTraceback(String(e.message))
    const ms = performance.now() - t0
    collect()
    postMessage({ type: "done", ms, error: text, errorLine: line, inspect })
    ns.destroy()
    return
  }
  flush()
  const ms = performance.now() - t0
  collect()

  let check
  if (data.check) {
    ns.set("__stdout__", stdout.join("\n"))
    try {
      py.runPython(data.check, { globals: ns, filename: "<thonglearn>" })
      check = { pass: true }
    } catch (e) {
      const msg = String(e.message).trim().split("\n").at(-1) ?? ""
      check = {
        pass: false,
        message: msg.replace(/^AssertionError:?\s*/, "") || "Not quite: your output doesn't match yet.",
      }
    }
  }
  postMessage({ type: "done", ms, check, inspect })
  ns.destroy()
}
