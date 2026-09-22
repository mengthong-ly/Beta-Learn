"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLiveQuery } from "dexie-react-hooks"

import {
  docHref,
  storageKey,
  useWorkspace,
} from "@/components/workspace-context"
import { db } from "@/lib/db"

/** "/<course>" → the first lesson you haven't completed yet (progress lives in IndexedDB, so client-side). */
export default function CourseHome() {
  const router = useRouter()
  const { course, lessons } = useWorkspace()
  const done = useLiveQuery(() => db.progress.toCollection().primaryKeys())
  useEffect(() => {
    if (done)
      router.replace(
        docHref(
          lessons.find((l) => !done.includes(storageKey(course, l.id))) ??
            lessons[0],
          course
        )
      )
  }, [done, lessons, course, router])
  return null
}
