import assert from "node:assert/strict"
import { test } from "node:test"

import { placeFrom, START_POINTS } from "./placement.ts"

test("someone who has never coded starts at the very beginning", () => {
  assert.equal(placeFrom({ coded: "never", tools: "no", x: "unsure" }), START_POINTS.basics)
})

test("knowing the tools skips Units 1–2", () => {
  assert.equal(placeFrom({ coded: "never", tools: "use", x: "unsure" }), START_POINTS.thinking)
})

test("a tutorial-level learner who gets the variable question right starts at the building blocks", () => {
  assert.equal(placeFrom({ coded: "tutorial", tools: "heard", x: "6" }), START_POINTS.blocks)
})

test("a tutorial-level learner who misses the variable question does not skip the building blocks", () => {
  assert.notEqual(placeFrom({ coded: "tutorial", tools: "heard", x: "5" }), START_POINTS.blocks)
})

test("someone who builds things and gets it right may skip Fundamentals", () => {
  assert.equal(placeFrom({ coded: "builds", tools: "use", x: "6" }), "skip")
})

test("someone who says they build things but misses it is not offered the skip", () => {
  assert.equal(placeFrom({ coded: "builds", tools: "use", x: "x + 1" }), START_POINTS.thinking)
})
