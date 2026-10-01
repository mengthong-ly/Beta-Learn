"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon, ArrowRightIcon, SparklesIcon } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

import { Button } from "@/components/ui/button"
import {
  placeFrom,
  QUESTIONS,
  readPlacement,
  savePlacement,
  START_POINTS,
  type Answers,
  type Goal,
} from "@/lib/placement"
import { cn } from "@/lib/utils"

type Unit = { title: string; section: string }
type AllAnswers = Answers & { goal: Goal }

const noop = () => () => {}

/** /start: four quick questions, then a starting point inside Fundamentals. Asked once per browser. */
export function Placement({
  first,
  units,
}: {
  first: string
  units: Record<string, Unit>
}) {
  const router = useRouter()
  const reduce = useReducedMotion()
  // "loading" on the server, then whether this browser has placed before.
  const placed = useSyncExternalStore(
    noop,
    () => (readPlacement() ? "yes" : "no"),
    () => "loading"
  )
  const [q, setQ] = useState(0)
  const [answers, setAnswers] = useState<Partial<AllAnswers>>({})

  useEffect(() => {
    if (placed === "yes") router.replace("/fundamentals")
  }, [placed, router])

  if (placed !== "no") return null

  const done = q >= QUESTIONS.length
  const question = QUESTIONS[q]

  const pick = (value: string) => {
    setAnswers((a) => ({ ...a, [question.id]: value }))
    setQ(q + 1)
  }

  const begin = (start: string, href = `/fundamentals/lesson/${start}`) => {
    savePlacement({ start, goal: answers.goal ?? "unsure", at: Date.now() })
    router.push(href)
  }

  const start = done ? placeFrom(answers as AllAnswers) : ""
  const unit = units[start === "skip" ? START_POINTS.blocks : start]

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col px-4 py-10 sm:px-8 sm:py-16">
      <header className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md bg-foreground font-mono text-xs font-bold text-background">
          Th
        </span>
        <span className="font-semibold">ThongLearn</span>
        <Link
          href="/courses"
          className="ml-auto rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          See all courses
        </Link>
      </header>

      <div
        aria-hidden
        className="mt-12 flex gap-1"
      >
        {QUESTIONS.map((_, n) => (
          <span
            key={n}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-200",
              n < q ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      <motion.section
        key={q}
        initial={reduce ? false : { opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="mt-8"
      >
        {!done ? (
          <>
            <p className="text-sm text-muted-foreground tabular-nums">
              Question {q + 1} of {QUESTIONS.length}
            </p>
            <h1
              id="placement-q"
              className="mt-1 text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
            >
              {question.prompt}
            </h1>
            {"code" in question && (
              <pre className="mt-4 rounded-lg bg-muted px-4 py-3 font-mono text-sm">
                {question.code}
              </pre>
            )}
            <ul
              role="group"
              aria-labelledby="placement-q"
              className="mt-6 flex flex-col gap-2"
            >
              {question.options.map((o) => (
                <li key={o.value}>
                  <button
                    type="button"
                    onClick={() => pick(o.value)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition-[background-color,transform] duration-150 ease-out hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.99]",
                      answers[question.id as keyof AllAnswers] === o.value &&
                        "border-primary"
                    )}
                  >
                    <span className={question.id === "x" ? "font-mono" : ""}>
                      {o.label}
                    </span>
                    <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : start === "skip" ? (
          <>
            <SparklesIcon className="size-7 text-success" />
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              You already know the basics
            </h1>
            <p className="mt-2 text-muted-foreground">
              Go straight to a language course. Fundamentals is always there
              if you want a refresher.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => begin(START_POINTS.blocks, "/courses")}>
                Pick a course <ArrowRightIcon data-icon="inline-end" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => begin(START_POINTS.blocks)}>
                Take Fundamentals anyway
              </Button>
            </div>
          </>
        ) : (
          <>
            <SparklesIcon className="size-7 text-success" />
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              {start === first ? "Let's start from the very beginning" : "You've got a head start"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {start === first
                ? "No experience needed: every idea is explained from zero."
                : "You'll skip what you already know. Earlier lessons are always there if you want them."}
            </p>
            {unit && (
              <div className="mt-6 rounded-xl border px-4 py-3.5">
                <p className="text-xs text-muted-foreground">Your first lesson</p>
                <p className="mt-0.5 font-semibold">{unit.title}</p>
                <p className="text-sm text-muted-foreground">Unit {unit.section}</p>
              </div>
            )}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={() => begin(start)}>
                Start learning <ArrowRightIcon data-icon="inline-end" />
              </Button>
              {start !== first && (
                <Button size="lg" variant="ghost" onClick={() => begin(first)}>
                  Start from lesson 1 instead
                </Button>
              )}
            </div>
          </>
        )}
      </motion.section>

      {q > 0 && (
        <Button
          variant="ghost"
          className="mt-8 self-start"
          onClick={() => setQ(q - 1)}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Back
        </Button>
      )}
    </main>
  )
}
