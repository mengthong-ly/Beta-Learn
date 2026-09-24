"use client"

import { useEffect, useMemo } from "react"
import { MotionConfig } from "motion/react"

import { Badge } from "@/components/ui/badge"
import type { Step } from "@/lib/viz/events"
import { layoutOf } from "@/lib/viz/layout"
import { usePlayer } from "@/lib/viz/use-player"
import { cn } from "@/lib/utils"

import { VizCanvas } from "./viz-canvas"
import { VizTimeline } from "./viz-timeline"

/**
 * The canvas, the explanation of the current step and the timeline, for any list of steps.
 * `split` (the playground): panel beside the canvas on wide screens. `stacked` (the lesson
 * workspace's Visualize tab): canvas above the panel.
 */
export function VizPlayer({
  steps,
  variant,
  aside,
  footer,
  notice,
  onLine,
}: {
  steps: Step[]
  variant: "split" | "stacked"
  aside?: (line?: number) => React.ReactNode
  footer?: React.ReactNode
  notice?: string
  onLine?: (line?: number) => void
}) {
  const layout = useMemo(() => layoutOf(steps), [steps])
  const player = usePlayer(steps.length)
  const step = layout.frames[player.index].step
  const line = step?.line
  useEffect(() => {
    onLine?.(line)
  }, [line, onLine])

  const { vars, lists } = layout.hidden
  const notes = [
    notice,
    vars ? `${vars} more variable${vars > 1 ? "s" : ""} not drawn` : "",
    lists ? `${lists} more list${lists > 1 ? "s" : ""} not drawn` : "",
  ].filter(Boolean)
  const split = variant === "split"

  return (
    // Reduced motion for everything in the player: canvas, code highlight, output.
    <MotionConfig reducedMotion="user">
      <div
        className={cn("flex min-h-0 flex-1 flex-col", split && "lg:flex-row")}
      >
        <section
          className={cn(
            "relative order-1 min-h-64 shrink-0",
            split
              ? "h-[56svh] min-h-80 lg:order-2 lg:h-auto lg:flex-1"
              : "flex-1"
          )}
          aria-label="Visualization"
        >
          {/* absolute: React Flow sizes itself to 100% of its parent, which a flex item's height isn't */}
          <div className="absolute inset-0">
            <VizCanvas
              layout={layout}
              index={player.index}
              forward={player.forward}
              speed={player.speed}
            />
          </div>
        </section>

        <aside
          className={cn(
            "order-2 flex shrink-0 flex-col gap-4 overflow-y-auto border-t p-4",
            split
              ? "lg:order-1 lg:w-[400px] lg:border-t-0 lg:border-r"
              : "max-h-[50%] gap-3 p-3"
          )}
        >
          {aside?.(line)}
          {notes.length > 0 && (
            <p className="text-xs text-muted-foreground">{notes.join(" · ")}</p>
          )}
          <StepNote step={step} />
          <VizTimeline player={player} />
          {footer}
        </aside>
      </div>
    </MotionConfig>
  )
}

function StepNote({ step }: { step?: Step }) {
  const error = step?.event.type === "error" ? step.event.text : undefined
  return (
    <section
      aria-live="polite"
      aria-label="What just happened"
      className="min-h-24 rounded-lg border bg-card p-3"
    >
      {step ? (
        <>
          <div className="flex items-center gap-2">
            <Badge
              variant={error ? "destructive" : "secondary"}
              className="font-mono"
            >
              {step.event.type}
            </Badge>
            <span className="text-xs text-muted-foreground">
              line {step.line}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed">{step.note}</p>
          {error && (
            <pre className="mt-2 overflow-x-auto font-mono text-xs whitespace-pre-wrap text-destructive">
              {error}
            </pre>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nothing has run yet. Press Step to run the first operation.
        </p>
      )}
    </section>
  )
}
