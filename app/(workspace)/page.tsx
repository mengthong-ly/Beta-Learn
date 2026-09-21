"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLiveQuery } from "dexie-react-hooks"

import { useWorkspace } from "@/components/workspace-context"
import { db } from "@/lib/db"

/** "/" → the first lesson you haven't completed yet (progress lives in IndexedDB, so client-side). */
export default function Home() {
  const router = useRouter()
  const { lessons } = useWorkspace()
  const done = useLiveQuery(() => db.progress.toCollection().primaryKeys())
  useEffect(() => {
    if (done)
      router.replace(
        `/lesson/${(lessons.find((l) => !done.includes(l.id)) ?? lessons[0]).id}`
      )
  }, [done, lessons, router])
  return null
}
