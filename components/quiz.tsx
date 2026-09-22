"use client"

import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { CheckCircle2Icon, RotateCcwIcon, XCircleIcon } from "lucide-react"

import { celebrate } from "@/components/celebrate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/db"
import { pushRow } from "@/lib/sync"
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
    const row = {
      key: storeKey,
      total,
      best: Math.max(score, prev?.best ?? 0),
      passedAt: prev?.passedAt ?? (passed ? Date.now() : undefined),
    }
    await db.quizzes.put(row)
    pushRow("quizzes", row)
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
