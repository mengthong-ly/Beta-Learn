"use client"

import { useState } from "react"
import { CheckIcon, EyeIcon, LightbulbIcon, PlayIcon, ScanEyeIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import type { Course } from "@/lib/courses"
import { db } from "@/lib/db"
import type { Output } from "@/lib/lesson-parser"
import { VizPlayer } from "@/components/viz/viz-player"
import { canTrace, run, trace, type RunState } from "@/lib/runner"
import type { Step } from "@/lib/viz/events"
import { toSteps } from "@/lib/viz/trace-events"
import { comparePrediction, divergenceStep } from "@/lib/viz/predict"
import { cn } from "@/lib/utils"

const printed = (lines: Output["lines"]) =>
  lines
    .filter((l) => l.kind === "out")
    .map((l) => l.text)
    .join("\n")

/** The collapsed one-line invitation, shared by both widgets. */
function Strip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 border-t border-background/60 px-4 py-2 text-left font-sans text-xs text-muted-foreground hover:text-foreground"
    >
      <LightbulbIcon className="size-3.5" />
      {label}
    </button>
  )
}

/** The real output of an example the website can't run: predict it first, then reveal it. */
export function PredictOutput({ output }: { output: Output }) {
  const [open, setOpen] = useState(false)
  const [guess, setGuess] = useState("")
  const [shown, setShown] = useState(false)

  if (!open)
    return (
      <Strip
        label="Predict: what happens when this runs?"
        onClick={() => setOpen(true)}
      />
    )

  const cmp = comparePrediction(guess, printed(output.lines), output.error)
  return (
    <div className="grid gap-2 border-t border-background/60 px-4 py-3 font-sans text-sm">
      <label className="grid gap-1.5">
        <span className="text-xs text-muted-foreground">
          Your prediction (optional): what does it print, or does it fail?
        </span>
        <Textarea
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          disabled={shown}
          rows={Math.min(Math.max(output.lines.length, 1), 4)}
          className="bg-background font-mono text-[13px]"
        />
      </label>
      {!shown ? (
        <Button size="sm" variant="outline" className="w-fit" onClick={() => setShown(true)}>
          <EyeIcon data-icon="inline-start" />
          Reveal the real output
        </Button>
      ) : (
        <div className="grid gap-1.5" aria-live="polite">
          {guess.trim() && <Verdict cmp={cmp} />}
          <OutputLines output={output} />
          <p className="text-xs text-muted-foreground">Recorded by running this example with the real toolchain.</p>
        </div>
      )}
    </div>
  )
}

/**
 * Predict, then run the example for real and compare. The guess is required before Run
 * unlocks: committing to a prediction is what makes it teach, where judging afterwards
 * doesn't (Brod, Hasselhorn & Bunge 2018 — see research/write-only-learning-research.md).
 */
export function PredictRun({
  code,
  course,
  lessonId,
}: {
  code: string
  course: Course
  lessonId: string
}) {
  const [open, setOpen] = useState(false)
  const [guess, setGuess] = useState("")
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<RunState>()

  if (!open)
    return (
      <Strip
        label="Predict: what will this print?"
        onClick={() => setOpen(true)}
      />
    )

  const go = async () => {
    setBusy(true)
    // Runs through the shared runner, so it never touches the editor, the learner's
    // draft, or their run history — this is a reading-column experiment, not an attempt.
    const res = await run(code, undefined, course)
    setResult(res)
    setBusy(false)
    const c = comparePrediction(guess, printed(res.lines), res.error)
    db.predictions.add({
      lessonId,
      createdAt: Date.now(),
      code,
      guess,
      ok: c.match,
      badLine: c.firstBadLine,
    } as never)
  }

  const cmp = result
    ? comparePrediction(guess, printed(result.lines), result.error)
    : undefined

  return (
    <div className="grid gap-2 border-t border-background/60 px-4 py-3 font-sans text-sm">
      <label className="grid gap-1.5">
        <span className="text-xs text-muted-foreground">
          What does it print, or does it fail?
        </span>
        <Textarea
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          disabled={!!result || busy}
          rows={3}
          className="bg-background font-mono text-[13px]"
        />
      </label>
      {!result ? (
        <Button
          size="sm"
          variant="outline"
          className="w-fit"
          disabled={!guess.trim() || busy}
          onClick={go}
        >
          {busy ? <Spinner data-icon="inline-start" /> : <PlayIcon data-icon="inline-start" />}
          Run it
        </Button>
      ) : (
        <div className="grid gap-2" aria-live="polite">
          <Verdict cmp={cmp!} />
          {cmp!.match ? (
            <OutputLines output={result} />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <Column label="You predicted" lines={cmp!.guess} bad={cmp!.firstBadLine} />
              <Column label="What ran" lines={cmp!.actual} bad={cmp!.firstBadLine} error={result.error} />
            </div>
          )}
          {!cmp!.match && cmp!.firstBadLine && (
            <Divergence code={code} course={course} badLine={cmp!.firstBadLine} />
          )}
        </div>
      )}
    </div>
  )
}

