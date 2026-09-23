// Verifies all course content by running it for real:
//   lessons: the solution passes its check, the starter does NOT, every example runs
//   guide:   every example runs (blocks with an "error!" comment are meant to fail)
// Python runs in Pyodide (anything on stderr, e.g. a pandas FutureWarning, fails; the Inspect
// collector runs too). TypeScript compiles with the browser runtime's compiler (public/ts-compile.js)
// and runs in Node; PHP and Laravel run on the browser runtime's php-wasm build for Node
// (public/php-run.js, public/laravel-app.json.gz). Dart, C++ and Flutter run on the local toolchains
// (lib/local-runner.ts, needs `npm run setup:runtimes`). React is transpiled and server-rendered.
// Examples are fences in the course's language (```php); use ```php-snippet for code that isn't
// a whole runnable program.
// Usage: npm run check:content [-- course ...]    e.g. npm run check:content -- php dart
import { spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { gunzipSync } from "node:zlib"

import { courses, type Course } from "../lib/courses.ts"
import { parseLesson, type Output } from "../lib/lesson-parser.ts"
import { examples as examplesIn, outputKey, readOutputs, writeOutputs } from "../lib/outputs.ts"
import { runLocal, type LocalCourse } from "../lib/local-runner.ts"
import { cleanTraceback } from "../public/traceback.js"

type Result = { error?: string; check?: { pass: boolean; message?: string }; lines?: Output["lines"] }
type Execute = (code: string, check?: string) => Promise<Result>

// --- Python: Pyodide in Node, set up exactly like public/python.worker.js ---
async function python(): Promise<Execute> {
  const { loadPyodide } = await import("pyodide")
  const py = await loadPyodide()
  await py.loadPackage("pandas", { messageCallback: () => {} })
  py.runPython(
    "import pandas\npandas.set_option('display.width', 120, 'display.max_columns', 20)"
  )
  const dataDir = new URL("../public/data/", import.meta.url)
  const datasets = readdirSync(dataDir).map(
    (f) => [f, readFileSync(new URL(f, dataDir), "utf8")] as const
  )
  py.runPython(
    readFileSync(new URL("../public/inspect.py", import.meta.url), "utf8")
  )
  const quiet = () => {
    py.setStdout({ batched: () => {} })
    py.setStderr({ batched: () => {} })
  }
  /** Run like the app does; throws the cleaned last traceback line. */
  function run(code: string, check?: string) {
    const out: string[] = []
    const err: string[] = []
    py.setStdout({ batched: (s) => out.push(s) })
    py.setStderr({ batched: (s) => err.push(s) })
    for (const [name, text] of datasets) py.FS.writeFile(name, text)
    const ns = py.globals.get("dict")()
    ns.set("__name__", "__main__")
    ns.set("__src__", code)
    try {
      py.runPython(
        "__code__ = compile(__src__, '<exec>', 'exec')\nexec(__code__, globals())",
        { globals: ns }
      )
      JSON.parse(py.globals.get("__inspect__")(ns, ns.get("__code__")))
      ns.set("__stdout__", out.join("\n"))
      if (check) py.runPython(check, { globals: ns })
    } catch (e) {
      throw new Error(
        cleanTraceback(String((e as Error).message))
          .text.split("\n")
          .at(-1)
      )
    } finally {
      quiet()
    }
    if (err.length) throw new Error(`wrote to stderr: ${err[0]}`)
  }
  return async (code, check) => {
    try {
      run(code, check)
      return check ? { check: { pass: true } } : {}
    } catch (e) {
      const message = (e as Error).message
      return check ? { check: { pass: false, message } } : { error: message }
    }
  }
}

// --- React: transpile with the repo's TypeScript, render on the server. ---
// ponytail: checks query a live DOM, so they're verified in the browser, not here; add a
// headless DOM (e.g. jsdom) if React content grows past what browser spot-checks cover.
async function react(): Promise<Execute> {
  const { default: ts } = await import("typescript")
  const { createElement } = await import("react")
  const { renderToString } = await import("react-dom/server")
  const cache = path.join(process.cwd(), "node_modules/.cache/thonglearn")
  mkdirSync(cache, { recursive: true })
  let n = 0
  return async (code, check) => {
    const out = ts.transpileModule(code, {
      reportDiagnostics: true,
      fileName: "App.tsx",
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    })
    if (out.diagnostics?.length)
      return { error: ts.flattenDiagnosticMessageText(out.diagnostics[0].messageText, "\n") }
    const file = path.join(cache, `lesson-${process.pid}-${n++}.mjs`)
    writeFileSync(file, out.outputText)
    try {
      const mod = await import(pathToFileURL(file).href)
      if (typeof mod.default !== "function") return { error: "no default export component" }
      renderToString(createElement(mod.default))
      return check ? { check: { pass: true, message: "unverified" } } : {}
    } catch (e) {
      return { error: (e as Error).message }
    }
  }
}

// --- TypeScript: the browser runtime's compiler (TS 6, in memory), then Node runs the output. ---
async function typescript(): Promise<Execute> {
  const { default: ts } = await import("typescript-6")
  const { compile, CHECK_MARK } = await import("../public/ts-compile.js")
  const read = (f: string) =>
    JSON.parse(readFileSync(new URL(`../public/generated/ts/${f}`, import.meta.url), "utf8"))
  const files = { ...read("libs.json"), ...read("mcp-types.json") }
  const cache = path.join(process.cwd(), "node_modules/.cache/thonglearn")
  mkdirSync(cache, { recursive: true })
  return async (code, check) => {
    const js = compile(ts, files, code, check)
    if (js.error) return { error: js.error, lines: [] }
    // Inside the repo, so Node finds @modelcontextprotocol/sdk and zod in node_modules.
    const dir = mkdtempSync(path.join(cache, "ts-"))
    try {
      writeFileSync(path.join(dir, "package.json"), '{ "type": "module" }')
      writeFileSync(path.join(dir, "main.js"), js.main)
      if (js.check) writeFileSync(path.join(dir, "check.js"), js.check)
      const r = spawnSync("node", [js.check ? "check.js" : "main.js"], { cwd: dir, encoding: "utf8", timeout: 20_000 })
      let verdict: Result["check"]
      const err = r.stderr.split("\n").filter((l) => {
        if (!l.startsWith(CHECK_MARK)) return true
        verdict = JSON.parse(l.slice(CHECK_MARK.length))
        return false
      })
      const lines = [
        ...r.stdout.split("\n").filter(Boolean).map((text) => ({ kind: "out" as const, text })),
        ...err.filter(Boolean).map((text) => ({ kind: "err" as const, text })),
      ]
      if (r.status !== 0 && !verdict) return { error: err.join("\n").trim() || `exit ${r.status}`, lines }
      return { check: verdict, lines }
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }
}

// --- PHP: the browser runtime's PHP 8.5 (php-wasm) for Node, one CLI instance per run. ---
async function php(laravel: boolean): Promise<Execute> {
  const { PHP, loadPHPRuntime } = await import("@php-wasm/universal")
  const { getPHPLoaderModule } = await import("@php-wasm/node-8-5")
  const { LARAVEL, mountLaravel, runPhp } = await import("../public/php-run.js")
  const app = laravel && JSON.parse(gunzipSync(readFileSync(new URL("../public/laravel-app.json.gz", import.meta.url))).toString())
  const loader = await getPHPLoaderModule()
  // Compile the 21 MB module once; each run then gets a fresh instance in ~30 ms.
  const wasm = await WebAssembly.compile(readFileSync(loader.dependencyFilename))
  const instantiateWasm = (imports: WebAssembly.Imports, receive: (i: WebAssembly.Instance, m: WebAssembly.Module) => void) => {
    WebAssembly.instantiate(wasm, imports).then((i) => receive(i, wasm))
    return {}
  }
  return async (code, check) => {
    const instance = new PHP(await loadPHPRuntime(loader, { instantiateWasm }))
    if (app) mountLaravel(instance, app)
    return runPhp(instance, app ? { code, check, ...LARAVEL } : { code, check })
  }
}

const local =
  (course: LocalCourse): Execute =>
  (code, check) =>
    runLocal(course, code, check, { flutterMode: "test" })

async function executor(c: Course): Promise<Execute> {
  if (c.runtime === "pyodide") return python()
  if (c.runtime === "react") return react()
  if (c.runtime === "ts") return typescript()
  if (c.runtime === "php") return php(c.id === "laravel")
  return local(c.id as LocalCourse)
}

// --record saves each example's and solution's real output for the courses the website can't run
// (Flutter prints nothing worth showing), so write-only lessons can show it.
const record = process.argv.includes("--record")
const only = process.argv.slice(2).filter((a) => a !== "--record")
let failed = 0
for (const c of courses.filter((c) => !only.length || only.includes(c.id))) {
  const execute = await executor(c)
  const recorded = c.runtime === "local" && c.id !== "flutter"
  const outputs = recorded ? readOutputs(c.id) : {}
  const fresh: Record<string, Output> = {}
  /** Records r (or runs code for it) under --record; otherwise reports a missing recording. */
  const note = async (code: string, r?: Result) => {
    if (!recorded) return
    const k = outputKey(code)
    if (!record) return outputs[k] ? undefined : `no recorded output: run npm run check:content -- --record ${c.id}`
    r ??= await execute(code)
    fresh[k] = { lines: r.lines ?? [], ...(r.error && { error: r.error }) }
  }
  const marksError = (code: string) => /(#|\/\/) error!/.test(code)
  for (const dir of ["lessons", "guide"] as const) {
    const folder = new URL(`../content/${c.id}/${dir}/`, import.meta.url)
    let files: string[]
    try {
      files = readdirSync(folder)
        .filter((f) => f.endsWith(".md"))
        .sort()
    } catch {
      continue // the guide is optional
    }
    console.log(`\n${c.id}/${dir}`)
    for (const file of files) {
      let l: ReturnType<typeof parseLesson>
      try {
        l = parseLesson(
          file,
          readFileSync(new URL(file, folder), "utf8"),
          dir === "lessons" ? "lesson" : "guide"
        )
      } catch (e) {
        console.log(`✗ ${file}  → ${(e as Error).message}`)
        failed++
        continue
      }
      const problems: string[] = []
      if (dir === "lessons") {
        if (!l.starter.trim()) problems.push("missing starter")
        if (!l.solution || !l.check) problems.push("missing solution/check")
        else {
          const sol = await execute(l.solution, l.check)
          if (!sol.check?.pass)
            problems.push(`solution fails: ${sol.error ?? sol.check?.message}`)
          const start = await execute(l.starter, l.check)
          if (start.check?.pass && start.check.message !== "unverified")
            problems.push("starter already passes the check")
          const missing = await note(l.solution) // run again without the check for clean output
          if (missing) problems.push(missing)
        }
      } else if (!l.summary) problems.push("missing summary")
      const examples = examplesIn(l.body, c.lang)
      if (dir === "guide" && examples.length < 3)
        problems.push(`only ${examples.length} examples`)
      for (const code of examples) {
        const r = await execute(code)
        if (r.error && !marksError(code))
          problems.push(`example fails: ${r.error.split("\n")[0]}\n      ${code.split("\n")[0]}`)
        if (!r.error && marksError(code))
          problems.push(`example marked "error!" didn't fail: ${code.split("\n")[0]}`)
        const missing = await note(code, r)
        if (missing) problems.push(missing)
      }
      // "What does this print?": the + answer must be the real output.
      for (const q of l.quiz ?? []) {
        if (!q.code) continue
        const want = q.options[q.answer].trim()
        // ponytail: Python and C++ only; add the others (PHP $output, TS/Dart output)
        // when those courses get quizzes.
        const assertOutput =
          c.runtime === "pyodide"
            ? `assert __stdout__.strip() == ${JSON.stringify(want)}, "printed " + repr(__stdout__.strip())`
            : c.id === "cpp"
              ? `    std::string all;
    for (const std::string &line : output) { all += line; all += "\\n"; }
    while (!all.empty() && all.back() == '\\n') all.pop_back();
    expect(all == ${JSON.stringify(want)}, "printed " + all);`
              : undefined
        if (!assertOutput) {
          problems.push("quiz code questions are only verified for Python and C++ so far")
          break
        }
        const r = await execute(q.code, assertOutput)
        if (!r.check?.pass)
          problems.push(`quiz answer wrong for "${q.prompt}": ${r.check?.message}`)
      }
      console.log(
        `${problems.length ? "✗" : "✓"} ${file}${problems.length ? "  → " + problems.join("; ") : ""}`
      )
      failed += problems.length ? 1 : 0
    }
  }
  if (record && recorded) writeOutputs(c.id, fresh)
}
console.log(failed ? `\n${failed} file(s) failed` : "\nAll content passes")
process.exit(failed ? 1 : 0)
