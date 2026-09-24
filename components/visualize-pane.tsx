"use client"

import { useCallback, useEffect, useState } from "react"
import { BoxesIcon, RotateCwIcon, TriangleAlertIcon } from "lucide-react"

import { VizPlayer } from "@/components/viz/viz-player"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { trace, type TraceResult, type TraceRuntime } from "@/lib/runner"
import type { Step } from "@/lib/viz/events"
import { toSteps } from "@/lib/viz/trace-events"

type Traced = {
  n: number
  doc: string
  code: string
  steps?: Step[]
  truncated?: boolean
  error?: string
}

// Survives the tab unmounting (inactive tabs unmount), so switching tabs doesn't re-trace.
let last: Traced | undefined
let count = 0

function toTraced(
  doc: string,
  code: string,
  r: TraceResult,
  runtime: TraceRuntime
): Traced {
  const t: Traced = { n: ++count, doc, code, error: r.error }
  if (r.trace) {
    t.steps = toSteps(
      r.trace,
      r.error ? { text: r.error, line: r.errorLine } : undefined,
      runtime === "cpp" ? "cpp" : "python"
    )
    t.truncated = r.trace.truncated
  }
  return t
}

/**
 * Records the learner's code and replays it in the isometric visualizer. Traces on first
 * open (per lesson); after an edit it offers "trace again" instead of re-running on its own.
 */
export function VisualizePane({
  code,
  docKey,
  runtime,
  onLine,
}: {
  code: string
  docKey: string
  runtime: TraceRuntime
  onLine: (line?: number) => void
}) {
  const fresh = last?.doc === docKey ? last : undefined
  const [result, setResult] = useState(fresh)
  const [busy, setBusy] = useState(!fresh)

  const start = useCallback(
    (c: string) =>
      trace(c, runtime).then((r) => {
        last = toTraced(docKey, c, r, runtime)
        setResult(last)
        setBusy(false)
      }),
    [docKey, runtime]
  )
  useEffect(() => {
    if (!fresh) start(code)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- first open only; later traces are explicit
  useEffect(() => () => onLine(undefined), [onLine])

  const again = () => {
    setBusy(true)
    start(code)
  }

  if (busy && !result)
    return (
      <Empty className="h-full">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Spinner />
          </EmptyMedia>
          <EmptyTitle>Recording your program</EmptyTitle>
          <EmptyDescription>
            {runtime === "cpp"
              ? "Compiling it with recording built in, then running it once. The first time downloads clang (~23 MB)."
              : "Running it once, line by line."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )

  if (result && !result.steps?.length)
    return (
      <Empty className="h-full">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            {result.error ? <TriangleAlertIcon /> : <BoxesIcon />}
          </EmptyMedia>
          <EmptyTitle>
            {result.error ? "Fix the error first" : "Nothing to show yet"}
          </EmptyTitle>
          <EmptyDescription>
            {result.error
              ? "The program stopped before it did anything to draw:"
              : result.truncated
                ? "It ran 500 steps without creating a variable or printing anything, then the recording stopped. Is there an infinite loop?"
                : "This code doesn't create variables or print anything."}
          </EmptyDescription>
        </EmptyHeader>
        {result.error && (
          <pre className="max-w-full overflow-x-auto rounded-md bg-muted p-2 text-left font-mono text-xs whitespace-pre-wrap text-destructive">
            {result.error}
          </pre>
        )}
        <EmptyContent>
          <Button size="sm" onClick={again} disabled={busy}>
            <RotateCwIcon data-icon="inline-start" />
            Trace again
          </Button>
        </EmptyContent>
      </Empty>
    )

  if (!result?.steps) return null
  const stale = result.code !== code
  return (
    <div className="flex h-full flex-col">
      {stale && (
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2 text-xs text-muted-foreground">
          Code changed since this recording.
          <Button size="xs" variant="outline" onClick={again} disabled={busy}>
            {busy ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <RotateCwIcon data-icon="inline-start" />
            )}
            Trace again
          </Button>
        </div>
      )}
      <VizPlayer
        key={result.n}
        steps={result.steps}
        variant="stacked"
        notice={result.truncated ? "Showing the first 500 steps" : undefined}
        onLine={onLine}
      />
    </div>
  )
}
