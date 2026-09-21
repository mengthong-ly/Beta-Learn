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
}

/** Parses a lesson file: `---` frontmatter, markdown prose, and fenced
 *  ```python starter|solution|check blocks that are pulled out of the prose. */
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
  const body = raw
    .slice(fm?.[0].length ?? 0)
    .replace(
      /```python (starter|solution|check)\n([\s\S]*?)```\n?/g,
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
  }
}

export const playground: Lesson = {
  id: "playground",
  kind: "playground",
  title: "Playground",
  section: "Free practice",
  body: "A blank scratchpad. Write any Python you like and press **Run**. Every run is saved to your history.",
  starter: 'print("Hello, Python!")\n',
}

/** Starter code for the editor while reading a guide chapter. */
export const GUIDE_STARTER =
  '# Press "Try it" on any example in this chapter,\n# or write your own and press Run. Open the Inspect tab to look inside.\n'
