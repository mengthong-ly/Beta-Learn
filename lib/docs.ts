import { GUIDE_STARTER, playground, type Lesson } from "./lesson-parser"

/** The Guide Book's table of contents page, as a doc the editor can attach to. */
export const guideIndex: Lesson = {
  id: "guide",
  kind: "guide",
  title: "Guide Book",
  section: "Guide Book",
  body: "",
  starter: GUIDE_STARTER,
}

/**
 * Drafts, runs and progress are stored under a key. Guide chapters are namespaced
 * so a chapter and a lesson can share a slug (e.g. "functions").
 */
export const docKey = (d: Lesson) =>
  d.kind === "guide" && d.id !== "guide" ? `guide:${d.id}` : d.id

export const docHref = (d: Lesson) =>
  d.kind === "playground"
    ? "/playground"
    : d.kind === "guide"
      ? d.id === "guide"
        ? "/guide"
        : `/guide/${d.id}`
      : `/lesson/${d.id}`

export function findDoc(
  key: string | undefined,
  lessons: Lesson[],
  guide: Lesson[]
): Lesson | undefined {
  if (!key) return undefined
  if (key === "playground") return playground
  if (key === "guide") return guideIndex
  if (key.startsWith("guide:")) return guide.find((g) => g.id === key.slice(6))
  return lessons.find((l) => l.id === key)
}
