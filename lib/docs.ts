import { playground, type Lesson } from "./lesson-parser"

/** The Guide Book's table of contents page, as a doc the editor can attach to. */
export const guideIndex: Lesson = {
  id: "guide",
  kind: "guide",
  title: "Guide Book",
  section: "Guide Book",
  body: "",
  starter: "", // per course: guideStarter() in lib/courses.ts
}

/**
 * A doc's key within its course. Guide chapters are namespaced so a chapter and
 * a lesson can share a slug (e.g. "functions").
 */
export const docKey = (d: Lesson) =>
  d.kind === "guide" && d.id !== "guide" ? `guide:${d.id}` : d.id

/** Drafts, runs and progress are stored as "<course>/<docKey>", e.g. "python/print". */
export const storageKey = (course: string, key: string) => `${course}/${key}`

export const docHref = (d: Lesson, course: string) =>
  `/${course}` +
  (d.kind === "playground"
    ? "/playground"
    : d.kind === "guide"
      ? d.id === "guide"
        ? "/guide"
        : `/guide/${d.id}`
      : `/lesson/${d.id}`)

export function findDoc(
  key: string | undefined,
  lessons: Lesson[],
  guide: Lesson[]
): Lesson | undefined {
  if (!key) return undefined
  key = key.slice(key.indexOf("/") + 1) // drop the "<course>/" prefix
  if (key === "playground") return playground
  if (key === "guide") return guideIndex
  if (key.startsWith("guide:")) return guide.find((g) => g.id === key.slice(6))
  return lessons.find((l) => l.id === key)
}
