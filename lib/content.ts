import "server-only"

import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"

import { parseLesson, type Lesson } from "./lesson-parser"

const root = path.join(process.cwd(), "content")

function load(dir: "lessons" | "guide", kind: Lesson["kind"]): Lesson[] {
  const folder = path.join(root, dir)
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
export const lessons = load("lessons", "lesson")
export const guide = load("guide", "guide")
