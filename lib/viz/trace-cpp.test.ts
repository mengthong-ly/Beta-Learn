// The C++ tracer with the real clang: instrument a program, run it, turn the snapshots into
// steps, replay them, and require the replay to reach what the program itself recorded.
import assert from "node:assert/strict"
import { test } from "node:test"

import { commands } from "@yowasp/clang"
import * as wasi from "@bjorn3/browser_wasi_shim"
import { Language, Parser } from "web-tree-sitter"

import { compileAndRun } from "../../public/cpp-run.js"
import { instrument, STEPS, traceCpp } from "../../public/cpp-trace.js"
import { replay } from "./program.ts"
import { toSteps, type Snap, type Trace } from "./trace-events.ts"

await Parser.init()
const parser = new Parser()
parser.setLanguage(
  await Language.load(
    new URL(
      "../../node_modules/tree-sitter-cpp/tree-sitter-cpp.wasm",
      import.meta.url
    ).pathname
  )
)
const clang = commands["clang++"]

type Result = { trace?: Trace; error?: string; errorLine?: number }
const traceOf = (code: string): Promise<Result> =>
  traceCpp(clang, wasi, parser, code)

const main = (body: string, before = "") =>
  `#include <iostream>\n#include <string>\n#include <vector>\n${before}\nint main() {\n${body}\n  return 0;\n}\n`

const PROGRAMS: Record<string, string> = {
  scalars: main(
    `  int a = 1;\n  a += 2;\n  double d = 1.5;\n  bool ok = a > 2;\n  char c = 'x';\n  std::string s = "hi";\n  s += "!";\n  std::cout << s << " " << a << "\\n";`
  ),
  vectors: main(
    `  std::vector<int> v = {3, 1};\n  v.push_back(4);\n  v.insert(v.begin(), 9);\n  v.erase(v.begin() + 1);\n  v[0] = 7;\n  v.pop_back();\n  std::vector<int>& w = v;\n  w.push_back(5);\n  for (int x : v) std::cout << x << " ";\n  std::cout << "\\n";`
  ),
  alias_param: main(
    `  std::vector<int> data = {1, 2};\n  int r = grow(data, 3);\n  std::cout << r << " " << data.size() << "\\n";`,
    `int grow(std::vector<int>& nums, int k) {\n  int total = 0;\n  for (int n : nums) total += n * k;\n  nums.push_back(total);\n  return total;\n}`
  ),
  recursion: main(
    `  int result = fact(4);\n  std::cout << result << "\\n";`,
    `int fact(int n) {\n  if (n == 1) return 1;\n  return n * fact(n - 1);\n}`
  ),
  loops: main(
    `  int total = 0;\n  for (int i = 0; i < 3; i++)\n    total += i;\n  int k = 3;\n  while (k > 0) k--;\n  do { total++; } while (total < 5);`
  ),
  structs: main(
    `  Book b{"Dune", 412};\n  b.pages += 1;\n  Counter c{5};\n  c.increment();\n  std::cout << b.title << " " << c.value() << "\\n";`,
    `struct Book {\n  std::string title;\n  int pages = 0;\n};\n\nclass Counter {\n public:\n  explicit Counter(int start) : count_{start} {}\n  void increment() { ++count_; }\n  int value() const { return count_; }\n\n private:\n  int count_ = 0;\n};`
  ),
  globals: main(`  hits++;\n  std::cout << hits << "\\n";`, `int hits = 0;`),
  no_newline: main(`  std::cout << "a" << "\\n" << "b";`),
}

type Plain = Record<string, unknown>

/** A snapshot frame's variables with lists resolved to their items. */
const resolved = (s: Snap, d: number): Plain =>
  Object.fromEntries(
    s.frames[d].vars.map(([n, v]) => [
      n,
      typeof v === "object" && v !== null && "ref" in v
        ? s.lists[v.ref].items
        : v,
    ])
  )

