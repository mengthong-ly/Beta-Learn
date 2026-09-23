import assert from "node:assert/strict"
import { test } from "node:test"

import { extend, left, pause, resume, start, startBreak, tick } from "./focus-timer.ts"

const MIN = 60_000

test("a focus block counts down from its end time", () => {
  const t = start(25, 0)
  assert.equal(left(t, 10 * MIN), 15 * MIN)
  assert.equal(tick(t, 10 * MIN), t)
})

test("an expired focus block waits for the learner to start the break", () => {
  const t = tick(start(25, 0), 26 * MIN)
  assert.deepEqual(t, { phase: "done", preset: 25 })
  const b = startBreak(t, 30 * MIN)
  assert.equal(b.phase, "break")
  assert.equal(left(b, 30 * MIN), 5 * MIN) // 25-min preset → 5-min break
  assert.deepEqual(tick(b, 36 * MIN), { phase: "idle" })
})

test("break length follows the preset", () => {
  assert.equal(left(startBreak(start(15, 0), 0), 0), 3 * MIN)
  assert.equal(left(startBreak(start(45, 0), 0), 0), 10 * MIN)
})

test("pause freezes the time left; resume carries it on", () => {
  const p = pause(start(25, 0), 5 * MIN)
  assert.equal(left(p, 99 * MIN), 20 * MIN)
  assert.deepEqual(tick(p, 99 * MIN), p)
  const r = resume(p, 50 * MIN)
  assert.equal(left(r, 60 * MIN), 10 * MIN)
})

test("+5 min adds to a running, paused or finished block", () => {
  assert.equal(left(extend(start(25, 0), 0), 0), 30 * MIN)
  assert.equal(left(extend(pause(start(25, 0), 5 * MIN), 0), 0), 25 * MIN)
  const d = extend({ phase: "done", preset: 25 }, 40 * MIN)
  assert.equal(d.phase, "focus")
  assert.equal(left(d, 40 * MIN), 5 * MIN)
})

test("time left never goes negative", () => {
  assert.equal(left(start(25, 0), 99 * MIN), 0)
  assert.equal(left({ phase: "idle" }, 0), 0)
})
