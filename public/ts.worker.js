// ThongLearn's TypeScript runtime, part 1: type-checks and emits a lesson with TypeScript 6
// (public/ts-compile.js, the same compiler check-content uses). The emitted JavaScript runs in
// the sandboxed iframe public/ts-run.html, which lib/runner.ts mounts on "compiled".
// Speaks the Python worker's protocol: { type: "ready" | "phase" | "done" } plus "compiled".
// Unbundled module worker in /public, like python.worker.js.
import { compile } from "/ts-compile.js"

const load = (file) => fetch(`/generated/ts/${file}`).then((r) => r.json())
const ready = (async () => {
  const [{ default: ts }, libs] = await Promise.all([
    import("/generated/ts/typescript.mjs"),
    load("libs.json"),
  ])
  postMessage({ type: "ready" })
  return { ts, libs }
})()
let types // the MCP SDK's and zod's, fetched on the first lesson that imports them

self.onmessage = async ({ data: { code, check } }) => {
  const { ts, libs } = await ready
  const started = performance.now()
  postMessage({ type: "phase", phase: "compiling" })
  const packages = /@modelcontextprotocol\/sdk|["']zod["'/]/.test(code + (check ?? ""))
  if (packages) types ??= await load("mcp-types.json")
  const r = compile(ts, packages ? { ...libs, ...types } : libs, code, check)
  if (r.error)
    return postMessage({ type: "done", ms: Math.round(performance.now() - started), error: r.error, errorLine: r.errorLine })
  postMessage({ type: "compiled", main: r.main, check: r.check })
}
