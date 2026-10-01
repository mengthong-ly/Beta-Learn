"use client"

import { useEffect, useRef } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { CheckCircle2Icon, CircleIcon } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

import { storageKey, useWorkspace } from "@/components/workspace-context"
import { findCourse } from "@/lib/courses"
import { db } from "@/lib/db"
import type { Lesson } from "@/lib/lesson-parser"
import { useCanRun } from "@/lib/runner"
import { pushRow } from "@/lib/sync"

/** Completes a lesson. Challenges do this when their check passes (components/workspace.tsx);
 *  lessons without one complete on passing their quiz, or on reading to the end if there's no quiz. */
export function markComplete(lessonKey: string) {
  const row = { lessonId: lessonKey, completedAt: Date.now() }
  db.progress.put(row)
  pushRow("progress", row)
}

/** The lesson has nothing left to do but read: no challenge, no quiz. */
export const readOnly = (doc: Lesson) => !doc.check && !doc.quiz?.length

/** Marks the lesson as read once its end scrolls into view (and complete, for `complete` lessons). */
export function ReadSentinel({ lessonKey, complete = false }: { lessonKey: string; complete?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      const row = { lessonId: lessonKey, readAt: Date.now() }
      db.reads.put(row)
      pushRow("reads", row)
      if (complete) markComplete(lessonKey)
      io.disconnect()
    })
    io.observe(el)
    return () => io.disconnect()
  }, [lessonKey, complete])
  return <div ref={ref} aria-hidden />
}

export function LessonSteps({ doc }: { doc: Lesson }) {
  const { course, done } = useWorkspace()
  const reduce = useReducedMotion()
  const canRun = useCanRun(findCourse(course))
  const key = storageKey(course, doc.id)
  const [read, ran, quiz] = useLiveQuery(
    () =>
      Promise.all([
        db.reads.get(key).then(Boolean),
        db.runs.where("lessonId").equals(key).count().then((n) => n > 0),
        db.quizzes.get(key).then((q) => !!q?.passedAt),
      ]),
    [key],
    [false, false, false]
  )
  const challenge = !!doc.check
  // Lessons that are only reading (Fundamentals' early units) have no code to run.
  const code = challenge || doc.body.includes("```" + findCourse(course).lang + "\n")
  // Write-only (a hosted copy without the learner's runner) hides the steps it can't do, unless already done.
  const steps = (
    [
      ["Read", read, true],
      ["Run code", ran, canRun && code],
      ...(challenge ? [["Pass challenge", done.includes(doc.id), canRun]] : []),
      ...(doc.quiz?.length ? [["Pass quiz", quiz, true]] : []),
    ] as [string, boolean, boolean][]
  ).filter(([, ok, possible]) => ok || possible)
  return (
    <ol aria-label="Lesson progress" className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      {steps.map(([label, ok]) => (
        <li key={label} className={ok ? "flex items-center gap-1.5 text-foreground" : "flex items-center gap-1.5 text-muted-foreground"}>
          <motion.span key={String(ok)} initial={reduce || !ok ? false : { scale: 0.4 }} animate={{ scale: 1 }} className="flex">
            {ok ? <CheckCircle2Icon className="size-4 text-success" /> : <CircleIcon className="size-4" />}
          </motion.span>
          {label}
          <span className="sr-only">{ok ? "(done)" : "(to do)"}</span>
        </li>
      ))}
    </ol>
  )
}
