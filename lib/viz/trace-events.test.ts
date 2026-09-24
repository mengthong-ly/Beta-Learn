import assert from "node:assert/strict"
import { test } from "node:test"

import type { Val, VizEvent } from "./events.ts"
import { replay } from "./program.ts"
import { listOps, toSteps, type Snap, type TValue } from "./trace-events.ts"

const mod = (...vars: [string, TValue][]) => ({ fn: "<module>", vars })
const L = (...items: Val[]) => ({ items, more: 0 })
const S = (
  line: number,
  frames: Snap["frames"],
  lists: Snap["lists"] = {},
  out = 0,
  extra: Partial<Snap> = {}
): Snap => ({ line, event: "line", frames, lists, out, ...extra })
const run = (
  snaps: Snap[],
  stdout = "",
  error?: { text: string; line?: number }
) => toSteps({ snaps, truncated: false, stdout }, error)
const events = (s: { event: VizEvent }[]) => s.map((x) => x.event)
const a = (id = "x"): TValue => ({ ref: id })

test("listOps: append, insert, pop, set, swap", () => {
  assert.deepEqual(listOps("a", [1, 2], [1, 2, 3]), [
    { type: "array.insert", name: "a", index: 2, value: 3 },
  ])
  assert.deepEqual(listOps("a", [1, 2, 3], [0, 1, 2, 3]), [
    { type: "array.insert", name: "a", index: 0, value: 0 },
  ])
  assert.deepEqual(listOps("a", [1, 2, 3], [1, 3]), [
    { type: "array.remove", name: "a", index: 1 },
  ])
  assert.deepEqual(listOps("a", [1, 2, 3], [1, 9, 3]), [
    { type: "array.set", name: "a", index: 1, value: 9 },
  ])
  assert.deepEqual(listOps("a", [1, 2, 3], [3, 2, 1]), [
    { type: "array.set", name: "a", index: 0, value: 3 },
    { type: "array.set", name: "a", index: 2, value: 1 },
  ])
})

test("creating and appending: one step each, on the line that ran", () => {
  const s = run([
    S(1, [mod()]),
    S(2, [mod(["a", a()])], { x: L(3, 1) }),
    S(3, [mod(["a", a()])], { x: L(3, 1, 4) }),
  ])
  assert.deepEqual(events(s), [
    { type: "array.create", name: "a", values: [3, 1] },
    { type: "array.insert", name: "a", index: 2, value: 4 },
  ])
  assert.deepEqual(
    s.map((x) => x.line),
    [1, 2]
  )
  assert.ok(s[1].note.includes("added to the end"))
})

test("x = a.pop(1) is one step: the removed value lands in x", () => {
  const s = run([
    S(1, [mod()]),
    S(2, [mod(["a", a()])], { x: L(1, 2, 3) }),
    S(3, [mod(["a", a()], ["y", 2])], { x: L(1, 3) }),
  ])
  assert.deepEqual(events(s).at(-1), {
    type: "array.remove",
    name: "a",
    index: 1,
    into: "y",
  })
  assert.equal(s.length, 2)
})

test("b = a is aliasing; a change through b is a change to a's list", () => {
  const s = run([
    S(1, [mod()]),
    S(2, [mod(["a", a()])], { x: L(1) }),
    S(3, [mod(["a", a()], ["b", a()])], { x: L(1) }),
    S(4, [mod(["a", a()], ["b", a()])], { x: L(1, 2) }),
  ])
  assert.deepEqual(events(s)[1], { type: "ref.set", name: "b", to: "a" })
  const p = replay(s, s.length - 1)
  assert.deepEqual(p.lists.L1, [1, 2])
})

test("a call with an aliased list, locals, return and the caller's assignment", () => {
  const f = (...vars: [string, TValue][]) => ({ fn: "grow", vars })
  const s = run([
    S(5, [mod()]),
    S(6, [mod(["data", a()])], { x: L(1, 2) }),
    S(1, [mod(["data", a()]), f(["nums", a()])], { x: L(1, 2) }, 0, {
      event: "call",
    }),
    S(2, [mod(["data", a()]), f(["nums", a()])], { x: L(1, 2) }),
    S(3, [mod(["data", a()]), f(["nums", a()])], { x: L(1, 2, 3) }, 0, {
      event: "return",
      ret: 3,
    }),
    S(7, [mod(["data", a()], ["r", 3])], { x: L(1, 2, 3) }),
  ])
  assert.deepEqual(events(s), [
    { type: "array.create", name: "data", values: [1, 2] },
    { type: "call", fn: "grow", args: [["nums", { alias: "data" }]] },
    { type: "array.insert", name: "nums", index: 2, value: 3 },
    { type: "return", fn: "grow", value: 3 },
    { type: "var.set", name: "r", value: 3 },
  ])
  assert.deepEqual(
    s.map((x) => x.line),
    [5, 6, 2, 3, 6]
  )
  const p = replay(s, s.length - 1)
  assert.deepEqual(p.lists.L1, [1, 2, 3])
  assert.deepEqual(p.globals.r, { val: 3 })
})

test("prints, including output without a trailing newline", () => {
  const s = run(
    [S(1, [mod()]), S(2, [mod()], {}, 2), S(3, [mod()], {}, 3)],
    "a\nb"
  )
  assert.deepEqual(events(s), [
    { type: "print", text: "a" },
    { type: "print", text: "b" },
  ])
})

test("del, and a final error step", () => {
  const s = run([S(1, [mod()]), S(2, [mod(["x", 1])]), S(3, [mod()])], "", {
    text: "NameError: name 'x' is not defined",
    line: 3,
  })
  assert.deepEqual(events(s), [
    { type: "var.set", name: "x", value: 1 },
    { type: "var.del", name: "x" },
    { type: "error", text: "NameError: name 'x' is not defined" },
  ])
  assert.equal(s.at(-1)!.line, 3)
})

test("an unexpressible change is skipped instead of breaking the replay", () => {
  // list y changes but no visible name holds it
  const s = run([S(1, [mod()], { y: L(1) }), S(2, [mod()], { y: L(1, 2) })])
  assert.deepEqual(s, [])
})
