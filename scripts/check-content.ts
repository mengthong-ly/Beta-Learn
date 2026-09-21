// Verifies all content in real Python (Pyodide in Node):
//   lessons: the solution passes its check, the starter does NOT, every example runs
//   guide:   every example runs (blocks containing "# error!" are meant to fail)
// Also runs the Inspect collector on every solution/example so a Python upgrade can't silently break it.
// Usage: npm run check:content
import { readdirSync, readFileSync } from "node:fs"
import { loadPyodide } from "pyodide"

import { parseLesson } from "../lib/lesson-parser.ts"
import { cleanTraceback } from "../public/traceback.js"

const py = await loadPyodide()
py.runPython(
  readFileSync(new URL("../public/inspect.py", import.meta.url), "utf8")
)
const quiet = () => {
  py.setStdout({ batched: () => {} })
  py.setStderr({ batched: () => {} })
}

/** Run like the app does; returns stdout, or throws the cleaned last traceback line. */
function run(
  code: string,
  extra?: (ns: ReturnType<typeof py.globals.get>) => void
) {
  const out: string[] = []
  py.setStdout({ batched: (s) => out.push(s) })
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
    extra?.(ns)
  } catch (e) {
    throw new Error(
      cleanTraceback(String((e as Error).message))
        .text.split("\n")
        .at(-1)
    )
  } finally {
    quiet()
  }
}

let failed = 0
for (const dir of ["lessons", "guide"] as const) {
  const folder = new URL(`../content/${dir}/`, import.meta.url)
  console.log(`\n${dir}`)
  for (const file of readdirSync(folder)
    .filter((f) => f.endsWith(".md"))
    .sort()) {
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
        try {
          run(l.solution, (ns) => py.runPython(l.check!, { globals: ns }))
        } catch (e) {
          problems.push(`solution fails: ${(e as Error).message}`)
        }
        try {
          run(l.starter, (ns) => py.runPython(l.check!, { globals: ns }))
          problems.push("starter already passes the check")
        } catch {
          /* expected */
        }
      }
    } else if (!l.summary) problems.push("missing summary")
    const examples = [...l.body.matchAll(/```python\n([\s\S]*?)```/g)].map(
      (m) => m[1]
    )
    if (dir === "guide" && examples.length < 3)
      problems.push(`only ${examples.length} examples`)
    for (const code of examples) {
      try {
        run(code)
        if (code.includes("# error!"))
          problems.push(
            `example marked "# error!" didn't fail: ${code.split("\n")[0]}`
          )
      } catch (e) {
        if (!code.includes("# error!"))
          problems.push(
            `example fails: ${(e as Error).message}\n      ${code.split("\n")[0]}`
          )
      }
    }
    console.log(
      `${problems.length ? "✗" : "✓"} ${file}${problems.length ? "  → " + problems.join("; ") : ""}`
    )
    failed += problems.length ? 1 : 0
  }
}
console.log(failed ? `\n${failed} file(s) failed` : "\nAll content passes")
process.exit(failed ? 1 : 0)
