// The tracer in real Pyodide: trace a program, turn it into steps, replay the steps, and
// require the replay to leave exactly what Python left (variables and output).
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

import { cleanTraceback } from "../../public/traceback.js"
import { replay } from "./program.ts"
import { toSteps, type Snap, type TValue } from "./trace-events.ts"

const { loadPyodide } = await import("pyodide")
const py = await loadPyodide()
py.runPython(
  readFileSync(new URL("../../public/inspect.py", import.meta.url), "utf8")
)

type Raw = {
  snaps: Snap[]
  truncated: boolean
  stdout: string
  error: string | null
}

function traceOf(code: string) {
  const ns = py.globals.get("dict")()
  ns.set("__name__", "__main__")
  const compiled = py.runPython(
    `compile(${JSON.stringify(code)}, "<exec>", "exec")`
  )
  const raw: Raw = JSON.parse(py.globals.get("__trace__")(ns, compiled))
  py.globals.set("__ns__", ns)
  const real = JSON.parse(
    py.runPython(
      "import json as _j\n_l = {}\n_v = {k: _trace_value(v, _l) for k, v in __ns__.items() if not k.startswith('__') and not isinstance(v, _SKIP)}\n_j.dumps({'vars': _v, 'lists': _l})"
    )
  ) as {
    vars: Record<string, TValue>
    lists: Record<string, { items: unknown[] }>
  }
  compiled.destroy()
  ns.destroy()
  return { raw, real }
}

const PROGRAMS: Record<string, string> = {
  lists:
    "a = [3, 1]\na.append(4)\na.insert(0, 9)\nx = a.pop(1)\na[0] = 7\nb = a\nb.append(5)\ndel x\nprint(a)",
  swap: "a = [1, 2, 3]\na[0], a[2] = a[2], a[0]\nprint(a)",
  alias_param:
    "def grow(nums, k):\n    total = 0\n    for n in nums:\n        total += n * k\n    nums.append(total)\n    return total\n\ndata = [1, 2]\nr = grow(data, 3)\nprint(r, data)",
  two_functions:
    "def inc(n):\n    return n + 1\n\ndef twice(n):\n    return inc(n) * 2\n\nprint(twice(3))",
  recursion:
    "def fact(n):\n    if n == 1:\n        return 1\n    return n * fact(n - 1)\n\nresult = fact(4)",
  cards: "d = {'a': 1}\ns = 'hi'\nt = (1, 2)\nd['b'] = 2\nf = float('nan')",
  sort: "a = [3, 1, 2]\na.sort()\nb = sorted(a, key=lambda v: -v)\nprint(a, b)",
}

for (const [name, code] of Object.entries(PROGRAMS)) {
  test(`round trip: ${name}`, () => {
    const { raw, real } = traceOf(code)
    assert.equal(raw.error, null)
    const steps = toSteps(raw)
    const p = replay(steps, steps.length - 1)
    const mine = Object.fromEntries(
      Object.entries(p.globals).map(([k, b]) => [
        k,
        "ref" in b ? p.lists[b.ref] : b.val,
      ])
    )
    const theirs = Object.fromEntries(
      Object.entries(real.vars).map(([k, v]) => [
        k,
        typeof v === "object" && v !== null && "ref" in v
          ? real.lists[v.ref].items
          : v,
      ])
    )
    assert.deepEqual(mine, theirs)
    assert.deepEqual(
      p.output,
      raw.stdout ? raw.stdout.replace(/\n$/, "").split("\n") : []
    )
    assert.ok(
      steps.every((s) => s.line >= 1 && s.line <= code.split("\n").length)
    )
  })
}

test("only the learner's frames are recorded", () => {
  const { raw } = traceOf("import json\nx = json.dumps([1])")
  assert.ok(raw.snaps.every((s) => s.frames.every((f) => f.fn === "<module>")))
})

test("an infinite loop stops at the cap", () => {
  const { raw } = traceOf("while True:\n    pass")
  assert.equal(raw.truncated, true)
  assert.equal(raw.snaps.length, 500)
})

test("the cap survives except Exception", () => {
  const { raw } = traceOf(
    "try:\n    while True:\n        pass\nexcept Exception:\n    print('caught')"
  )
  assert.equal(raw.truncated, true)
  assert.equal(raw.stdout, "")
})

test("a list that contains itself is safe", () => {
  const { raw } = traceOf("a = [1]\na.append(a)")
  const last = raw.snaps.at(-1)!
  const id = (
    last.frames[0].vars.find(([n]) => n === "a")![1] as { ref: string }
  ).ref
  assert.deepEqual(last.lists[id].items[1], {
    repr: "[1, [...]]",
    type: "list",
  })
})

test("an exception ends the steps with the cleaned error on its line", () => {
  const { raw } = traceOf("a = [1]\na.append(2)\nprint(a[5])")
  const err = cleanTraceback(raw.error!)
  assert.equal(err.line, 3)
  assert.match(err.text, /IndexError/)
  const steps = toSteps(raw, err)
  assert.equal(steps.at(-1)!.event.type, "error")
  assert.equal(steps.at(-1)!.line, 3)
})
