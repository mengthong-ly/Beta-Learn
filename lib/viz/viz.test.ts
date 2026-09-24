import assert from "node:assert/strict"
import { test } from "node:test"

import { frameAt } from "./beat.ts"
import type { Step, VizEvent } from "./events.ts"
import { boxBounds, isoPath, project } from "./iso.ts"
import { apply, EMPTY, replay } from "./program.ts"

const steps = (...events: VizEvent[]): Step[] => events.map((event, i) => ({ event, line: i + 1, note: "" }))
const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-6, `${a} ≈ ${b}`)

test("project: the x and y axes sit 120° apart on screen, z goes straight up", () => {
  const x = project({ x: 1, y: 0 })
  const y = project({ x: 0, y: 1 })
  near(Math.atan2(y.y, y.x) - Math.atan2(x.y, x.x), (2 * Math.PI) / 3)
  assert.deepEqual(project({ x: 0, y: 0, z: 5 }), { x: 0, y: -5 })
})

test("boxBounds covers the projected corners", () => {
  const b = boxBounds({ w: 10, d: 20, h: 5 })
  near(b.minX, project({ x: 0, y: 20 }).x)
  near(b.maxX, project({ x: 10, y: 0 }).x)
  assert.equal(b.minY, -5)
  near(b.maxY, project({ x: 10, y: 20 }).y)
})

test("isoPath: the iso route bends once and ends where it should", () => {
  const { d } = isoPath({ x: 0, y: 0 }, { x: 40, y: 100 }, "iso")
  const nums = d.match(/-?[\d.]+/g)!.map(Number)
  assert.equal(nums.length, 6)
  assert.deepEqual(nums.slice(4), [40, 100])
  // the corner is on the x axis from a: dy/dx = S/C
  assert.ok(Math.abs(nums[3] / nums[2] - Math.tan(Math.PI / 6)) < 1e-3) // path is rounded to 0.01px
})

test("list operations follow Python: append, insert, pop, set", () => {
  const p = replay(
    steps(
      { type: "array.create", name: "a", values: [10, 20, 30] },
      { type: "array.insert", name: "a", index: 3, value: 40 },
      { type: "array.insert", name: "a", index: 1, value: 15 },
      { type: "array.remove", name: "a", index: 2, into: "x" },
      { type: "array.set", name: "a", index: 0, value: 99 }
    ),
    4
  )
  assert.deepEqual(p.lists.L1, [99, 15, 30, 40])
  assert.deepEqual(p.globals.x, { val: 20 })
})

test("impossible events throw instead of drawing nonsense", () => {
  const p = apply(EMPTY, { type: "array.create", name: "a", values: [1] })
  assert.throws(() => apply(p, { type: "array.remove", name: "a", index: 1 }))
  assert.throws(() => apply(p, { type: "array.insert", name: "a", index: 3, value: 0 }))
  assert.throws(() => apply(EMPTY, { type: "return", fn: "f", value: 1 }))
})

test("element ids survive neighbours shifting", () => {
  const s = steps(
    { type: "array.create", name: "a", values: [10, 20, 30] },
    { type: "array.insert", name: "a", index: 0, value: 5 },
    { type: "array.remove", name: "a", index: 2 }
  )
  const [ten, twenty, thirty] = frameAt(s, 0).scene.ids.L1
  const inserted = frameAt(s, 1)
  assert.deepEqual(inserted.scene.ids.L1.slice(1), [ten, twenty, thirty])
  assert.deepEqual(inserted.beat.entering, [inserted.scene.ids.L1[0]])
  const removed = frameAt(s, 2)
  assert.deepEqual(removed.scene.ids.L1, [inserted.scene.ids.L1[0], ten, thirty])
  assert.deepEqual(removed.beat.exiting, [twenty])
})

test("stepping back is the same as replaying to that step", () => {
  const s = steps(
    { type: "array.create", name: "a", values: [1, 2] },
    { type: "array.insert", name: "a", index: 2, value: 3 },
    { type: "var.set", name: "x", value: 7 }
  )
  assert.deepEqual(frameAt(s, 1).scene, frameAt(s.slice(0, 2), 1).scene)
  assert.deepEqual(frameAt(s, 1).program, replay(s, 1))
})

test("calls stack up, returns hand the value to the caller's frame", () => {
  const s = steps(
    { type: "call", fn: "f", args: [["n", 2]] },
    { type: "call", fn: "f", args: [["n", 1]] },
    { type: "return", fn: "f", value: 1 },
    { type: "return", fn: "f", value: 2 },
    { type: "var.set", name: "r", value: 2 }
  )
  assert.equal(frameAt(s, 1).program.frames.length, 2)
  const back = frameAt(s, 2)
  assert.equal(back.program.frames[0].got, 1)
  assert.deepEqual(back.beat.flights, [{ from: "fn:f:frame:1", to: "fn:f:frame:0", label: "1" }])
  assert.deepEqual(frameAt(s, 3).beat.flights[0].to, "fn:f:out")
  const set = frameAt(s, 4).beat
  assert.deepEqual(set.flights, [{ from: "fn:f:out", to: "var:r", label: "2" }])
  assert.deepEqual(set.particles, ["fn:f->scope"])
})

test("a loop copies each element into the loop variable, print flows to output", () => {
  const s = steps(
    { type: "array.create", name: "a", values: [10, 20] },
    { type: "loop.iter", array: "a", index: 1, variable: "n" },
    { type: "print", text: "20" }
  )
  const iter = frameAt(s, 1)
  const id = iter.scene.ids.L1[1]
  assert.deepEqual(iter.beat.flights, [{ from: `el:${id}`, to: "var:n", label: "20" }])
  assert.deepEqual(frameAt(s, 2).beat.particles, ["list:L1->output"])
  assert.deepEqual(frameAt(s, 2).beat.flights[0], { from: `el:${id}`, to: "output", label: "20" })
})