for (const [name, code] of Object.entries(PROGRAMS)) {
  test(`round trip: ${name}`, async () => {
    const { trace, error } = await traceOf(code)
    assert.equal(error, undefined)
    assert.ok(trace && !trace.truncated)

    // instrumenting doesn't change what the program prints
    const plain = await compileAndRun(clang, wasi, { code })
    assert.equal(
      trace.stdout.replace(/\n$/, ""),
      plain.lines.map((l: { text: string }) => l.text).join("\n")
    )

    const steps = toSteps(trace, undefined, "cpp")
    const lines = code.split("\n").length
    assert.ok(steps.every((s) => s.line >= 1 && s.line <= lines))

    // main's last line (return 0) sees everything main did; the replay must agree
    const last = trace.snaps.findLast(
      (s) => s.event === "line" && s.frames.at(-1)!.fn === "main"
    )!
    const ret = steps.findIndex(
      (s) => s.event.type === "return" && s.event.fn === "main"
    )
    assert.ok(ret > 0)
    const p = replay(steps, ret - 1)
    const top = p.frames.at(-1)!
    assert.equal(top.fn, "main")
    const mine = Object.fromEntries(
      Object.entries(top.locals).map(([k, b]) => [
        k,
        "ref" in b ? p.lists[b.ref] : b.val,
      ])
    )
    assert.deepEqual(mine, resolved(last, last.frames.length - 1))
    assert.deepEqual(
      replay(steps, steps.length - 1).output,
      trace.stdout ? trace.stdout.replace(/\n$/, "").split("\n") : []
    )
  })
}

test("C++ values keep C++ spelling", async () => {
  const { trace } = await traceOf(PROGRAMS.scalars)
  const vars = resolved(trace!.snaps.at(-2)!, 1)
  assert.deepEqual(vars, {
    a: 3,
    d: 1.5,
    ok: { repr: "true", type: "bool" },
    c: { repr: "'x'", type: "char" },
    s: { repr: '"hi!"', type: "string" },
  })
})

test("a vector reference parameter is the caller's vector", async () => {
  const { trace } = await traceOf(PROGRAMS.alias_param)
  const call = trace!.snaps.find(
    (s) => s.event === "call" && s.frames.at(-1)!.fn === "grow"
  )!
  const [, nums] = call.frames.at(-1)!.vars.find(([n]) => n === "nums")!
  const [, data] = call.frames.at(-2)!.vars.find(([n]) => n === "data")!
  assert.deepEqual(nums, data)
  const steps = toSteps(trace!, undefined, "cpp")
  const callStep = steps.find(
    (s) => s.event.type === "call" && s.event.fn === "grow"
  )!
  assert.deepEqual(callStep.event, {
    type: "call",
    fn: "grow",
    args: [
      ["nums", { alias: "data" }],
      ["k", 3],
    ],
  })
})

test("structs show field by field, private members included", async () => {
  const { trace } = await traceOf(PROGRAMS.structs)
  const vars = resolved(trace!.snaps.at(-2)!, 1)
  assert.deepEqual(vars.b, {
    repr: 'Book{title: "Dune", pages: 413}',
    type: "Book",
  })
  assert.deepEqual(vars.c, { repr: "Counter{count_: 6}", type: "Counter" })
  const steps = toSteps(trace!, undefined, "cpp")
  assert.ok(
    steps.some(
      (s) => s.event.type === "call" && s.event.fn === "Counter::increment"
    )
  )
})

test("recursion opens a frame per call and returns values", async () => {
  const { trace } = await traceOf(PROGRAMS.recursion)
  const steps = toSteps(trace!, undefined, "cpp")
  const returns = steps.filter(
    (s) => s.event.type === "return" && s.event.fn === "fact"
  )
  assert.deepEqual(
    returns.map((s) => (s.event as { value: unknown }).value),
    [1, 2, 6, 24]
  )
  assert.match(returns[0].note, /fact returns 1/)
})

