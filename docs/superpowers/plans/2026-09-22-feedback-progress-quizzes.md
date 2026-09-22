# Feedback, Interactive Progress & Quizzes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A green glow on the editor after every clean run, confetti when a challenge, quiz, section or course is completed, interactive progress (lesson steps, section rings, streak and XP), and quizzes that go from easy to hard for each lesson, each section and the whole course.

**Architecture:** Quizzes are a ` ```quiz ` fence inside each lesson's markdown, parsed by a new pure module `lib/quiz.ts`. Section and final quizzes are assembled from the lesson questions, so there's no extra content to write. Every "predict the output" answer is run for real by `check:content`. Results live in two new Dexie tables (`quizzes`, `reads`). Streak and XP are derived from existing rows, so they need no new storage. Feedback uses CSS keyframes (glow) and `motion` (confetti), both of which are already installed. **No new dependencies.**

**Tech Stack:** Next.js 16.3 App Router, React 19.2, TypeScript 5, Tailwind v4, Dexie + dexie-react-hooks, motion 13, sonner, node:test (Node 23 strips types natively).

**Spec:** `docs/superpowers/specs/2026-09-22-feedback-progress-quizzes-design.md`

## Global Constraints

- No new npm dependencies. Use `motion`, `sonner`, `lucide-react` and the shadcn components already installed.
- Read the Next.js docs in `node_modules/next/dist/docs/` before writing route code. Use Context7 for motion and Dexie APIs (CLAUDE.md rule 1).
- Quiz facts are checked against docs.python.org with WebFetch (CLAUDE.md rule 2). Every quiz code question must pass `npm run check:content -- python`.
- Pass mark is **70%**. Difficulty levels are exactly `easy | medium | hard`, always shown easy→hard.
- All motion is suppressed under `prefers-reduced-motion`.
- Storage keys follow `lib/docs.ts` `storageKey`: `"<course>/<id>"`. Quiz keys are `python/print` (lesson), `python/section:2` and `python/final`.
- `lib/quiz.ts` and `lib/stats.ts` must stay importable from plain Node (the check script and node:test). Use `.ts` extensions on relative imports and `import type` for anything else.
- Work on a branch: `git switch -c feature/feedback-quizzes` before Task 1.

## File map

| File | Responsibility |
| --- | --- |
| `lib/quiz.ts` (new) | Quiz types, `parseQuiz`, `byLevel`, `sectionQuiz`, `finalQuiz` |
| `lib/quiz.test.ts` (new) | node:test for the above |
| `lib/stats.ts` (new) | `streak()`, `xp()`, both pure |
| `lib/stats.test.ts` (new) | node:test for the above |
| `lib/lesson-parser.ts` | Pull the ` ```quiz ` fence out into `Lesson.quiz` |
| `lib/docs.ts` | `sections()`, `quizDoc()`, `quizHref()`, `quizStoreKey()` |
| `lib/db.ts` | v3: `quizzes`, `reads` tables |
| `components/celebrate.tsx` (new) | `celebrate()` + `<Celebrations/>` confetti overlay |
| `components/quiz.tsx` (new) | The quiz UI (start → questions → score) |
| `components/lesson-steps.tsx` (new) | `<LessonSteps/>` stepper + `<ReadSentinel/>` |
| `components/progress-ring.tsx` (new) | SVG ring |
| `components/stats-badge.tsx` (new) | 🔥 streak · XP in the sidebar |
| `app/[course]/quiz/[id]/page.tsx` (new) | Section quiz / final exam page |
| `app/globals.css` | Glow keyframes |
| `components/workspace.tsx` | Glow trigger, celebrations, quiz route doc |
| `components/doc.tsx` | Steps, read sentinel, lesson quiz |
| `components/app-sidebar.tsx` | Rings, quiz rows, stats badge |
| `components/course-card.tsx` | Quizzes-passed count |
| `scripts/check-content.ts` | Validate quizzes, run code answers |
| `content/python/lessons/*.md` | Quiz blocks |

---

### Task 1: Green glow on a clean run

**Files:**
- Modify: `app/globals.css` (append at end)
- Modify: `components/workspace.tsx` (`execute()` ~line 207, editor JSX ~line 340)

**Interfaces:**
- Produces: nothing other tasks use.

- [ ] **Step 1: Add the glow CSS** (append to `app/globals.css`):

```css
/* Editor glow after a clean run (components/workspace.tsx). Remounted per run to replay. */
.run-glow {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
  opacity: 0;
  box-shadow:
    inset 0 0 0 2px var(--success),
    inset 0 0 28px color-mix(in oklab, var(--success) 35%, transparent);
  animation: run-glow 900ms ease-out;
}
.run-glow[data-glow="pass"] {
  box-shadow:
    inset 0 0 0 3px var(--success),
    inset 0 0 56px color-mix(in oklab, var(--success) 50%, transparent);
  animation-duration: 1600ms;
}
@keyframes run-glow {
  15% {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .run-glow {
    animation: none;
  }
}
```

