import { db } from "./db"
import type { Rows } from "./merge"

// Browser side of account sync. Dexie stays the source of truth; the account is a merged copy.
let enabled = false

const post = (rows: Partial<Rows>) =>
  fetch("/api/sync", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(rows),
  })

/** Merges local and account data in both directions. Runs when a session starts. */
export async function syncAll() {
  enabled = true
  const [progress, reads, quizzes, drafts] = await Promise.all([
    db.progress.toArray(),
    db.reads.toArray(),
    db.quizzes.toArray(),
    db.drafts.toArray(),
  ])
  const res = await post({
    progress,
    reads,
    quizzes,
    drafts: drafts.map((d) => ({ ...d, updatedAt: d.updatedAt ?? 0 })),
  }).catch(() => null)
  if (!res?.ok) return
  const merged: Rows = await res.json()
  await db.transaction("rw", [db.progress, db.reads, db.quizzes, db.drafts], () =>
    Promise.all([
      db.progress.bulkPut(merged.progress),
      db.reads.bulkPut(merged.reads),
      db.quizzes.bulkPut(merged.quizzes),
      db.drafts.bulkPut(merged.drafts),
    ])
  )
}

export function stopSync() {
  enabled = false
}

/** Sends one saved row to the account in the background. Failures are dropped; the next syncAll() catches up. */
export function pushRow<K extends keyof Rows>(table: K, row: Rows[K][number]) {
  if (enabled) post({ [table]: [row] }).catch(() => {})
}
