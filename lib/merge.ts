// How the browser copy and the account copy of a learner's data combine. Pure: no I/O.
// Used by app/api/sync/route.ts; see docs/superpowers/specs/2026-09-22-optional-accounts-design.md.

export type ProgressRow = { lessonId: string; completedAt: number }
export type ReadRow = { lessonId: string; readAt: number }
export type QuizRow = { key: string; best: number; total: number; passedAt?: number }
export type DraftRow = { lessonId: string; code: string; updatedAt: number }
export type Rows = { progress: ProgressRow[]; reads: ReadRow[]; quizzes: QuizRow[]; drafts: DraftRow[] }

const earliest = (a?: number, b?: number) =>
  a === undefined ? b : b === undefined ? a : Math.min(a, b)

function combine<T>(a: T[], b: T[], id: (r: T) => string, pick: (x: T, y: T) => T): T[] {
  const out = new Map(a.map((r) => [id(r), r]))
  for (const r of b) {
    const prev = out.get(id(r))
    out.set(id(r), prev ? pick(prev, r) : r)
  }
  return [...out.values()]
}

export function merge(a: Rows, b: Rows): Rows {
  return {
    progress: combine(a.progress, b.progress, (r) => r.lessonId, (x, y) => ({
      lessonId: x.lessonId,
      completedAt: Math.min(x.completedAt, y.completedAt),
    })),
    reads: combine(a.reads, b.reads, (r) => r.lessonId, (x, y) => ({
      lessonId: x.lessonId,
      readAt: Math.min(x.readAt, y.readAt),
    })),
    quizzes: combine(a.quizzes, b.quizzes, (r) => r.key, (x, y) => {
      const top = y.best > x.best ? y : x
      const passedAt = earliest(x.passedAt, y.passedAt)
      return { key: x.key, best: top.best, total: top.total, ...(passedAt !== undefined && { passedAt }) }
    }),
    drafts: combine(a.drafts, b.drafts, (r) => r.lessonId, (x, y) => (y.updatedAt > x.updatedAt ? y : x)),
  }
}

// Rows are flat, so a sorted key list makes the comparison independent of key order.
const same = (x: object, y: object | undefined) =>
  y !== undefined && JSON.stringify(x, Object.keys(x).sort()) === JSON.stringify(y, Object.keys(y).sort())

function diff<T extends object>(before: T[], after: T[], id: (r: T) => string): T[] {
  const old = new Map(before.map((r) => [id(r), r]))
  return after.filter((r) => !same(r, old.get(id(r))))
}

/** Rows in `after` that are new or differ from `before`: what the server needs to write. */
export function changed(before: Rows, after: Rows): Rows {
  return {
    progress: diff(before.progress, after.progress, (r) => r.lessonId),
    reads: diff(before.reads, after.reads, (r) => r.lessonId),
    quizzes: diff(before.quizzes, after.quizzes, (r) => r.key),
    drafts: diff(before.drafts, after.drafts, (r) => r.lessonId),
  }
}

const MAX_ROWS = 5000
const MAX_CODE = 200_000

const isId = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length <= 200
const isCount = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0

/** Validates an untrusted request body. Missing tables count as empty; any bad row rejects the whole body. */
export function parseRows(body: unknown): Rows | null {
  if (typeof body !== "object" || body === null) return null
  const b = body as Record<string, unknown>
  const list = <T>(v: unknown, row: (r: Record<string, unknown>) => T | null): T[] | null => {
    if (v === undefined) return []
    if (!Array.isArray(v) || v.length > MAX_ROWS) return null
    const out: T[] = []
    for (const r of v) {
      const parsed = typeof r === "object" && r !== null ? row(r) : null
      if (!parsed) return null
      out.push(parsed)
    }
    return out
  }
  const progress = list(b.progress, (r) =>
    isId(r.lessonId) && isCount(r.completedAt) ? { lessonId: r.lessonId, completedAt: r.completedAt } : null
  )
  const reads = list(b.reads, (r) =>
    isId(r.lessonId) && isCount(r.readAt) ? { lessonId: r.lessonId, readAt: r.readAt } : null
  )
  const quizzes = list(b.quizzes, (r): QuizRow | null =>
    isId(r.key) && isCount(r.best) && isCount(r.total) && (r.passedAt === undefined || isCount(r.passedAt))
      ? { key: r.key, best: r.best, total: r.total, ...(r.passedAt !== undefined && { passedAt: r.passedAt }) }
      : null
  )
  const drafts = list(b.drafts, (r) =>
    isId(r.lessonId) && typeof r.code === "string" && r.code.length <= MAX_CODE && isCount(r.updatedAt)
      ? { lessonId: r.lessonId, code: r.code, updatedAt: r.updatedAt }
      : null
  )
  if (!progress || !reads || !quizzes || !drafts) return null
  return { progress, reads, quizzes, drafts }
}
