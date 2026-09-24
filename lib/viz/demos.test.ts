// Keeps the hand-written demo events honest: every demo's code runs in real Python
// (Pyodide, as scripts/check-content.ts does) and must print and leave behind exactly
// what the replayed events say.
import assert from "node:assert/strict"
import { test } from "node:test"

import { DEMOS } from "./demos.ts"
import { replay } from "./program.ts"

const { loadPyodide } = await import("pyodide")
const py = await loadPyodide()

const run = (code: string) => {
  const out: string[] = []
  py.setStdout({ batched: (line: string) => out.push(line) })
  const ns = py.globals.get("dict")()
  py.runPython(code, { globals: ns })
  const vars = JSON.parse(
    py.runPython(
      "import json, types\njson.dumps({k: v for k, v in __ns__.items() if not k.startswith('__') and not callable(v) and not isinstance(v, types.ModuleType)})",
      { globals: py.toPy({ __ns__: ns }) }
    )
  )
  ns.destroy()
  return { out, vars }
}

for (const demo of DEMOS) {
  test(`demo "${demo.id}" matches real Python`, () => {
    const lines = demo.code.split("\n").length
    for (const st of demo.steps)
      assert.ok(
        st.line >= 1 && st.line <= lines,
        `line ${st.line} is in the code`
      )
    const p = replay(demo.steps, demo.steps.length - 1)
    const real = run(demo.code)
    assert.deepEqual(p.output, real.out)
    const mine = Object.fromEntries(
      Object.entries(p.globals).map(([k, b]) => [
        k,
        "ref" in b ? p.lists[b.ref] : b.val,
      ])
    )
    assert.deepEqual(mine, real.vars)
  })
}

test("pipeline tokens and bytecode are what CPython produces", () => {
  const demo = DEMOS.find((d) => d.id === "pipeline")!
  const payload = replay(demo.steps, demo.steps.length - 1).payloads
  const real = JSON.parse(
    py.runPython(`
import io, json, tokenize, dis
src = ${JSON.stringify(demo.code + "\n")}
toks = [tokenize.tok_name[t.type] + ("" if t.type in (tokenize.NEWLINE, tokenize.ENDMARKER) else " " + repr(t.string))
        for t in tokenize.generate_tokens(io.StringIO(src).readline)]
ops = [(i.opname + " " + (i.argrepr or ("" if i.arg is None else str(i.arg)))).strip()
       for i in dis.get_instructions(compile(src, "<exec>", "exec")) if i.opname not in ("RESUME", "CACHE", "NOP")]
json.dumps({"tokens": toks, "bytecode": ops})
`)
  )
  assert.deepEqual(payload.tokens, real.tokens)
  assert.deepEqual(payload.bytecode, real.bytecode)
})
