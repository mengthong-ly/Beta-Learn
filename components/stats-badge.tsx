"use client"

import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { motion, useReducedMotion } from "motion/react"

import { useWorkspace } from "@/components/workspace-context"
import { db } from "@/lib/db"
import { streak, xp } from "@/lib/stats"

/** A number that pops when it changes. */
function Pop({ value }: { value: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.span
      key={value}
      initial={reduce ? false : { scale: 1.35, opacity: 0.4 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-block tabular-nums"
    >
      {value}
    </motion.span>
  )
}

/** 🔥 day streak (any course) · XP (this course), in the sidebar header. */
export function StatsBadge() {
  const { course, done } = useWorkspace()
  // Reading counts too: on the website, some courses can only be read and written, not run.
  const times = useLiveQuery(
    async () => [
      ...((await db.runs.orderBy("createdAt").keys()) as unknown as number[]),
      ...(await db.reads.toArray()).map((r) => r.readAt),
    ],
    [],
    []
  )
  const quizzes = useLiveQuery(
    () => db.quizzes.where("key").startsWith(`${course}/`).toArray(),
    [course],
    []
  )
  const [now] = useState(() => Date.now())
  const days = streak(times, now)
  const points = xp(done.length, quizzes)
  return (
    <p
      className="flex items-center gap-3 px-2 text-xs text-muted-foreground"
      aria-label={`${days} day streak, ${points} XP`}
    >
      <span title="Days in a row with a run or a lesson read to the end">
        🔥 <Pop value={days} /> {days === 1 ? "day" : "days"}
      </span>
      <span title="10 per lesson, 2 per quiz point, 50 per section quiz, 200 for the final">
        ⚡ <Pop value={points} /> XP
      </span>
    </p>
  )
}
