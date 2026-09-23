// ThongLearn's PHP runtime: PHP 8.5 compiled to WebAssembly (WordPress Playground's php-wasm),
// loaded from jsDelivr, never bundled or hosted by us (it's GPL). The 21 MB module compiles once;
// every run gets a fresh PHP instance and runs the php CLI through public/php-run.js, like
// the local runner did. Speaks the Python worker's protocol: { type: "ready" | "phase" | "done" }.
// Unbundled module worker in /public, like python.worker.js.
import { runPhp } from "/php-run.js"

const V = "3.1.55"
const ready = (async () => {
  const { PHP, loadPHPRuntime } = await import(`https://cdn.jsdelivr.net/npm/@php-wasm/universal@${V}/+esm`)
  // JSPI where the browser has it (Chromium), asyncify elsewhere.
  const base = `https://cdn.jsdelivr.net/npm/@php-wasm/web-8-5@${V}/${typeof WebAssembly.Suspending === "function" ? "jspi" : "asyncify"}/`
  const wasm = base + "8_5_10/php_8_5.wasm"
  // The loader imports its .wasm the way a bundler would; point it at the CDN file instead.
  const glue = (await (await fetch(base + "php_8_5.js")).text()).replace(
    /import dependencyFilename from '[^']+';/,
    `const dependencyFilename = ${JSON.stringify(wasm)};`
  )
  const [loader, wasmModule] = await Promise.all([
    import(URL.createObjectURL(new Blob([glue], { type: "text/javascript" }))),
    WebAssembly.compileStreaming(fetch(wasm)),
  ])
  const instantiateWasm = (imports, receive) => {
    WebAssembly.instantiate(wasmModule, imports).then((i) => receive(i, wasmModule))
    return {}
  }
  postMessage({ type: "ready" })
  return async () => new PHP(await loadPHPRuntime(loader, { instantiateWasm }))
})()

self.onmessage = async ({ data: { code, check } }) => {
  const fresh = await ready
  const started = performance.now()
  postMessage({ type: "phase", phase: "running" })
  const r = await runPhp(await fresh(), { code, check })
  for (const l of r.lines) postMessage({ type: "line", ...l })
  postMessage({ type: "done", ms: Math.round(performance.now() - started), error: r.error, errorLine: r.errorLine, check: r.check })
}