test("a loop header lights on every pass, and the counter changes there", async () => {
  const { trace } = await traceOf(PROGRAMS.loops)
  const steps = toSteps(trace!, undefined, "cpp")
  const header = 7 // for (int i = 0; ...)
  const i = steps.filter(
    (s) => s.event.type === "var.set" && s.event.name === "i"
  )
  assert.equal(i.length, 4) // 0, 1, 2, 3
  assert.ok(i.every((s) => s.line === header))
})

test("C++ notes say vector and cout", async () => {
  const { trace } = await traceOf(PROGRAMS.vectors)
  const notes = toSteps(trace!, undefined, "cpp")
    .map((s) => s.note)
    .join("\n")
  assert.match(notes, /A new vector v is created, holding \{3, 1\}/)
  assert.match(notes, /cout writes "7 1 5 " to the output/)
  assert.doesNotMatch(notes, /list|print\(\)/)
})

test("an infinite loop stops at the cap", async () => {
  const { trace, error } = await traceOf(
    main("  int n = 0;\n  while (true) n++;")
  )
  assert.equal(error, undefined)
  assert.equal(trace!.truncated, true)
  assert.equal(trace!.snaps.length, STEPS)
})

test("a crash keeps the steps before it", async () => {
  const { trace, error } = await traceOf(
    main("  std::vector<int> v = {1};\n  v.push_back(2);\n  int x = v.at(5);")
  )
  assert.match(error!, /stopped/)
  assert.ok(trace!.snaps.length > 2)
})

test("a compile error is the plain compiler error", async () => {
  const { trace, error, errorLine } = await traceOf(main("  int x = ;"))
  assert.equal(trace, undefined)
  assert.match(error!, /main\.cpp:6/)
  assert.equal(errorLine, 6)
})

test("the rewrite keeps every line where it was", () => {
  const code =
    PROGRAMS.structs + PROGRAMS.loops.replace(/int main/, "int main2")
  const out = instrument(parser, code)
  const body = out.slice(out.indexOf("#line 1\n") + "#line 1\n".length)
  const orig = code.split("\n")
  // each original line's first token is still on that line
  body
    .split("\n")
    .slice(0, orig.length)
    .forEach((l, i) => {
      const first = orig[i].trim().split(/\s+/)[0]
      if (first) assert.ok(l.includes(first), `line ${i + 1}: ${l}`)
    })
})

test("single statements get braces, returns get recorded", () => {
  const out = instrument(
    parser,
    "int f(int n) {\n  if (n) return n + 1;\n  return 0;\n}\n"
  )
  assert.match(
    out,
    /if \(n\) \{ __viz::line\(2, .*?\); return __vf\.result\(n \+ 1\); \}/
  )
  assert.match(out, /return __vf\.result\(0\);/)
})

test("two calls in one statement both open and close their frames", async () => {
  const code = main(
    `  std::cout << one() + fib(3) << "\\n";`,
    `int one() { return 1; }\nint fib(int n) { return n < 2 ? n : fib(n - 1) + fib(n - 2); }`
  )
  const { trace } = await traceOf(code)
  const events = toSteps(trace!, undefined, "cpp")
    .map((s) => s.event)
    .filter((e) => e.type === "call" || e.type === "return")
    .map((e) => `${e.type} ${(e as { fn: string }).fn}`)
  assert.deepEqual(events, [
    "call main",
    "call one",
    "return one",
    "call fib",
    "call fib",
    "call fib",
    "return fib",
    "call fib",
    "return fib",
    "return fib",
    "call fib",
    "return fib",
    "return fib",
    "return main",
  ])
})

test("a return is on its own line; falling off the end is on the closing brace", async () => {
  const code = main(
    `  greet(false);\n  greet(true);`,
    `void greet(bool quiet) {\n  if (quiet) return;\n  std::cout << "hi\\n";\n}`
  )
  const { trace } = await traceOf(code)
  const returns = trace!.snaps
    .filter((s) => s.event === "return")
    .map((s) => s.line)
  // greet(false) ends at its brace (line 7), greet(true) at `return;` (line 5), main at `return 0;` (11)
  assert.deepEqual(returns, [7, 5, 11])
})
