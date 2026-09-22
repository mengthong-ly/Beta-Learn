import "server-only"

import { existsSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"

import { courses, type CourseId } from "./courses"
import { parseLesson, type Lesson } from "./lesson-parser"

const root = path.join(process.cwd(), "content")

function load(
  course: CourseId,
  dir: "lessons" | "guide",
  kind: Lesson["kind"]
): Lesson[] {
  const folder = path.join(root, course, dir)
  if (!existsSync(folder)) return [] // the guide is optional
  return readdirSync(folder)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) =>
      parseLesson(
        f.replace(/^\d+-|\.md$/g, ""),
        readFileSync(path.join(folder, f), "utf8"),
        kind
      )
    )
}

// Read once per server process; content only changes on rebuild.
const content = Object.fromEntries(
  courses.map((c) => [
    c.id,
    {
      lessons: load(c.id, "lessons", "lesson"),
      guide: load(c.id, "guide", "guide"),
    },
  ])
) as Record<CourseId, { lessons: Lesson[]; guide: Lesson[] }>

export const getCourse = (id: string) =>
  (content as Record<string, (typeof content)[CourseId] | undefined>)[id]
