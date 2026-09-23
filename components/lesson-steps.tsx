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

/** Marks the lesson as read once its end scrolls into view. */
export function ReadSentinel({ lessonKey }: { lessonKey: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      const row = { lessonId: lessonKey, readAt: Date.now() }
      db.reads.put(row)
      pushRow("reads", row)
      io.disconnect()
    })
    io.observe(el)
    return () => io.disconnect()
  }, [lessonKey])
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
  // Write-only (a hosted copy without the learner's runner) hides the steps it can't do, unless already done.
  const steps = (
    [
      ["Read", read, true],
      ["Run code", ran, canRun],
      ["Pass challenge", done.includes(doc.id), canRun],
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
