import { parseQuiz, type Question } from "./quiz.ts"

/** What a program printed, recorded for courses the website can't run (lib/outputs.ts). */
export type Output = { lines: { kind: "out" | "err"; text: string }[]; error?: string }

export type Lesson = {
  id: string
  title: string
  section: string
  /** one-line summary (guide chapters) */
  summary?: string
  /** "lesson" (has a challenge), "guide" (reference chapter) or "playground" */
  kind: "lesson" | "guide" | "playground"
  body: string
  starter: string
  solution?: string
  check?: string
  /** easy→hard questions from the ```quiz fence */
  quiz?: Question[]
  /** recorded output of the examples and the solution, keyed by their trimmed code */
  outputs?: Record<string, Output>
}

/** Parses a lesson file: `---` frontmatter, markdown prose, and fenced
 *  ```<lang> starter|solution|check blocks that are pulled out of the prose. */
export function parseLesson(
  id: string,
  raw: string,
  kind: Lesson["kind"] = "lesson"
): Lesson {
  const fm = raw.match(/^---\n([\s\S]*?)\n---\n/)
  const meta = Object.fromEntries(
    (fm?.[1] ?? "").split("\n").map((l) => {
      const i = l.indexOf(":")
      return [
        l.slice(0, i).trim(),
        l
          .slice(i + 1)
          .trim()
          .replace(/^"(.*)"$/, "$1"),
      ]
    })
  )
  const blocks: Record<string, string> = {}
  let quiz: string | undefined
  const body = raw
    .slice(fm?.[0].length ?? 0)
    .replace(/```quiz\n([\s\S]*?)```\n?/, (_, src: string) => {
      quiz = src
      return ""
    })
    .replace(
      /```\w+ (starter|solution|check)\n([\s\S]*?)```\n?/g,
      (_, block: string, code: string) => {
        blocks[block] = code.trimEnd() + "\n"
        return ""
      }
    )
    .trim()
  return {
    id,
    kind,
    summary: meta.summary,
    title: meta.title ?? id,
    section: meta.section ?? "Other",
    body,
    starter: blocks.starter ?? "",
    solution: blocks.solution,
    check: blocks.check,
    quiz: quiz === undefined ? undefined : parseQuiz(quiz),
  }
}

export const playground: Lesson = {
  id: "playground",
  kind: "playground",
  title: "Playground",
  section: "Free practice",
  body: "A blank scratchpad. Write any code you like and press **Run**. Every run is saved to your history.",
  starter: "", // per course: `hello` in lib/courses.ts
}
