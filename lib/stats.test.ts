import assert from "node:assert/strict"
import { test } from "node:test"

import { streak, xp } from "./stats.ts"

const at = (day: number, hour = 10) => new Date(2026, 8, day, hour).getTime()

test("streak counts consecutive local days back from today", () => {
  const now = at(22, 18)
  assert.equal(streak([], now), 0)
  assert.equal(streak([at(22), at(22, 11), at(21), at(20)], now), 3)
  assert.equal(streak([at(22), at(20)], now), 1) // gap on the 21st
})

test("a streak survives until today is over", () => {
  assert.equal(streak([at(21), at(20)], at(22, 9)), 2)
  assert.equal(streak([at(20)], at(22, 9)), 0)
})

test("xp: 10/lesson, 2/quiz point, 50/section quiz passed, 200/final passed", () => {
  assert.equal(xp(0, []), 0)
  assert.equal(
    xp(3, [
      { key: "python/print", best: 4 },
      { key: "python/section:1", best: 9, passedAt: 1 },
      { key: "python/section:2", best: 2 },
      { key: "python/final", best: 18, passedAt: 1 },
    ]),
    30 + 8 + 50 + 200
  )
})
