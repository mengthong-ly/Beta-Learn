import "server-only"

import { existsSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"

import { courses, type Course, type CourseId } from "./courses"
import { parseLesson, type Lesson, type Output } from "./lesson-parser"
import { examples, outputKey, readOutputs } from "./outputs"

const root = path.join(process.cwd(), "content")

function withOutputs(l: Lesson, lang: string, recorded: Record<string, Output>): Lesson {
  const outputs = Object.fromEntries(
    [...examples(l.body, lang), l.solution ?? ""]
      .map((code) => [code.trim(), recorded[outputKey(code)]] as const)
      .filter(([, o]) => o)
  )
  return Object.keys(outputs).length ? { ...l, outputs } : l
}

function load(course: Course, dir: "lessons" | "guide", kind: Lesson["kind"]): Lesson[] {
  const folder = path.join(root, course.id, dir)
  if (!existsSync(folder)) return [] // the guide is optional
  const recorded = readOutputs(course.id)
  return readdirSync(folder)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) =>
      withOutputs(
        parseLesson(f.replace(/^\d+-|\.md$/g, ""), readFileSync(path.join(folder, f), "utf8"), kind),
        course.lang,
        recorded
      )
    )
}

// Read once per server process; content only changes on rebuild.
const content = Object.fromEntries(
  courses.map((c) => [
    c.id,
    {
      lessons: load(c, "lessons", "lesson"),
      guide: load(c, "guide", "guide"),
    },
  ])
) as Record<CourseId, { lessons: Lesson[]; guide: Lesson[] }>

export const getCourse = (id: string) =>
  (content as Record<string, (typeof content)[CourseId] | undefined>)[id]
