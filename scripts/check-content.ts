// Verifies all course content by running it for real:
//   lessons: the solution passes its check, the starter does NOT, every example runs
//   guide:   every example runs (blocks with an "error!" comment are meant to fail)
// Python runs in Pyodide (anything on stderr, e.g. a pandas FutureWarning, fails; the Inspect
// collector runs too). PHP, Laravel, TypeScript, Dart and Flutter run on the local toolchains
// (lib/local-runner.ts, needs `npm run setup:runtimes`). React is transpiled and server-rendered.
// Examples are fences in the course's language (```php); use ```php-snippet for code that isn't
// a whole runnable program.
// Usage: npm run check:content [-- course ...]    e.g. npm run check:content -- php dart
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

import { courses, type Course } from "../lib/courses.ts"
import { parseLesson } from "../lib/lesson-parser.ts"
import { runLocal, type LocalCourse } from "../lib/local-runner.ts"
import { cleanTraceback } from "../public/traceback.js"

type Result = { error?: string; check?: { pass: boolean; message?: string } }
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

const local =
  (course: LocalCourse): Execute =>
  (code, check) =>
    runLocal(course, code, check, { flutterMode: "test" })

async function executor(c: Course): Promise<Execute> {
  if (c.runtime === "pyodide") return python()
  if (c.runtime === "react") return react()
  return local(c.id as LocalCourse)
}

const only = process.argv.slice(2)
let failed = 0
for (const c of courses.filter((c) => !only.length || only.includes(c.id))) {
  const execute = await executor(c)
  const examplesRe = new RegExp("```" + c.lang + "\\n([\\s\\S]*?)```", "g")
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
      const l = parseLesson(
        file,
        readFileSync(new URL(file, folder), "utf8"),
        dir === "lessons" ? "lesson" : "guide"
      )
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
        }
      } else if (!l.summary) problems.push("missing summary")
      const examples = [...l.body.matchAll(examplesRe)].map((m) => m[1])
      if (dir === "guide" && examples.length < 3)
        problems.push(`only ${examples.length} examples`)
      for (const code of examples) {
        const r = await execute(code)
        if (r.error && !marksError(code))
          problems.push(`example fails: ${r.error.split("\n")[0]}\n      ${code.split("\n")[0]}`)
        if (!r.error && marksError(code))
          problems.push(`example marked "error!" didn't fail: ${code.split("\n")[0]}`)
      }
      console.log(
        `${problems.length ? "✗" : "✓"} ${file}${problems.length ? "  → " + problems.join("; ") : ""}`
      )
      failed += problems.length ? 1 : 0
    }
  }
}
console.log(failed ? `\n${failed} file(s) failed` : "\nAll content passes")
process.exit(failed ? 1 : 0)
