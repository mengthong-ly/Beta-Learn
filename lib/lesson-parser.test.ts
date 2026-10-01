import assert from "node:assert/strict"
import { test } from "node:test"

import { splitSteps } from "./lesson-parser.ts"

test("splits at ## headings; the intro is an untitled first step", () => {
  const steps = splitSteps("Intro.\n\n## One\n\nA.\n\n## Two\n\nB.")
  assert.deepEqual(steps, [
    { body: "Intro." },
    { title: "One", body: "## One\n\nA." },
    { title: "Two", body: "## Two\n\nB." },
  ])
})

test("--- starts a new step that keeps the current title", () => {
  const steps = splitSteps("## One\n\nA.\n\n---\n\nB.")
  assert.deepEqual(steps, [
    { title: "One", body: "## One\n\nA." },
    { title: "One", body: "B." },
  ])
})

test("ignores --- and ## inside code fences", () => {
  const body = "Intro.\n\n```markdown\n---\nname: x\n---\n## not a heading\n```\n\nAfter."
  assert.deepEqual(splitSteps(body), [{ body }])
})

test("never yields empty steps", () => {
  const steps = splitSteps("---\n\nA.\n\n---\n\n## One\n\nB.\n\n---\n")
  assert.deepEqual(steps, [
    { body: "A." },
    { title: "One", body: "## One\n\nB." },
  ])
})

test("a body with no breaks is one step", () => {
  assert.deepEqual(splitSteps("Just text."), [{ body: "Just text." }])
})
