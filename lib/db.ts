import Dexie, { type EntityTable } from "dexie"

import type { RunState } from "./runner"

export type Run = Pick<
  RunState,
  "status" | "lines" | "ms" | "error" | "errorLine" | "check" | "inspect"
> & {
  id: number
  lessonId: string
  createdAt: number
  code: string
}

export const db = new Dexie("thonglearn") as Dexie & {
  runs: EntityTable<Run, "id">
  progress: EntityTable<{ lessonId: string; completedAt: number }, "lessonId">
  drafts: EntityTable<{ lessonId: string; code: string }, "lessonId">
}

db.version(1).stores({
  runs: "++id, lessonId, createdAt",
  progress: "lessonId",
  drafts: "lessonId",
})

// v2: courses. Keys gain a "<course>/" prefix; everything saved before v2 was Python.
db.version(2)
  .stores({
    runs: "++id, lessonId, createdAt",
    progress: "lessonId",
    drafts: "lessonId",
  })
  .upgrade(async (tx) => {
    const prefix = <T extends { lessonId: string }>(r: T) => ({
      ...r,
      lessonId: `python/${r.lessonId}`,
    })
    await tx
      .table("runs")
      .toCollection()
      .modify((r) => {
        r.lessonId = `python/${r.lessonId}`
      })
    // lessonId is the primary key here, which modify() can't change: re-add instead.
    for (const name of ["progress", "drafts"]) {
      const t = tx.table(name)
      const rows = await t.toArray()
      await t.clear()
      await t.bulkAdd(rows.map(prefix))
    }
  })
