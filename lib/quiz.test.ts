import assert from "node:assert/strict"
import { test } from "node:test"

import { finalQuiz, parseQuiz, sectionQuiz, type Question } from "./quiz.ts"

const SRC = `
? hard: Last?
- a
+ b
? easy: What does \`print(1)\` show?
~~~python
print(1)
~~~
+ 1
- 1\\n
> print adds a newline.
> It's the default end.
? medium: Middle?
+ yes
- no
`

test("parses questions, code, options, answer and explanation", () => {
  const qs = parseQuiz(SRC)
  assert.equal(qs.length, 3)
  const [q] = qs.filter((q) => q.level === "easy")
  assert.equal(q.prompt, "What does `print(1)` show?")
  assert.equal(q.code, "print(1)\n")
  assert.deepEqual(q.options, ["1", "1\n"]) // \n is expanded only for code questions
  assert.equal(q.answer, 0)
  assert.equal(q.explain, "print adds a newline. It's the default end.")
})

test("sorts easy → medium → hard", () => {
  assert.deepEqual(parseQuiz(SRC).map((q) => q.level), ["easy", "medium", "hard"])
})

test("keeps a literal \\n in non-code questions", () => {
  const [q] = parseQuiz('? easy: Default end?\n+ `"\\n"`\n- `" "`')
  assert.equal(q.options[0], '`"\\n"`')
})

test("rejects malformed quizzes", () => {
  assert.throws(() => parseQuiz("? tricky: x\n+ a\n- b"), /bad question line/)
  assert.throws(() => parseQuiz("? easy: x\n- a\n- b"), /no correct answer/)
  assert.throws(() => parseQuiz("? easy: x\n+ a\n+ b"), /two correct answers/)
  assert.throws(() => parseQuiz("? easy: x\n+ a"), /at least 2 options/)
  assert.throws(() => parseQuiz("+ a"), /before the first question/)
  assert.throws(() => parseQuiz("? easy: x\n~~~python\nprint(1)\n+ a\n- b"), /unclosed/)
  assert.throws(() => parseQuiz("? easy: x\nhello\n+ a\n- b"), /unexpected quiz line/)
})

const q = (level: Question["level"], prompt: string): Question => ({
  level,
  prompt,
  options: ["a", "b"],
  answer: 0,
})

test("section quiz: medium/hard only, spread across lessons, max 10, easy→hard", () => {
  const lessons = Array.from({ length: 6 }, (_, i) => ({
    quiz: [q("easy", `e${i}`), q("hard", `h${i}`), q("medium", `m${i}`)],
  }))
  const s = sectionQuiz(lessons)
  assert.equal(s.length, 10)
  assert.ok(s.every((x) => x.level !== "easy"))
  const levels = s.map((x) => x.level)
  assert.ok(levels.lastIndexOf("medium") < levels.indexOf("hard")) // all medium before any hard
  assert.ok(s.some((x) => x.prompt.endsWith("0")) && s.some((x) => x.prompt.endsWith("5"))) // first and last lesson
  assert.deepEqual(sectionQuiz([{}, { quiz: [q("easy", "e")] }]), [])
})

test("final quiz: ≤8 medium + ≤12 hard, easy→hard", () => {
  const lessons = Array.from({ length: 20 }, (_, i) => ({ quiz: [q("medium", `m${i}`), q("hard", `h${i}`)] }))
  const f = finalQuiz(lessons)
  assert.equal(f.filter((x) => x.level === "medium").length, 8)
  assert.equal(f.filter((x) => x.level === "hard").length, 12)
  assert.equal(f[0].level, "medium")
})
