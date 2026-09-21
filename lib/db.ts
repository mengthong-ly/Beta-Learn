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