(Under reduced motion the element stays at `opacity: 0`, so there's no glow at all.)

- [ ] **Step 2: Trigger it from `execute()`.** In `components/workspace.tsx`, next to the other `useState` calls (~line 158), add:

```tsx
  // Replays the editor glow: `n` remounts the overlay, `kind` picks the strength.
  const [glow, setGlow] = useState<{ n: number; kind: "ok" | "pass" }>()
```

In `execute()`, right after `if (res.error) setTab("output")`, add:

```tsx
    if (res.status === "done" && res.check?.pass !== false)
      setGlow((g) => ({ n: (g?.n ?? 0) + 1, kind: res.check?.pass ? "pass" : "ok" }))
```

- [ ] **Step 3: Render the overlay.** Replace the editor body wrapper:

```tsx
      <div className="min-h-0 flex-1">
        <CodeEditor
```

with

```tsx
      <div className="relative min-h-0 flex-1">
        {glow && <div key={glow.n} data-glow={glow.kind} className="run-glow" aria-hidden />}
        <CodeEditor
```

(The overlay is a sibling, so Monaco never remounts.)

- [ ] **Step 4: Verify.** Run `npm run typecheck && npm run lint` (expect: no errors). Then `npm run dev`, open `http://127.0.0.1:3000/python/lesson/print` in the in-app browser, and check:
  - pressing Run on the starter makes the editor border flash green
  - running `print(1/0)` does not flash
  - pressing Check with the solution flashes stronger and longer

- [ ] **Step 5: Commit**

```bash
git add app/globals.css components/workspace.tsx
git commit -m "feat: green glow on the editor after a clean run"
```

---

### Task 2: Confetti celebrations

**Files:**
- Create: `components/celebrate.tsx`
- Modify: `components/workspace.tsx` (mount + call on check pass)

**Interfaces:**
- Produces: `celebrate(big?: boolean): void` and `<Celebrations />` from `@/components/celebrate`.

- [ ] **Step 1: Confirm the motion API.** Use Context7 (`resolve-library-id` "motion", then `query-docs` "motion/react keyframe arrays with times, useReducedMotion"). `components/output-pane.tsx` already imports `motion` and `useReducedMotion` from `motion/react`, so follow that.

- [ ] **Step 2: Create `components/celebrate.tsx`:**

```tsx
"use client"

import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "motion/react"

// One <Celebrations/> is mounted per workspace; celebrate() reaches it like toast() reaches <Toaster/>.
let fire: ((big: boolean) => void) | undefined

/** Confetti burst. `big` for finishing a section, a course, or a perfect quiz. */
export const celebrate = (big = false) => fire?.(big)

const COLORS = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"]

function Burst({ big }: { big: boolean }) {
  const [bits] = useState(() =>
    Array.from({ length: big ? 60 : 28 }, (_, i) => {
      const angle = Math.random() * Math.PI * 2
      const dist = (big ? 280 : 170) * (0.5 + Math.random() / 2)
      return {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        rotate: Math.random() * 540 - 270,
        size: 6 + Math.random() * 4,
        color: COLORS[i % COLORS.length],
      }
    })
  )
  return (
    <div className="absolute top-1/2 left-1/2">
      {bits.map((b, i) => (
        <motion.span
          key={i}
          className="absolute rounded-[2px]"
          style={{ background: `var(${b.color})`, width: b.size, height: b.size * 0.6 }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{
            x: b.x,
            y: [0, b.y, b.y + 140],
            opacity: [1, 1, 0],
            rotate: b.rotate,
          }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1], times: [0, 0.6, 1] }}
        />
      ))}
    </div>
  )
}

export function Celebrations() {
  const reduce = useReducedMotion()
  const [bursts, setBursts] = useState<{ id: number; big: boolean }[]>([])
  useEffect(() => {
    fire = (big) => {
      if (reduce) return
      const id = Date.now() + Math.random()
      setBursts((b) => [...b, { id, big }])
      setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 1600)
    }
    return () => {
      fire = undefined
    }
  }, [reduce])
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {bursts.map((b) => (
        <Burst key={b.id} big={b.big} />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Mount and fire it.** In `components/workspace.tsx`:
  - import `import { celebrate, Celebrations } from "@/components/celebrate"`
  - render `<Celebrations />` right after `<CommandMenu … />`
  - inside the `if (res.check?.pass && !done.includes(key)) {` block, right after `db.progress.put(...)`, add `celebrate()`

- [ ] **Step 4: Verify.** Run `npm run typecheck && npm run lint`. In the browser, reset progress for one lesson (DevTools → IndexedDB → `thonglearn` → `progress` → delete `python/print`), load the solution and press Check. Expect the confetti burst, the strong glow and the toast. Then emulate reduced motion (`resize_window` colorScheme doesn't cover this, so use DevTools Rendering → "prefers-reduced-motion: reduce") and expect no confetti and no glow.

- [ ] **Step 5: Commit**

```bash
git add components/celebrate.tsx components/workspace.tsx
git commit -m "feat: confetti when a challenge passes"
```

---

### Task 3: Quiz parser, assemblers and section helpers

**Files:**
- Create: `lib/quiz.ts`, `lib/quiz.test.ts`
- Modify: `lib/lesson-parser.ts`, `lib/docs.ts`, `package.json` (add `test` script)

**Interfaces:**
- Produces (from `lib/quiz.ts`):
  ```ts
  export type Level = "easy" | "medium" | "hard"
  export type Question = { level: Level; prompt: string; code?: string; options: string[]; answer: number; explain?: string }
  export function parseQuiz(src: string): Question[]          // throws Error on malformed input
  export const byLevel: (qs: Question[]) => Question[]         // stable easy→medium→hard
  export function sectionQuiz(lessons: { quiz?: Question[] }[]): Question[]  // ≤10 medium/hard
  export function finalQuiz(lessons: { quiz?: Question[] }[]): Question[]    // ≤8 medium + ≤12 hard
  ```
- Produces (`lib/lesson-parser.ts`): `Lesson.quiz?: Question[]`
- Produces (`lib/docs.ts`):
  ```ts
  export const sections: (lessons: Lesson[]) => { id: string; name: string; lessons: Lesson[] }[]
  export const quizDoc: (id: string) => Lesson
  export const quizHref: (course: string, id: string) => string          // "/python/quiz/2"
  export const quizStoreKey: (course: string, id: string) => string      // "python/section:2" | "python/final"
  ```

- [ ] **Step 1: Write the failing test** `lib/quiz.test.ts`:

```ts
import assert from "node:assert/strict"
import { test } from "node:test"

import { finalQuiz, parseQuiz, sectionQuiz, type Question } from "./quiz.ts"

const SRC = `
? hard: Last?
- a
+ b
? easy: What does \`print(1)\` show?
~~~python
print(1)
~~~
+ 1
- 1\\n
> print adds a newline.
> It's the default end.
? medium: Middle?
+ yes
- no
`

test("parses questions, code, options, answer and explanation", () => {
  const qs = parseQuiz(SRC)
  assert.equal(qs.length, 3)
  const [q] = qs.filter((q) => q.level === "easy")
  assert.equal(q.prompt, "What does `print(1)` show?")
  assert.equal(q.code, "print(1)\n")
  assert.deepEqual(q.options, ["1", "1\n"]) // \n is expanded only for code questions
  assert.equal(q.answer, 0)
  assert.equal(q.explain, "print adds a newline. It's the default end.")
})

test("sorts easy → medium → hard", () => {
  assert.deepEqual(parseQuiz(SRC).map((q) => q.level), ["easy", "medium", "hard"])
})

test("keeps a literal \\n in non-code questions", () => {
  const [q] = parseQuiz('? easy: Default end?\n+ `"\\n"`\n- `" "`')
  assert.equal(q.options[0], '`"\\n"`')
})

test("rejects malformed quizzes", () => {
  assert.throws(() => parseQuiz("? tricky: x\n+ a\n- b"), /bad question line/)
  assert.throws(() => parseQuiz("? easy: x\n- a\n- b"), /no correct answer/)
  assert.throws(() => parseQuiz("? easy: x\n+ a\n+ b"), /two correct answers/)
  assert.throws(() => parseQuiz("? easy: x\n+ a"), /at least 2 options/)
  assert.throws(() => parseQuiz("+ a"), /before the first question/)
  assert.throws(() => parseQuiz("? easy: x\n~~~python\nprint(1)\n+ a\n- b"), /unclosed/)
  assert.throws(() => parseQuiz("? easy: x\nhello\n+ a\n- b"), /unexpected quiz line/)
})

const q = (level: Question["level"], prompt: string): Question => ({
  level,
  prompt,
  options: ["a", "b"],
  answer: 0,
})

test("section quiz: medium/hard only, spread across lessons, max 10, easy→hard", () => {
  const lessons = Array.from({ length: 6 }, (_, i) => ({
    quiz: [q("easy", `e${i}`), q("hard", `h${i}`), q("medium", `m${i}`)],
  }))
  const s = sectionQuiz(lessons)
  assert.equal(s.length, 10)
  assert.ok(s.every((x) => x.level !== "easy"))
  const levels = s.map((x) => x.level)
  assert.ok(levels.lastIndexOf("medium") < levels.indexOf("hard")) // all medium before any hard
  assert.ok(s.some((x) => x.prompt.endsWith("0")) && s.some((x) => x.prompt.endsWith("5"))) // first and last lesson
  assert.deepEqual(sectionQuiz([{}, { quiz: [q("easy", "e")] }]), [])
})

test("final quiz: ≤8 medium + ≤12 hard, easy→hard", () => {
  const lessons = Array.from({ length: 20 }, (_, i) => ({ quiz: [q("medium", `m${i}`), q("hard", `h${i}`)] }))
  const f = finalQuiz(lessons)
  assert.equal(f.filter((x) => x.level === "medium").length, 8)
  assert.equal(f.filter((x) => x.level === "hard").length, 12)
  assert.equal(f[0].level, "medium")
})
```

- [ ] **Step 2: Add the test script and run it to see it fail.** In `package.json` `scripts`, add `"test": "node --no-warnings --test lib/*.test.ts",`. Run `npm test`. Expected: FAIL, `Cannot find module …/lib/quiz.ts`.

- [ ] **Step 3: Implement `lib/quiz.ts`:**

```ts
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
```

- [ ] **Step 4: Run the tests.** `npm test`. Expected: all 6 pass.

- [ ] **Step 5: Parse quiz fences in lessons.** In `lib/lesson-parser.ts`:
  - add at the top: `import { parseQuiz, type Question } from "./quiz.ts"`
  - add to the `Lesson` type: `/** easy→hard questions from the ```quiz fence */ quiz?: Question[]`
  - in `parseLesson`, declare `let quiz: string | undefined` before `const body`, and chain one more `.replace` **before** the existing starter/solution/check `.replace`:

```ts
    .replace(/```quiz\n([\s\S]*?)```\n?/, (_, src: string) => {
      quiz = src
      return ""
    })
```

  - add to the returned object: `quiz: quiz === undefined ? undefined : parseQuiz(quiz),`

- [ ] **Step 6: Add the section and quiz helpers to `lib/docs.ts`** (append):

```ts
/** Lessons grouped by `section:` frontmatter. id is its number: "2 · Strings & Lists" → "2". */
export const sections = (lessons: Lesson[]) =>
  [...new Set(lessons.map((l) => l.section))].map((name) => ({
    id: name.split(" ·")[0],
    name,
    lessons: lessons.filter((l) => l.section === name),
  }))

/** The editor's doc on a quiz page: a scratchpad with its own draft ("python/quiz:2"). */
export const quizDoc = (id: string): Lesson => ({
  ...playground,
  id: `quiz:${id}`,
  title: id === "final" ? "Final exam" : `Section ${id} quiz`,
  section: "Quizzes",
})

/** id is a section id ("2") or "final". */
export const quizHref = (course: string, id: string) => `/${course}/quiz/${id}`
export const quizStoreKey = (course: string, id: string) =>
  storageKey(course, id === "final" ? "final" : `section:${id}`)
```

- [ ] **Step 7: Use `sections()` in the sidebar.** In `components/app-sidebar.tsx`, replace the inline `const sections = [...new Set(...)].map(...)` (lines ~70-73) with `const sections = allSections(lessons)` and import `import { sections as allSections } from "@/lib/docs"`. Nothing else changes (`s.name` and `s.lessons` are the same).

- [ ] **Step 8: Verify.** Run `npm test && npm run typecheck && npm run lint`. Expected: all pass. Then run `npm run check:content -- python`. Expected: still "All content passes", because no quizzes exist yet.

- [ ] **Step 9: Commit**

```bash
git add lib/quiz.ts lib/quiz.test.ts lib/lesson-parser.ts lib/docs.ts components/app-sidebar.tsx package.json
git commit -m "feat: quiz format parser and section/final quiz assembly"
```

---

### Task 4: `check:content` validates quizzes

**Files:**
- Modify: `scripts/check-content.ts` (the per-file loop, ~line 143-185)

**Interfaces:**
- Consumes: `Lesson.quiz` (Task 3). `parseLesson` throws on a malformed quiz.

- [ ] **Step 1: Catch parse errors per file.** Replace

```ts
      const l = parseLesson(
        file,
        readFileSync(new URL(file, folder), "utf8"),
        dir === "lessons" ? "lesson" : "guide"
      )
```

with

```ts
      let l
      try {
        l = parseLesson(
          file,
          readFileSync(new URL(file, folder), "utf8"),
          dir === "lessons" ? "lesson" : "guide"
        )
      } catch (e) {
        console.log(`✗ ${file}  → ${(e as Error).message}`)
        failed++
        continue
      }
```

- [ ] **Step 2: Run the code in every quiz question.** Right before `console.log(\`${problems.length ? "✗" : "✓"} …`, add:

```ts
      // "What does this print?": the + answer must be the real output.
      for (const q of l.quiz ?? []) {
        if (!q.code) continue
        if (c.runtime !== "pyodide") {
          // ponytail: only Python's check has __stdout__ wired here; add per-runtime
          // output checks (PHP $output, TS/Dart output) when those courses get quizzes.
          problems.push("quiz code questions are only verified for Python so far")
          break
        }
        const want = q.options[q.answer].trim()
        const r = await execute(
          q.code,
          `assert __stdout__.strip() == ${JSON.stringify(want)}, "printed " + repr(__stdout__.strip())`
        )
        if (!r.check?.pass)
          problems.push(`quiz answer wrong for "${q.prompt}": ${r.check?.message}`)
      }
```

(`JSON.stringify` makes a valid Python string literal, and `__stdout__` is set before the check runs. See the `python()` executor above.)

- [ ] **Step 3: Prove it catches a wrong answer.** Temporarily append to `content/python/lessons/01-print.md`:

````md
```quiz
? easy: What does this print?
~~~python
print(2 + 3)
~~~
+ 6
- 5
```
````

Run `npm run check:content -- python`. Expected: `✗ 01-print.md → quiz answer wrong for "What does this print?": … printed '5'`. Then change `+ 6`/`- 5` to `- 6`/`+ 5` and run it again. Expected: `✓ 01-print.md`. Then append a line `+ 7` inside the fence and expect `✗ … two correct answers`. **Remove the temporary fence** afterwards (Task 5 adds the real one).

- [ ] **Step 4: Commit**

```bash
git add scripts/check-content.ts
git commit -m "feat: check:content validates quizzes and runs output questions"
```

---

### Task 5: Quiz storage, quiz UI and the lesson quiz

**Files:**
- Modify: `lib/db.ts`
- Create: `components/quiz.tsx`
- Modify: `components/doc.tsx`
- Modify: `content/python/lessons/01-print.md` (first real quiz)

**Interfaces:**
- Consumes: `Question` (Task 3), `celebrate` (Task 2), `storageKey` (from `@/components/workspace-context`)
- Produces:
  ```ts
  // lib/db.ts
  export type QuizResult = { key: string; best: number; total: number; passedAt?: number }
  db.quizzes: EntityTable<QuizResult, "key">
  db.reads: EntityTable<{ lessonId: string; readAt: number }, "lessonId">
  // components/quiz.tsx
  export function Quiz(props: { title: string; questions: Question[]; storeKey: string }): JSX.Element
  export const PASS = 0.7
  ```

- [ ] **Step 1: Confirm the Dexie API** with Context7 (`dexie` → "adding a new table in a new db.version, EntityTable typing"). Then edit `lib/db.ts`. Add the type above the `db` declaration:

```ts
/** Best score per quiz. key: "python/print" (lesson), "python/section:2", "python/final". */
export type QuizResult = { key: string; best: number; total: number; passedAt?: number }
```

Extend the `db` type with:

```ts
  quizzes: EntityTable<QuizResult, "key">
  reads: EntityTable<{ lessonId: string; readAt: number }, "lessonId">
```

Append:

```ts
// v3: quiz results, and lessons read to the end (lesson steps).
db.version(3).stores({
  quizzes: "key",
  reads: "lessonId",
})
```

- [ ] **Step 2: Create `components/quiz.tsx`:**

```tsx
"use client"

import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { CheckCircle2Icon, RotateCcwIcon, XCircleIcon } from "lucide-react"

import { celebrate } from "@/components/celebrate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/db"
import type { Level, Question } from "@/lib/quiz"
import { cn } from "@/lib/utils"

export const PASS = 0.7

const LEVEL_TINT: Record<Level, string> = {
  easy: "bg-tint-mint text-success",
  medium: "bg-tint-yellow text-foreground",
  hard: "bg-tint-peach text-foreground",
}

/** Renders `code` spans in quiz text. */
function Inline({ text }: { text: string }) {
  return text.split(/`([^`]+)`/).map((part, i) =>
    i % 2 ? (
      <code key={i} className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[0.85em] text-code-inline">
        {part}
      </code>
    ) : (
      part
    )
  )
}

function shuffle<T>(xs: T[]) {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** One question at a time, easy → hard. Shuffles on Start (client only, so no hydration mismatch). */
export function Quiz({
  title,
  questions,
  storeKey,
}: {
  title: string
  questions: Question[]
  storeKey: string
}) {
  const total = questions.length
  const saved = useLiveQuery(() => db.quizzes.get(storeKey), [storeKey])
  const [orders, setOrders] = useState<number[][]>() // undefined = not started
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number>()
  const [score, setScore] = useState(0)

  const start = () => {
    setOrders(questions.map((q) => shuffle(q.options.map((_, k) => k))))
    setI(0)
    setPicked(undefined)
    setScore(0)
  }
  const q = questions[i]
  const answered = picked !== undefined
  const pick = (k: number) => {
    if (answered) return
    setPicked(k)
    if (k === q.answer) setScore((s) => s + 1)
  }
  const next = async () => {
    setPicked(undefined)
    setI(i + 1)
    if (i + 1 < total) return
    const passed = score / total >= PASS
    const prev = await db.quizzes.get(storeKey)
    await db.quizzes.put({
      key: storeKey,
      total,
      best: Math.max(score, prev?.best ?? 0),
      passedAt: prev?.passedAt ?? (passed ? Date.now() : undefined),
    })
    if (passed) celebrate(score === total)
  }

  return (
    <section aria-label={title} className="mt-12 rounded-xl border p-5 text-base">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-lg font-semibold text-foreground">{title}</h2>
        {saved?.passedAt && (
          <Badge variant="secondary" className="rounded-sm bg-tint-mint text-success">
            <CheckCircle2Icon data-icon="inline-start" />
            Passed
          </Badge>
        )}
        {saved && (
          <span className="text-sm text-muted-foreground tabular-nums">
            Best {saved.best}/{saved.total}
          </span>
        )}
      </div>

      {!orders ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="mr-auto text-sm text-muted-foreground">
            {total} questions, easy → hard. Pass with {Math.ceil(PASS * total)}.
          </p>
          <Button onClick={start}>{saved ? "Retake quiz" : "Start quiz"}</Button>
        </div>
      ) : i === total ? (
        <div className="mt-4 flex flex-col items-start gap-3" aria-live="polite">
          <p className="text-3xl font-semibold text-foreground tabular-nums">
            {score}/{total}
          </p>
          <p>
            {score / total >= PASS
              ? score === total
                ? "Perfect score. 🎉"
                : "Passed. Nice work!"
              : `Not yet. You need ${Math.ceil(PASS * total)} to pass. Reread the lesson and try again.`}
          </p>
          <Button variant="outline" onClick={start}>
            <RotateCcwIcon data-icon="inline-start" />
            Retake
          </Button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <div
            role="progressbar"
            aria-label="Quiz progress"
            aria-valuenow={i}
            aria-valuemin={0}
            aria-valuemax={total}
            className="h-1.5 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-success transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${(i / total) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary" className={cn("rounded-sm capitalize", LEVEL_TINT[q.level])}>
              {q.level}
            </Badge>
            <span className="tabular-nums">
              Question {i + 1} of {total}
            </span>
          </div>
          <p className="font-medium text-foreground">
            <Inline text={q.prompt} />
          </p>
          {q.code && (
            <pre className="overflow-x-auto rounded-lg bg-muted px-4 py-3 font-mono text-[13px] leading-relaxed text-foreground">
              {q.code}
            </pre>
          )}
          <div role="group" aria-label="Answers" className="grid gap-2">
            {orders[i].map((k) => {
              const right = answered && k === q.answer
              const wrong = answered && k === picked && k !== q.answer
              return (
                <button
                  key={k}
                  type="button"
                  aria-disabled={answered}
                  onClick={() => pick(k)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    !answered && "hover:bg-muted/60",
                    right && "border-success bg-tint-mint text-foreground",
                    wrong && "border-destructive bg-destructive/10 text-foreground",
                    q.code && "font-mono text-sm whitespace-pre-wrap"
                  )}
                >
                  <span className="flex-1">{q.code ? q.options[k] : <Inline text={q.options[k]} />}</span>
                  {right && <CheckCircle2Icon className="size-4 shrink-0 text-success" aria-label="correct" />}
                  {wrong && <XCircleIcon className="size-4 shrink-0 text-destructive" aria-label="your answer" />}
                </button>
              )
            })}
          </div>
          <div aria-live="polite">
            {answered && (
              <div className="flex flex-wrap items-start gap-3">
                <p className="mr-auto text-sm">
                  <strong className={picked === q.answer ? "text-success" : "text-destructive"}>
                    {picked === q.answer ? "Correct!" : "Not quite."}
                  </strong>{" "}
                  {q.explain && <Inline text={q.explain} />}
                </p>
                <Button autoFocus onClick={next}>
                  {i + 1 < total ? "Next question" : "See results"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
```

Note that `next()` reads `score`, which already includes the last answer because `pick()` ran in an earlier render.

- [ ] **Step 3: Render it at the end of a lesson.** In `components/doc.tsx`:
  - imports: `import { Quiz } from "@/components/quiz"`, and add `storageKey` to the existing `@/components/workspace-context` import
  - just before `</article>`, add:

```tsx
      {doc.kind === "lesson" && doc.quiz?.length ? (
        <Quiz
          key={doc.id}
          title="Check your understanding"
          questions={doc.quiz}
          storeKey={storageKey(course, doc.id)}
        />
      ) : null}
```

- [ ] **Step 4: Write the first real quiz.** First WebFetch `https://docs.python.org/3/library/functions.html#print` and `https://docs.python.org/3/reference/lexical_analysis.html#comments` to confirm `sep`/`end` defaults and the comment rules. Then append to the end of `content/python/lessons/01-print.md`:

````md
```quiz
? easy: What does this print?
~~~python
print("Sum:", 2 + 3)
~~~
+ Sum: 5
- Sum:5
- Sum: 2 + 3
> print() puts sep=" " between values, and 2 + 3 is evaluated before printing.
? easy: Which character starts a comment in Python?
+ `#`
- `//`
- `--`
- `/*`
> Everything after `#` on a line is ignored (unless the `#` is inside a string).
? medium: What does this print?
~~~python
print("a", "b", "c", sep="-")
~~~
+ a-b-c
- a b c
- a-b-c-
- abc
> `sep` goes between values, never after the last one.
? medium: What is the default value of print()'s `end` argument?
+ `"\n"`, a newline
- `" "`, a space
- `""`, nothing
- `None`
> That's why each print() starts a new line.
? hard: What does this print?
~~~python
print("no newline", end="")
print(" …continued")
~~~
+ no newline …continued
- no newline\n …continued
- no newline…continued
> `end=""` replaces the newline, so the next print continues on the same line.
```
````

- [ ] **Step 5: Verify.** Run `npm run check:content -- python`. Expected: `✓ 01-print.md` and all others ✓. Run `npm run typecheck && npm run lint`. In the browser at `/python/lesson/print`:
  - the quiz card is at the bottom; press Start
  - the chips go Easy, Easy, Medium, Medium, Hard
  - a wrong pick shows red, the right answer shows green, and the explanation appears
  - Tab then Enter works without a mouse
  - get ≥4 right and you see confetti and the "Passed" badge
  - reload: "Best 4/5" and Passed are still there
  - retake with 1 right: best stays 4 and Passed stays

- [ ] **Step 6: Commit**

```bash
git add lib/db.ts components/quiz.tsx components/doc.tsx content/python/lessons/01-print.md
git commit -m "feat: lesson quizzes with easy→hard questions and saved best score"
```

---

### Task 6: Section quiz and final exam pages

**Files:**
- Create: `app/[course]/quiz/[id]/page.tsx`
- Modify: `components/workspace.tsx` (doc chain)
- Modify: `components/app-sidebar.tsx` (quiz rows)

**Interfaces:**
- Consumes: `sections`, `quizDoc`, `quizHref`, `quizStoreKey` (Task 3), `sectionQuiz`/`finalQuiz` (Task 3), `Quiz` (Task 5), `db.quizzes` (Task 5)

- [ ] **Step 1: Read the route docs.** Read `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-static-params.md` (nested dynamic segments, parent params) and `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md`. Follow the pattern in `app/[course]/lesson/[slug]/page.tsx`.

- [ ] **Step 2: Create `app/[course]/quiz/[id]/page.tsx`:**

```tsx
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Quiz } from "@/components/quiz"
import { getCourse } from "@/lib/content"
import { quizStoreKey, sections } from "@/lib/docs"
import { finalQuiz, sectionQuiz } from "@/lib/quiz"

export const dynamicParams = false

export function generateStaticParams({
  params: { course },
}: {
  params: { course: string }
}) {
  const lessons = getCourse(course)!.lessons
  return [...sections(lessons).map((s) => s.id), "final"].map((id) => ({ id }))
}

function load(course: string, id: string) {
  const lessons = getCourse(course)!.lessons
  if (id === "final")
    return {
      title: "Final exam",
      intro: "Questions from every section of the course, easy → hard.",
      questions: finalQuiz(lessons),
    }
  const s = sections(lessons).find((s) => s.id === id)
  return s && {
    title: `Section quiz: ${s.name}`,
    intro: `The medium and hard questions from ${s.lessons.length} lessons, easy → hard.`,
    questions: sectionQuiz(s.lessons),
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/[course]/quiz/[id]">): Promise<Metadata> {
  const { course, id } = await params
  return { title: load(course, id)?.title }
}

export default async function QuizPage({
  params,
}: PageProps<"/[course]/quiz/[id]">) {
  const { course, id } = await params
  const quiz = load(course, id)
  if (!quiz?.questions.length) notFound()
  return (
    <article className="mx-auto max-w-[720px] px-5 pt-8 pb-16 text-[length:var(--reading-size)] leading-[1.6] text-slate md:px-8 md:pt-10">
      <h1 className="text-[28px] leading-[1.2] font-semibold tracking-[-0.5px] text-foreground md:text-[36px]">
        {quiz.title}
      </h1>
      <p className="mt-2 text-base text-muted-foreground md:text-lg">{quiz.intro}</p>
      <Quiz title={quiz.title} questions={quiz.questions} storeKey={quizStoreKey(course, id)} />
    </article>
  )
}
```

(`PageProps<"/[course]/quiz/[id]">` is generated by `next dev`/`next build` typegen. If `typecheck` complains before the first dev run, start `npm run dev` once.)

- [ ] **Step 3: Give the editor a doc on quiz pages.** In `components/workspace.tsx`, import `quizDoc` from `@/lib/docs` and extend the `doc` chain: replace `: route === "run"` with `: route === "quiz" ? quizDoc(param) : route === "run"`. The sidebar's `current` becomes `"quiz:2"` / `"quiz:final"`.

- [ ] **Step 4: Sidebar quiz rows.** In `components/app-sidebar.tsx`:
  - imports: `ListChecksIcon, TrophyIcon` from `lucide-react`, and `quizHref, quizStoreKey` from `@/lib/docs`
  - after the `recent` query add:

```tsx
  const passed = useLiveQuery(
    () =>
      db.quizzes
        .where("key")
        .startsWith(`${course}/`)
        .filter((q) => !!q.passedAt)
        .primaryKeys(),
    [course],
    [] as string[]
  )
  const hasQuizzes = lessons.some((l) => l.quiz?.length)
```

  - inside `<SidebarMenuSub>` after `{s.lessons.map(...)}`, add:

```tsx
                          {s.lessons.some((l) => l.quiz?.length) && (
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild isActive={current === `quiz:${s.id}`}>
                                <Link href={quizHref(course, s.id)}>
                                  <ListChecksIcon />
                                  <span>Section quiz</span>
                                  {passed.includes(quizStoreKey(course, s.id)) && (
                                    <CheckIcon className="ml-auto text-success" />
                                  )}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )}
```

  - after the `{sections.map(...)}` closing `})}` inside the sessions `<SidebarMenu>`, add:

```tsx
              {hasQuizzes && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={current === "quiz:final"}>
                    <Link href={quizHref(course, "final")}>
                      <TrophyIcon />
                      <span>Final exam</span>
                      {passed.includes(quizStoreKey(course, "final")) && (
                        <CheckIcon className="ml-auto text-success" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
```

- [ ] **Step 5: Verify.** Run `npm run typecheck && npm run lint`. In the browser:
  - open the "1 · The Basics" section (or whichever contains `print`); there's a "Section quiz" row
  - "Final exam" is under the sections
  - `/python/quiz/1` shows 2 questions (the medium ones from lesson 1 only, so far) and the header says "Section 1 quiz"
  - pass it and the sidebar row gets a ✓
  - `/python/quiz/99` returns 404
  - `/php/quiz/final` returns 404 (no PHP quizzes yet)
  - `npm run build` succeeds

- [ ] **Step 6: Commit**

```bash
git add "app/[course]/quiz" components/workspace.tsx components/app-sidebar.tsx
git commit -m "feat: section quizzes and final exam assembled from lesson quizzes"
```

---

### Task 7: Streak, XP, section rings and course card

**Files:**
- Create: `lib/stats.ts`, `lib/stats.test.ts`, `components/progress-ring.tsx`, `components/stats-badge.tsx`
- Modify: `components/app-sidebar.tsx`, `components/course-card.tsx`

**Interfaces:**
- Consumes: `QuizResult` shape (Task 5), `useWorkspace().done`
- Produces:
  ```ts
  export function streak(times: number[], now: number): number
  export function xp(lessonsDone: number, quizzes: { key: string; best: number; passedAt?: number }[]): number
  export function ProgressRing(p: { value: number; max: number; className?: string }): JSX.Element
  export function StatsBadge(): JSX.Element   // reads course + done from useWorkspace()
  ```

- [ ] **Step 1: Write the failing test** `lib/stats.test.ts`:

```ts
import assert from "node:assert/strict"
import { test } from "node:test"

import { streak, xp } from "./stats.ts"

const at = (day: number, hour = 10) => new Date(2026, 8, day, hour).getTime()

test("streak counts consecutive local days back from today", () => {
  const now = at(22, 18)
  assert.equal(streak([], now), 0)
  assert.equal(streak([at(22), at(22, 11), at(21), at(20)], now), 3)
  assert.equal(streak([at(22), at(20)], now), 1) // gap on the 21st
})

test("a streak survives until today is over", () => {
  assert.equal(streak([at(21), at(20)], at(22, 9)), 2)
  assert.equal(streak([at(20)], at(22, 9)), 0)
})

test("xp: 10/lesson, 2/quiz point, 50/section quiz passed, 200/final passed", () => {
  assert.equal(xp(0, []), 0)
  assert.equal(
    xp(3, [
      { key: "python/print", best: 4 },
      { key: "python/section:1", best: 9, passedAt: 1 },
      { key: "python/section:2", best: 2 },
      { key: "python/final", best: 18, passedAt: 1 },
    ]),
    30 + 8 + 50 + 200
  )
})
```

- [ ] **Step 2: Run it to see it fail.** `npm test`. Expected: FAIL, cannot find `./stats.ts`.

- [ ] **Step 3: Implement `lib/stats.ts`:**

```ts
/** Consecutive local days with activity, counting back from today (or yesterday if today has none yet). */
export function streak(times: number[], now: number) {
  const day = (t: number) => new Date(t).toDateString()
  const days = new Set(times.map(day))
  const d = new Date(now)
  if (!days.has(day(+d))) d.setDate(d.getDate() - 1)
  let n = 0
  while (days.has(day(+d))) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

/** Course XP: 10 per lesson, 2 per best lesson-quiz point, 50 per section quiz and 200 for the final once passed. */
export function xp(
  lessonsDone: number,
  quizzes: { key: string; best: number; passedAt?: number }[]
) {
  return quizzes.reduce((sum, q) => {
    const id = q.key.slice(q.key.indexOf("/") + 1)
    if (id === "final") return sum + (q.passedAt ? 200 : 0)
    if (id.startsWith("section:")) return sum + (q.passedAt ? 50 : 0)
    return sum + q.best * 2
  }, lessonsDone * 10)
}
```

- [ ] **Step 4: Run the tests.** `npm test`. Expected: all pass.

- [ ] **Step 5: Create `components/progress-ring.tsx`:**

```tsx
import { cn } from "@/lib/utils"

const R = 6
const C = 2 * Math.PI * R

/** A small ring that fills as value approaches max; animates via CSS on change. */
export function ProgressRing({ value, max, className }: { value: number; max: number; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={cn("size-3.5 -rotate-90", className)}>
      <circle cx="8" cy="8" r={R} fill="none" strokeWidth="2.5" className="stroke-border" />
      <circle
        cx="8"
        cy="8"
        r={R}
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={C * (1 - (max ? value / max : 0))}
        className="stroke-success transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
      />
    </svg>
  )
}
```

- [ ] **Step 6: Create `components/stats-badge.tsx`:**

```tsx
"use client"

import { useLiveQuery } from "dexie-react-hooks"
import { motion, useReducedMotion } from "motion/react"

import { useWorkspace } from "@/components/workspace-context"
import { db } from "@/lib/db"
import { streak, xp } from "@/lib/stats"

/** A number that pops when it changes. */
function Pop({ value }: { value: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.span
      key={value}
      initial={reduce ? false : { scale: 1.35, opacity: 0.4 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-block tabular-nums"
    >
      {value}
    </motion.span>
  )
}

/** 🔥 day streak (any course) · XP (this course), in the sidebar header. */
export function StatsBadge() {
  const { course, done } = useWorkspace()
  const times = useLiveQuery(
    () => db.runs.orderBy("createdAt").keys() as unknown as Promise<number[]>,
    [],
    []
  )
  const quizzes = useLiveQuery(
    () => db.quizzes.where("key").startsWith(`${course}/`).toArray(),
    [course],
    []
  )
  const days = streak(times, Date.now())
  const points = xp(done.length, quizzes)
  return (
    <p
      className="flex items-center gap-3 px-2 text-xs text-muted-foreground"
      aria-label={`${days} day streak, ${points} XP`}
    >
      <span title="Days in a row with a run">
        🔥 <Pop value={days} /> {days === 1 ? "day" : "days"}
      </span>
      <span title="10 per lesson, 2 per quiz point, 50 per section quiz, 200 for the final">
        ⚡ <Pop value={points} /> XP
      </span>
    </p>
  )
}
```

- [ ] **Step 7: Wire into the sidebar.** In `components/app-sidebar.tsx`:
  - import `ProgressRing` and `StatsBadge`
  - render `<StatsBadge />` right after `<CourseSwitcher course={course} />`
  - inside `<SidebarMenuBadge …>`, change the contents to:

```tsx
                        <span className="flex items-center gap-1.5">
                          <ProgressRing value={count} max={s.lessons.length} />
                          {count}/{s.lessons.length}
                        </span>
```

- [ ] **Step 8: Course card quiz count.** In `components/course-card.tsx`, add:

```tsx
  const quizzesPassed = useLiveQuery(
    () =>
      db.quizzes
        .where("key")
        .startsWith(`${course.id}/`)
        .filter((q) => !!q.passedAt)
        .count(),
    [course.id],
    0
  )
```

and change `{done}/{lessonIds.length} done` to `{done}/{lessonIds.length} done{quizzesPassed > 0 && \` · ${quizzesPassed} quizzes passed\`}`.

- [ ] **Step 9: Verify.** Run `npm test && npm run typecheck && npm run lint`. In the browser:
  - the sidebar header shows `🔥 1 day ⚡ N XP`
  - pass a quiz and XP pops up by the right amount
  - pass a new lesson: that section's ring fills a step with an animated sweep
  - Home: the Python card shows "· 1 quizzes passed". Use "1 quiz passed" wording if you prefer, keeping the pluralization simple.

- [ ] **Step 10: Commit**

```bash
git add lib/stats.ts lib/stats.test.ts components/progress-ring.tsx components/stats-badge.tsx components/app-sidebar.tsx components/course-card.tsx
git commit -m "feat: streak, XP, section progress rings and quiz count"
```

---

### Task 8: Lesson steps (Read → Run → Challenge → Quiz)

**Files:**
- Create: `components/lesson-steps.tsx`
- Modify: `components/doc.tsx`

**Interfaces:**
- Consumes: `db.reads`, `db.quizzes` (Task 5), `db.runs`, `useWorkspace()`, `storageKey`
- Produces: `LessonSteps({ doc })`, `ReadSentinel({ lessonKey })`

- [ ] **Step 1: Create `components/lesson-steps.tsx`:**

```tsx
"use client"

import { useEffect, useRef } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { CheckCircle2Icon, CircleIcon } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

import { storageKey, useWorkspace } from "@/components/workspace-context"
import { db } from "@/lib/db"
import type { Lesson } from "@/lib/lesson-parser"

/** Marks the lesson as read once its end scrolls into view. */
export function ReadSentinel({ lessonKey }: { lessonKey: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      db.reads.put({ lessonId: lessonKey, readAt: Date.now() })
      io.disconnect()
    })
    io.observe(el)
    return () => io.disconnect()
  }, [lessonKey])
  return <div ref={ref} aria-hidden />
}

export function LessonSteps({ doc }: { doc: Lesson }) {
  const { course, done } = useWorkspace()
  const reduce = useReducedMotion()
  const key = storageKey(course, doc.id)
  const [read, ran, quiz] = useLiveQuery(
    () =>
      Promise.all([
        db.reads.get(key).then(Boolean),
        db.runs.where("lessonId").equals(key).count().then((n) => n > 0),
        db.quizzes.get(key).then((q) => !!q?.passedAt),
      ]),
    [key],
    [false, false, false]
  )
  const steps: [string, boolean][] = [
    ["Read", read],
    ["Run code", ran],
    ["Pass challenge", done.includes(doc.id)],
    ...(doc.quiz?.length ? [["Pass quiz", quiz] as [string, boolean]] : []),
  ]
  return (
    <ol aria-label="Lesson progress" className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      {steps.map(([label, ok]) => (
        <li key={label} className={ok ? "flex items-center gap-1.5 text-foreground" : "flex items-center gap-1.5 text-muted-foreground"}>
          <motion.span key={String(ok)} initial={reduce || !ok ? false : { scale: 0.4 }} animate={{ scale: 1 }} className="flex">
            {ok ? <CheckCircle2Icon className="size-4 text-success" /> : <CircleIcon className="size-4" />}
          </motion.span>
          {label}
          <span className="sr-only">{ok ? "(done)" : "(to do)"}</span>
        </li>
      ))}
    </ol>
  )
}
```

- [ ] **Step 2: Put them in the lesson.** In `components/doc.tsx`:
  - import `LessonSteps, ReadSentinel` from `@/components/lesson-steps`
  - right after the `<h1>…</h1>` add `{doc.kind === "lesson" && <LessonSteps doc={doc} />}`
  - right before the quiz block from Task 5 add `{doc.kind === "lesson" && <ReadSentinel lessonKey={storageKey(course, doc.id)} />}`

- [ ] **Step 3: Verify.** Run `npm run typecheck && npm run lint`. In the browser, on a lesson you haven't touched (e.g. `/python/lesson/variables`, after deleting its rows in IndexedDB):
  - all four steps are empty circles
  - scroll to the end and "Read" pops to ✓
  - Run and "Run code" ✓s
  - Check with the solution and "Pass challenge" ✓s
  - `/python/lesson/numbers` (no quiz yet) shows 3 steps

- [ ] **Step 4: Commit**

```bash
git add components/lesson-steps.tsx components/doc.tsx
git commit -m "feat: lesson step tracker (read, run, challenge, quiz)"
```

---

### Task 9: Section and course completion celebrations

**Files:**
- Modify: `components/workspace.tsx` (the check-pass block in `execute()`)

**Interfaces:**
- Consumes: `sections`, `quizHref` (Task 3), `celebrate` (Task 2)

- [ ] **Step 1: Replace the completion block.** Import `sections, quizHref` from `@/lib/docs`. Replace the whole `if (res.check?.pass && !done.includes(key)) { … }` block with:

```tsx
    if (res.check?.pass && !done.includes(key)) {
      await db.progress.put({ lessonId: saveKey, completedAt: Date.now() })
      const finished = [...done, key]
      const next = lessons[lessons.indexOf(doc) + 1]
      const sec = sections(lessons).find((s) => s.lessons.includes(doc))
      const sectionDone = sec?.lessons.every((l) => finished.includes(l.id)) ?? false
      const courseDone = lessons.every((l) => finished.includes(l.id))
      const quizzes = lessons.some((l) => l.quiz?.length)
      const go = (label: string, href: string) => ({ label, onClick: () => router.push(href) })
      celebrate(sectionDone)
      if (courseDone)
        toast.success(`You finished ${c.name}! 🎉`, {
          description: quizzes ? "Prove it with the final exam." : "Every lesson done.",
          action: quizzes ? go("Final exam", quizHref(course, "final")) : undefined,
        })
      else if (sec && sectionDone && sec.lessons.some((l) => l.quiz?.length))
        toast.success(`Section complete: ${sec.name}`, {
          description: "Lock it in with the section quiz.",
          action: go("Section quiz", quizHref(course, sec.id)),
        })
      else
        toast.success(sec && sectionDone ? `Section complete: ${sec.name}` : `${doc.title} complete!`, {
          description: next ? `Up next: ${next.title}` : undefined,
          action: next ? go("Next lesson", docHref(next, course)) : undefined,
        })
    }
```

(Remove the plain `celebrate()` call added in Task 2. This block replaces it.)

- [ ] **Step 2: Verify.** Run `npm run typecheck && npm run lint`. In the browser, delete `python/print` from `progress` in IndexedDB, mark every other lesson of that section done (pass their checks, or add rows in DevTools), then pass `print`'s check. Expect the big confetti and the "Section complete: …" toast with a **Section quiz** button that opens `/python/quiz/1`. Passing a middle lesson still shows the small burst and "Up next".

- [ ] **Step 3: Commit**

```bash
git add components/workspace.tsx
git commit -m "feat: celebrate finishing a section or the course"
```

---

### Tasks 10–13: Python lesson quizzes

Each of these four tasks follows **exactly this procedure**. Only the lesson list differs.

| Task | Lessons (`content/python/lessons/`) |
| --- | --- |
| 10 | `02-variables.md`, `03-numbers.md`, `04-booleans.md`, `05-if-elif.md`, `06-strings.md` |
| 11 | `07-f-strings.md`, `08-lists.md`, `09-slicing.md`, `10-tuples.md`, `11-while.md` |
| 12 | `12-for-range.md`, `13-break-continue.md`, `14-loop-patterns.md`, `15-dicts.md` |
| 13 | `16-match.md`, `17-functions.md`, `18-args-kwargs.md`, `19-lambda-sorted.md`, then run the whole-course verification below |

(Run `ls content/python/lessons` first. If there are more than 19 files, add the extras to Task 13.)

**Per lesson:**

- [ ] **Step 1: Read the lesson** and note the 3–5 facts it teaches. Only quiz what the lesson (or an earlier one) teaches.
- [ ] **Step 2: Fact-check** each fact with WebFetch on its docs.python.org page. The lesson's own "Reference" link is the starting point. Check the 3.14 behavior in https://docs.python.org/3/whatsnew/3.14.html if relevant.
- [ ] **Step 3: Append a ` ```quiz ` fence** at the very end of the file, in the format from Task 3 and the `01-print.md` example (Task 5):
  - **5 or 6 questions: 2 easy, 2 medium, 1–2 hard.**
  - **At least 2 are "What does this print?"** with a `~~~python` block, so `check:content` verifies them. At least one hard question should be a code question.
  - Easy = recall one fact. Medium = apply it to a small case. Hard = a combination, an edge case or a common misconception (e.g. `-7 // 2`, mutating a list while aliasing, `range` stop being exclusive).
  - Every wrong option is a plausible mistake, not a joke. 3–4 options each.
  - Every question has a `>` explanation of *why* the answer is right, in the lesson's plain voice.
  - Code-question options are exact output. Use `\n` for multi-line output. Don't use code questions whose output depends on randomness, time, or dict/set ordering you haven't reasoned about.
  - A question with a code block that raises an error isn't checkable. Ask "What happens?" as a non-code question with the code in backticks instead, or use an explicit `try/except` that prints.
- [ ] **Step 4: Run** `npm run check:content -- python`. Every edited file must show ✓. When a code answer is wrong, the message shows what was really printed. Fix the *question*, don't just copy the output without understanding why.
- [ ] **Step 5: Commit** the group:

```bash
git add content/python/lessons
git commit -m "content: Python quizzes for lessons NN–MM"
```

**Task 13 only, after its lessons:**

- [ ] **Step 6: Require quizzes for Python.** In `scripts/check-content.ts`, inside `if (dir === "lessons") {`, add:

```ts
        // ponytail: add courses here as their quizzes are written.
        if (c.id === "python" && !l.quiz?.length) problems.push("missing quiz")
```

Run `npm run check:content -- python`. Expected: "All content passes".

- [ ] **Step 7: Commit**

```bash
git add scripts/check-content.ts content/python/lessons
git commit -m "content: Python quizzes for lessons 16–19; require quizzes for Python"
```

---

### Task 14: Final verification

- [ ] **Step 1:** `npm test && npm run typecheck && npm run lint && npm run check:content -- python && npm run build`. All pass.
- [ ] **Step 2:** In the built/dev app (in-app browser), walk the spec's checklist:
  - clean run glows, an error doesn't, and Check pass glows strong with confetti
  - lesson quiz works by keyboard only and persists after a reload
  - steps tick off as you go
  - finishing a section shows big confetti and the section-quiz toast
  - every section quiz has ≤10 questions, medium then hard
  - the final exam has 20 questions, medium then hard
  - rings, XP and streak update live
  - Home course card shows the quizzes passed
  - PHP course: no quiz rows, `/php/quiz/final` returns 404, runs still glow
- [ ] **Step 3:** With reduced motion emulated (DevTools → Rendering → `prefers-reduced-motion: reduce`), there's no glow, no confetti and no pops, and everything else works.
- [ ] **Step 4:** Mobile width (`resize_window` preset mobile): the quiz fits, there's no horizontal scroll, and the sidebar stats badge doesn't overflow. Reset with preset desktop.
- [ ] **Step 5:** Run the `code-review` skill on the branch, fix findings, then `superpowers:finishing-a-development-branch`.
