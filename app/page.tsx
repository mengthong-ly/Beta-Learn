import { CourseCard } from "@/components/course-card"
import { getCourse } from "@/lib/content"
import { courses } from "@/lib/courses"

export default function Home() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-4xl flex-col px-4 py-10 sm:px-8 sm:py-16">
      <header className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md bg-foreground font-mono text-xs font-bold text-background">
          Th
        </span>
        <span className="font-semibold">ThongLearn</span>
      </header>
      <h1 className="mt-12 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        Pick a course
      </h1>
      <p className="mt-2 text-muted-foreground">
        Each course has its own lessons, guide book and playground. Your
        progress is saved in this browser.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {courses.map((c) => {
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
    </main>
  )
}
