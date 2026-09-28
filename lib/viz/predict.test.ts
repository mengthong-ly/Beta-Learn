import assert from "node:assert/strict"
import { test } from "node:test"

import type { Step } from "./events.ts"
import { claimsError, comparePrediction, divergenceStep } from "./predict.ts"

const step = (event: Step["event"]): Step => ({ event, line: 1, note: "" })

test("an exact match", () => {
  const r = comparePrediction("1\n2", "1\n2")
  assert.equal(r.match, true)
  assert.equal(r.firstBadLine, undefined)
})

test("trailing whitespace and a trailing newline don't count as a difference", () => {
  assert.equal(comparePrediction("1 \n2\n\n", "1\n2").match, true)
})

test("a wrong middle line names that line", () => {
  const r = comparePrediction("1\n9\n3", "1\n2\n3")
  assert.equal(r.match, false)
  assert.equal(r.firstBadLine, 2)
})

test("a guess that stops short points at the first missing line", () => {
  assert.equal(comparePrediction("1\n2", "1\n2\n3").firstBadLine, 3)
})

test("a guess that runs long points at the first extra line", () => {
  assert.equal(comparePrediction("1\n2\n3", "1\n2").firstBadLine, 3)
})

test("expecting output when it prints nothing is a mismatch on line 1", () => {
  assert.equal(comparePrediction("5", "").firstBadLine, 1)
})

test("predicting nothing when it prints nothing is a match", () => {
  assert.equal(comparePrediction("", "").match, true)
})

test("predicting that it fails counts as a match", () => {
  const err = "ZeroDivisionError: division by zero"
  assert.equal(comparePrediction("it crashes", "", err).match, true)
  assert.equal(comparePrediction("a ZeroDivisionError", "", err).match, true)
  assert.equal(comparePrediction("raises", "", err).match, true)
})

test("predicting output when it actually fails is a mismatch", () => {
  const r = comparePrediction("3", "", "ZeroDivisionError: division by zero")
  assert.equal(r.match, false)
  assert.equal(r.firstBadLine, 1)
})

test("claimsError needs the word or the exception name, not any prose", () => {
  assert.equal(claimsError("prints 3", "ValueError: bad"), false)
  assert.equal(claimsError("valueerror", "ValueError: bad"), true)
})

test("divergenceStep finds the print that produced the bad line", () => {
  const steps = [
    step({ type: "var.set", name: "x", value: 1 }),
    step({ type: "print", text: "a\n" }),
    step({ type: "var.set", name: "y", value: 2 }),
    step({ type: "print", text: "b\n" }),
    step({ type: "print", text: "c\n" }),
  ]
  assert.equal(divergenceStep(steps, 1), 1)
  assert.equal(divergenceStep(steps, 2), 3)
  assert.equal(divergenceStep(steps, 3), 4)
})

test("divergenceStep counts a multi-line print as several lines", () => {
  const steps = [step({ type: "print", text: "a\nb\n" }), step({ type: "print", text: "c\n" })]
  assert.equal(divergenceStep(steps, 2), 0)
  assert.equal(divergenceStep(steps, 3), 1)
})

test("divergenceStep lands on the error when the program stopped there", () => {
  const steps = [step({ type: "print", text: "a\n" }), step({ type: "error", text: "boom" })]
  assert.equal(divergenceStep(steps, 2), 1)
})

test("divergenceStep gives up rather than seeking somewhere arbitrary", () => {
  assert.equal(divergenceStep([step({ type: "print", text: "a\n" })], 9), undefined)
})
