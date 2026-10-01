import Link from "next/link"
import { MonitorCogIcon } from "lucide-react"

import { CourseCard } from "@/components/course-card"
import { getCourse } from "@/lib/content"
import { Separator } from "@/components/ui/separator"
import { courses, isExtra, isStart, type Course } from "@/lib/courses"

function CourseGrid({ list }: { list: Course[] }) {
  return (
    <ul className="mt-6 grid gap-4 sm:grid-cols-2">
      {list.map((c) => {
        const { lessons, guide } = getCourse(c.id)!
        return (
          <li key={c.id}>
            <CourseCard
              course={c}
              lessonIds={lessons.map((l) => l.id)}
              guideCount={guide.length}
            />
          </li>
        )
      })}
    </ul>
  )
}

/** Fundamentals sits above the grid: it's where anyone new to code should begin. */
function StartHere() {
  const c = courses.find(isStart)!
  const { lessons } = getCourse(c.id)!
  return (
    <div className="mt-8">
      <h2 className="mb-2 text-sm font-medium text-muted-foreground">
        New to coding? Start here
      </h2>
      <CourseCard
        course={c}
        lessonIds={lessons.map((l) => l.id)}
        guideCount={0}
        href="/start"
      />
    </div>
  )
}

export const metadata = { title: "Courses" }

export default function Courses() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-4xl flex-col px-4 py-10 sm:px-8 sm:py-16">
      <header className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md bg-foreground font-mono text-xs font-bold text-background">
          Th
        </span>
        <span className="font-semibold">ThongLearn</span>
        <Link
          href="/setup"
          className="ml-auto flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <MonitorCogIcon className="size-4" /> Setup
        </Link>
      </header>
      <h1 className="mt-12 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        Pick a course
      </h1>
      <p className="mt-2 text-muted-foreground">
        Each course has its own lessons, guide book and playground. Your
        progress is saved in this browser.
      </p>
      <StartHere />
      <CourseGrid list={courses.filter((c) => !isExtra(c) && !isStart(c))} />
      <div className="mt-12 flex items-center gap-3">
        <h2 className="shrink-0 text-sm font-medium text-muted-foreground">
          Extra courses
        </h2>
        <Separator className="flex-1" />
      </div>
      <CourseGrid list={courses.filter(isExtra)} />
    </main>
  )
}
