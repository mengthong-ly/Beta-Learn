"use client"

import Link from "next/link"
import { useLiveQuery } from "dexie-react-hooks"
import { ArrowRightIcon } from "lucide-react"

import { CourseMark } from "@/components/course-switcher"
import type { Course } from "@/lib/courses"
import { db } from "@/lib/db"

export function CourseCard({
  course,
  lessonIds,
  guideCount,
}: {
  course: Course
  lessonIds: string[]
  guideCount: number
}) {
  const keys = useLiveQuery(
    () =>
      db.progress.where("lessonId").startsWith(`${course.id}/`).primaryKeys(),
    [course.id],
    [] as string[]
  )
  const done = lessonIds.filter((id) =>
    keys.includes(`${course.id}/${id}`)
  ).length
  const pct = Math.round((done / lessonIds.length) * 100)
  const quizzesPassed = useLiveQuery(
    () =>
      db.quizzes
        .where("key")
        .startsWith(`${course.id}/`)
        .filter((q) => !!q.passedAt)
        .count(),
    [course.id],
    0
  )

  return (
    <Link
      href={`/${course.id}`}
      className="group flex h-full flex-col gap-4 rounded-xl border p-5 transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="flex items-center gap-3">
        <CourseMark mark={course.mark} />
        <div className="min-w-0">
          <h2 className="font-semibold">{course.name}</h2>
          <p className="text-xs text-muted-foreground">
            {lessonIds.length} {lessonIds.length === 1 ? "lesson" : "lessons"}
            {guideCount > 0 && ` · ${guideCount} guide chapters`}
            {course.runtime === "local" && " · runs on your computer"}
          </p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{course.tagline}</p>
      <div className="mt-auto flex flex-col gap-2">
        <div
          role="progressbar"
          aria-label={`${course.name} progress`}
          aria-valuenow={done}
          aria-valuemin={0}
          aria-valuemax={lessonIds.length}
          className="h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-success transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground tabular-nums">
            {done}/{lessonIds.length} done
            {quizzesPassed > 0 &&
              ` · ${quizzesPassed} ${quizzesPassed === 1 ? "quiz" : "quizzes"} passed`}
          </span>
          <span className="flex items-center gap-1 font-medium">
            {done ? "Continue" : "Start"}
            <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}
