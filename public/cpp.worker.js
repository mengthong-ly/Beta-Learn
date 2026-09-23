// ThongLearn's C++ runtime: clang and LLD (LLVM 22, YoWASP's build, ISC) compiled to WebAssembly
// and loaded from jsDelivr, so nothing is bundled or hosted by us. The toolchain is ~23 MB on the
// first run and cached by the browser after that; each run compiles the lesson to wasm and runs it
// under WASI (@bjorn3/browser_wasi_shim). Compiling and running happen in public/cpp-run.js, which
// scripts/check-content.ts uses too. Speaks the Python worker's protocol.
// Unbundled module worker in /public, like python.worker.js.
import { compileAndRun } from "/cpp-run.js"

const CLANG = "https://cdn.jsdelivr.net/npm/@yowasp/clang@22.0.0-git20542-10/gen/bundle.js"
const WASI = "https://cdn.jsdelivr.net/npm/@bjorn3/browser_wasi_shim@0.4.2/+esm"

let downloaded = false
const ready = (async () => {
  // Small loaders: the toolchain itself (~23 MB) downloads on the first compile.
  const [clang, wasi] = await Promise.all([import(CLANG), import(WASI)])
  postMessage({ type: "ready" })
  return { clang, wasi }
})()

self.onmessage = async ({ data: { code, check } }) => {
  const { clang, wasi } = await ready
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