function Verdict({ cmp }: { cmp: ReturnType<typeof comparePrediction> }) {
  if (cmp.match)
    return (
      <p className="flex items-center gap-1.5 text-xs text-success">
        <CheckIcon className="size-3.5" />
        Matches what it printed.
      </p>
    )
  return (
    <p className="text-xs text-muted-foreground">
      Not quite — line {cmp.firstBadLine} differed. What did you expect to happen there,
      and why?
    </p>
  )
}

function Column({
  label,
  lines,
  bad,
  error,
}: {
  label: string
  lines: string[]
  bad?: number
  error?: string
}) {
  // Pad so a guess that stopped short still shows the line it was missing.
  const rows = bad && lines.length < bad ? [...lines, ""] : lines
  return (
    <div className="grid gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <pre className="overflow-x-auto rounded-md bg-background px-3 py-2 font-mono text-[13px] leading-relaxed">
        {rows.map((l, i) => (
          <div
            key={i}
            className={cn(bad === i + 1 && "-mx-1 rounded-sm bg-tint-peach px-1")}
          >
            {l || " "}
          </div>
        ))}
        {error && <div className="text-destructive">{error}</div>}
        {!rows.length && !error && <div className="text-muted-foreground">(prints nothing)</div>}
      </pre>
    </div>
  )
}

export function OutputLines({ output }: { output: Output }) {
  return (
    <pre className="overflow-x-auto rounded-md bg-background px-3 py-2 font-mono text-[13px] leading-relaxed">
      {output.lines.map((l, i) => (
        <div key={i} className={l.kind === "err" ? "text-destructive" : undefined}>
          {l.text || " "}
        </div>
      ))}
      {output.error && <div className="text-destructive">{output.error}</div>}
      {!output.lines.length && !output.error && (
        <div className="text-muted-foreground">(prints nothing)</div>
      )}
    </pre>
  )
}

/**
 * Replays the example and opens the visualizer on the step that produced the line the
 * learner got wrong, so the mismatch has a cause on screen rather than just a diff.
 */
function Divergence({
  code,
  course,
  badLine,
}: {
  code: string
  course: Course
  badLine: number
}) {
  const [steps, setSteps] = useState<Step[]>()
  const [busy, setBusy] = useState(false)
  const [gaveUp, setGaveUp] = useState(false)

  const runtime = course.runtime
  if (!canTrace(runtime) || gaveUp) return null

  const show = async () => {
    setBusy(true)
    const r = await trace(code, runtime)
    setBusy(false)
    const s = r.trace
      ? toSteps(
          r.trace,
          r.error ? { text: r.error, line: r.errorLine } : undefined,
          runtime === "cpp" ? "cpp" : "python"
        )
      : undefined
    // Nothing worth drawing (no variables, no output): don't open an empty stage.
    if (!s?.length) return setGaveUp(true)
    setSteps(s)
  }

  if (!steps)
    return (
      <Button size="sm" variant="outline" className="w-fit" disabled={busy} onClick={show}>
        {busy ? <Spinner data-icon="inline-start" /> : <ScanEyeIcon data-icon="inline-start" />}
        See where it diverged
      </Button>
    )

  // divergenceStep gives a step index; frame i + 1 is the state after step i.
  const i = divergenceStep(steps, badLine)
  return (
    <div className="flex h-[380px] flex-col overflow-hidden rounded-md border bg-card">
      <VizPlayer steps={steps} variant="stacked" startAt={(i ?? -1) + 1} />
    </div>
  )
}
