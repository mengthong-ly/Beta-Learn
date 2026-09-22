import assert from "node:assert/strict"
import { test } from "node:test"

import { changed, merge, parseRows, type Rows } from "./merge.ts"

const rows = (r: Partial<Rows>): Rows => ({ progress: [], reads: [], quizzes: [], drafts: [], ...r })
const sort = (r: Rows): Rows => {
  const by = (k: string) => (x: Record<string, unknown>, y: Record<string, unknown>) =>
    String(x[k]).localeCompare(String(y[k]))
  return {
    progress: [...r.progress].sort(by("lessonId")),
    reads: [...r.reads].sort(by("lessonId")),
    quizzes: [...r.quizzes].sort(by("key")),
    drafts: [...r.drafts].sort(by("lessonId")),
  }
}

test("progress and reads: union, earliest time wins", () => {
  const a = rows({
    progress: [{ lessonId: "python/a", completedAt: 5 }, { lessonId: "python/b", completedAt: 1 }],
    reads: [{ lessonId: "python/a", readAt: 9 }],
  })
  const b = rows({
    progress: [{ lessonId: "python/a", completedAt: 3 }],
    reads: [{ lessonId: "python/a", readAt: 2 }, { lessonId: "python/c", readAt: 4 }],
  })
  assert.deepEqual(sort(merge(a, b)), rows({
    progress: [{ lessonId: "python/a", completedAt: 3 }, { lessonId: "python/b", completedAt: 1 }],
    reads: [{ lessonId: "python/a", readAt: 2 }, { lessonId: "python/c", readAt: 4 }],
  }))
})

test("quizzes: higher best wins with its total, earliest pass kept", () => {
  const a = rows({ quizzes: [{ key: "python/final", best: 7, total: 10, passedAt: 50 }] })
  const b = rows({ quizzes: [{ key: "python/final", best: 9, total: 12 }] })
  assert.deepEqual(merge(a, b).quizzes, [{ key: "python/final", best: 9, total: 12, passedAt: 50 }])
  assert.deepEqual(merge(b, a).quizzes, [{ key: "python/final", best: 9, total: 12, passedAt: 50 }])
})

test("quizzes: no pass on either side leaves passedAt absent", () => {
  const a = rows({ quizzes: [{ key: "k", best: 1, total: 5 }] })
  const b = rows({ quizzes: [{ key: "k", best: 2, total: 5 }] })
  assert.deepEqual(merge(a, b).quizzes, [{ key: "k", best: 2, total: 5 }])
})

test("drafts: newest updatedAt wins", () => {
  const a = rows({ drafts: [{ lessonId: "l", code: "old", updatedAt: 1 }] })
  const b = rows({ drafts: [{ lessonId: "l", code: "new", updatedAt: 2 }] })
  assert.deepEqual(merge(a, b).drafts, [{ lessonId: "l", code: "new", updatedAt: 2 }])
  assert.deepEqual(merge(b, a).drafts, [{ lessonId: "l", code: "new", updatedAt: 2 }])
})

test("changed: only new or different rows", () => {
  const before = rows({ progress: [{ lessonId: "a", completedAt: 1 }, { lessonId: "b", completedAt: 2 }] })
  const after = rows({
    progress: [{ completedAt: 1, lessonId: "a" }, { lessonId: "b", completedAt: 1 }, { lessonId: "c", completedAt: 3 }],
  })
  assert.deepEqual(changed(before, after).progress, [
    { lessonId: "b", completedAt: 1 },
    { lessonId: "c", completedAt: 3 },
  ])
})

test("parseRows: accepts partial bodies and strips unknown fields", () => {
  assert.deepEqual(
    parseRows({ drafts: [{ lessonId: "l", code: "x", updatedAt: 1, extra: true }] }),
    rows({ drafts: [{ lessonId: "l", code: "x", updatedAt: 1 }] })
  )
  assert.deepEqual(parseRows({}), rows({}))
})

test("parseRows: rejects bad input", () => {
  for (const bad of [
    null,
    "x",
    { progress: "x" },
    { progress: [{ lessonId: "", completedAt: 1 }] },
    { reads: [{ lessonId: "a", readAt: -1 }] },
    { quizzes: [{ key: "k", best: 1.5, total: 2 }] },
    { drafts: [{ lessonId: "l", code: "x".repeat(200_001), updatedAt: 1 }] },
    { progress: Array.from({ length: 5001 }, (_, i) => ({ lessonId: `l${i}`, completedAt: 1 })) },
  ]) assert.equal(parseRows(bad), null, JSON.stringify(bad)?.slice(0, 60))
})
