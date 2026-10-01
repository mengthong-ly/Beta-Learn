"use client"

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ArrowLeftIcon, ArrowRightIcon, PartyPopperIcon } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

import { markComplete, ReadSentinel, readOnly } from "@/components/lesson-steps"
import { Quiz } from "@/components/quiz"
import { Button } from "@/components/ui/button"
import {
  ARTICLE_CLASS,
  DocHeader,
  Pager,
  useMarkdownComponents,
} from "@/components/v1/doc"
import { storageKey, useWorkspace } from "@/components/workspace-context"
import { rehypeEmoji3d } from "@/lib/rehype-emoji"
import { splitSteps, type Lesson } from "@/lib/lesson-parser"
import { cn } from "@/lib/utils"

type Card =
  | { kind: "content"; title?: string; body: string }
  | { kind: "quiz"; title: string }
  | { kind: "finish"; title: string }

const stepFromHash = () => {
  const n = Number(window.location.hash.match(/^#step-(\d+)$/)?.[1])
  return n > 0 ? n - 1 : 0
}

// The step lives in the URL (#step-3), so a reload keeps your place.
const hashListeners = new Set<() => void>()
function useHashStep() {
  return useSyncExternalStore(
    (l) => {
      hashListeners.add(l)
      window.addEventListener("hashchange", l)
      return () => {
        hashListeners.delete(l)
        window.removeEventListener("hashchange", l)
      }
    },
    stepFromHash,
    () => 0
  )
}
function setHashStep(n: number) {
  history.replaceState(history.state, "", `#step-${n + 1}`)
  hashListeners.forEach((l) => l())
}

/** Typing in the editor, a quiz answer or any field must not change steps. */
const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement &&
  (t.isContentEditable ||
    !!t.closest("input, textarea, select, .monaco-editor"))

/** A lesson shown one step at a time: steps split at `##` and `---`, then the quiz, then a finish card. */
export function LessonStepper({ doc }: { doc: Lesson }) {
  const { course } = useWorkspace()
  const components = useMarkdownComponents(doc)
  const reduce = useReducedMotion()
  const top = useRef<HTMLDivElement>(null)
  const region = useRef<HTMLDivElement>(null)

  const cards = useMemo<Card[]>(
    () => [
      ...splitSteps(doc.body).map((s) => ({ kind: "content" as const, ...s })),
      ...(doc.quiz?.length
        ? [{ kind: "quiz" as const, title: "Check your understanding" }]
        : []),
      { kind: "finish", title: "Done" },
    ],
    [doc.body, doc.quiz]
  )

  const i = Math.min(useHashStep(), cards.length - 1)
  const [dir, setDir] = useState(0)
  const card = cards[i]

  const go = (next: number) => {
    if (next < 0 || next >= cards.length || next === i) return
    setDir(next > i ? 1 : -1)
    setHashStep(next)
    top.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" })
    region.current?.focus({ preventScroll: true })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return
      if (e.key === "ArrowRight") go(i + 1)
      if (e.key === "ArrowLeft") go(i - 1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  const next = cards[i + 1]
  const nextLabel =
    next?.kind === "quiz" ? "Check your understanding" : next?.kind === "finish" ? "Finish" : "Continue"

  return (
    <article className={ARTICLE_CLASS}>
      <div ref={top} className="scroll-mt-4" />
      <DocHeader doc={doc} />

      <nav aria-label="Lesson steps" className="mt-6">
        <div className="mb-2 flex items-baseline justify-between gap-3 text-xs text-muted-foreground">
          <span className="truncate">{card.title ?? doc.title}</span>
          <span className="shrink-0 tabular-nums">
            Step {i + 1} of {cards.length}
          </span>
        </div>
        <ol className="flex gap-1">
          {cards.map((c, n) => (
            <li key={n} className="flex-1">
              <button
                type="button"
                onClick={() => go(n)}
                aria-label={`Step ${n + 1}${c.title ? `: ${c.title}` : ""}`}
                aria-current={n === i ? "step" : undefined}
                className="group flex h-4 w-full items-center rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <span
                  className={cn(
                    "h-1.5 w-full rounded-full transition-colors duration-200",
                    n <= i ? "bg-primary" : "bg-muted group-hover:bg-muted-foreground/30"
                  )}
                />
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <motion.div
        key={`${doc.id}-${i}`}
        ref={region}
        tabIndex={-1}
        aria-live="polite"
        initial={reduce || dir === 0 ? false : { opacity: 0, x: dir * 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="mt-6 min-h-48 outline-none [&>h2:first-child]:mt-0"
      >
        {card.kind === "content" && (
          <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeEmoji3d]} components={components}>
            {card.body}
          </Markdown>
        )}
        {card.kind === "quiz" && doc.quiz && (
          <Quiz
            key={doc.id}
            title="Check your understanding"
            questions={doc.quiz}
            storeKey={storageKey(course, doc.id)}
            onPass={doc.check ? undefined : () => markComplete(storageKey(course, doc.id))}
          />
        )}
        {card.kind === "finish" && (
          <div className="rounded-lg bg-tint-mint px-5 py-6 text-foreground">
            <PartyPopperIcon className="mb-2 size-6 text-success" />
            <p className="text-lg font-semibold">You reached the end of {doc.title}.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {doc.check
                ? "If you haven't yet, solve the challenge in the editor to complete the lesson."
                : doc.quiz?.length
                  ? "Pass the quiz to complete the lesson. You can go back to any step with the bar above."
                  : "Go back to any step with the bar above, or carry on to the next lesson."}
            </p>
            <ReadSentinel lessonKey={storageKey(course, doc.id)} complete={readOnly(doc)} />
          </div>
        )}
      </motion.div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => go(i - 1)} disabled={i === 0}>
          <ArrowLeftIcon data-icon="inline-start" />
          Back
        </Button>
        {next && (
          <Button onClick={() => go(i + 1)}>
            {nextLabel}
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        )}
      </div>

      {card.kind === "finish" && <Pager doc={doc} />}
    </article>
  )
}
