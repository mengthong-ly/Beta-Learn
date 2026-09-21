"use client"

import { useParams } from "next/navigation"
import { useLiveQuery } from "dexie-react-hooks"

import { Doc } from "@/components/doc"
import { findDoc, useWorkspace } from "@/components/workspace-context"
import { db } from "@/lib/db"

/** A past run: shows the page it was run on (the Workspace restores code + output). */
export default function RunPage() {
  const { id } = useParams<{ id: string }>()
  const { lessons, guide } = useWorkspace()
  const run = useLiveQuery(() => db.runs.get(Number(id)), [id])
  const doc = findDoc(run?.lessonId, lessons, guide)
  return doc ? <Doc doc={doc} /> : null
}
