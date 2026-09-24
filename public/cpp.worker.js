// ThongLearn's C++ runtime: clang and LLD (LLVM 22, YoWASP's build, ISC) compiled to WebAssembly
// and loaded from jsDelivr, so nothing is bundled or hosted by us. The toolchain is ~23 MB on the
// first run and cached by the browser after that; each run compiles the lesson to wasm and runs it
// under WASI (@bjorn3/browser_wasi_shim). Compiling and running happen in public/cpp-run.js, which
// scripts/check-content.ts uses too. Speaks the Python worker's protocol, including its
// Visualize-tab trace jobs (public/cpp-trace.js). Unbundled module worker in /public, like python.worker.js.
import { compileAndRun } from "/cpp-run.js"
import { traceCpp } from "/cpp-trace.js"

const CLANG = "https://cdn.jsdelivr.net/npm/@yowasp/clang@22.0.0-git20542-10/gen/bundle.js"
const WASI = "https://cdn.jsdelivr.net/npm/@bjorn3/browser_wasi_shim@0.4.2/+esm"
// The Visualize tab's parser (~0.2 MB + ~3.4 MB grammar), loaded on the first trace only.
const TREE_SITTER = "https://cdn.jsdelivr.net/npm/web-tree-sitter@0.27.0/web-tree-sitter.js"
const CPP_GRAMMAR = "https://cdn.jsdelivr.net/npm/tree-sitter-cpp@0.23.4/tree-sitter-cpp.wasm"

let downloaded = false
const ready = (async () => {
  // Small loaders: the toolchain itself (~23 MB) downloads on the first compile.
  const [clang, wasi] = await Promise.all([import(CLANG), import(WASI)])
  postMessage({ type: "ready" })
  return { clang, wasi }
})()

let parser
const loadParser = async () => {
  const { Parser, Language } = await import(TREE_SITTER)
  await Parser.init()
  const p = new Parser()
  p.setLanguage(await Language.load(CPP_GRAMMAR))
  return p
}

// Visualize tab: the same compile as a run, of the recording build, with every message tagged
// with the job id so the runner never mixes it up with a Run.
async function traceJob({ clang, wasi }, { id, code }) {
  const post = (m) => postMessage({ ...m, job: "trace", id })
  const started = performance.now()
  post({ type: "phase", phase: downloaded ? "compiling" : "installing" })
  parser ??= loadParser()
  const r = await traceCpp(clang.commands["clang++"], wasi, await parser, code, () =>
    post({ type: "phase", phase: "running" })
  )
  downloaded = true
  post({ type: "done", ms: Math.round(performance.now() - started), ...r })
}

self.onmessage = async ({ data }) => {
  const { clang, wasi } = await ready
  if (data.type === "trace") return traceJob({ clang, wasi }, data)
  const { code, check } = data
  const started = performance.now()
  if (!downloaded) postMessage({ type: "phase", phase: "installing" })
  else postMessage({ type: "phase", phase: "compiling" })
  const r = await compileAndRun(clang.commands["clang++"], wasi, { code, check }, () =>
    postMessage({ type: "phase", phase: "running" })
  )
  downloaded = true
  for (const l of r.lines) postMessage({ type: "line", ...l })
  postMessage({
    type: "done",
    ms: Math.round(performance.now() - started),
    error: r.error,
    errorLine: r.errorLine,
    check: r.check,
  })
}
