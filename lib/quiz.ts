/**
 * Quizzes: a ```quiz fence at the end of a lesson.
 *
 *   ? easy: What does `print(1, 2)` show?     question line: level + prompt (`code` spans allowed)
 *   ~~~python                                 optional code: makes it "what does this print?";
 *   print(1, 2)                               check:content runs it and compares with the + answer
 *   ~~~
 *   + 1 2                                     the right answer (exactly one)
 *   - 12                                      wrong answers; in code questions \n means a newline
 *   > print() puts sep=" " between values.    explanation (lines are joined)
 */
export type Level = "easy" | "medium" | "hard"

export type Question = {
  level: Level
  prompt: string
  code?: string
  options: string[]
  answer: number
  explain?: string
}

const RANK: Record<Level, number> = { easy: 0, medium: 1, hard: 2 }

/** Stable sort easy → medium → hard. */
export const byLevel = (qs: Question[]) =>
  [...qs].sort((a, b) => RANK[a.level] - RANK[b.level])

export function parseQuiz(src: string): Question[] {
  const qs: Question[] = []
  let q: Question | undefined
  let code: string[] | undefined
  for (const line of src.split("\n")) {
    if (code) {
      if (line.startsWith("~~~")) {
        q!.code = code.join("\n") + "\n"
        code = undefined
      } else code.push(line)
      continue
    }
    if (!line.trim()) continue
    const m = line.match(/^\? (easy|medium|hard): (.+)$/)
    if (m) {
      q = { level: m[1] as Level, prompt: m[2], options: [], answer: -1 }
      qs.push(q)
    } else if (line.startsWith("?"))
      throw new Error(`bad question line (want "? easy|medium|hard: …"): ${line}`)
    else if (!q) throw new Error(`text before the first question: ${line}`)
    else if (line.startsWith("~~~")) code = []
    else if (/^[+-] /.test(line)) {
      if (line[0] === "+") {
        if (q.answer !== -1) throw new Error(`two correct answers: ${q.prompt}`)
        q.answer = q.options.length
      }
      const text = line.slice(2)
      q.options.push(q.code ? text.replace(/\\n/g, "\n") : text)
    } else if (line.startsWith("> "))
      q.explain = (q.explain ? q.explain + " " : "") + line.slice(2)
    else throw new Error(`unexpected quiz line: ${line}`)
  }
  if (code) throw new Error(`unclosed ~~~ code block: ${q!.prompt}`)
  for (const x of qs) {
    if (x.answer === -1) throw new Error(`no correct answer: ${x.prompt}`)
    if (x.options.length < 2) throw new Error(`needs at least 2 options: ${x.prompt}`)
  }
  return byLevel(qs)
}

/** n items evenly spaced through xs (all of them when there are fewer). */
const spread = <T>(xs: T[], n: number) =>
  xs.length <= n
    ? xs
    : Array.from({ length: n }, (_, i) => xs[Math.floor((i * xs.length) / n)])

type HasQuiz = { quiz?: Question[] }
const all = (lessons: HasQuiz[]) => lessons.flatMap((l) => l.quiz ?? [])

// ponytail: section and final quizzes reuse lesson questions; add authored cross-lesson
// files under content/<course>/quizzes/ if learners find them repetitive.

/** A section ("chapter") quiz: the medium and hard questions of its lessons, up to 10. */
export const sectionQuiz = (lessons: HasQuiz[]) =>
  byLevel(spread(all(lessons).filter((q) => q.level !== "easy"), 10))

/** The course final: up to 8 medium and 12 hard questions from every lesson. */
export function finalQuiz(lessons: HasQuiz[]) {
  const qs = all(lessons)
  return byLevel([
    ...spread(qs.filter((q) => q.level === "medium"), 8),
    ...spread(qs.filter((q) => q.level === "hard"), 12),
  ])
}
