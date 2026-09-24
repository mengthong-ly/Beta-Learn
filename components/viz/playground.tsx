"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeftIcon, ArrowUpRightIcon } from "lucide-react"
import { MotionConfig } from "motion/react"

import { Badge } from "@/components/ui/badge"
import { DEMOS } from "@/lib/viz/demos"
import type { Demo } from "@/lib/viz/events"
import { layoutOf } from "@/lib/viz/layout"
import { usePlayer } from "@/lib/viz/use-player"
import { cn } from "@/lib/utils"

import { CodePanel } from "./code-panel"
import { VizCanvas } from "./viz-canvas"
import { VizTimeline } from "./viz-timeline"

/** The visualizer playground: pick a demo, step through it one semantic operation at a time. */
export function Playground() {
  const params = useSearchParams()
  const demo = DEMOS.find((d) => d.id === params.get("demo")) ?? DEMOS[0]

  return (
    <main className="flex min-h-svh flex-col lg:h-svh">
      <header className="flex items-center gap-4 border-b px-4 py-3">
        <Link
          href="/courses"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" /> Courses
        </Link>
        <div className="min-w-0">
          <h1 className="text-base font-semibold">Visualizer</h1>
          <p className="truncate text-xs text-muted-foreground">
            Watch what the computer does, one operation per step.
          </p>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <nav
          aria-label="Demos"
          className="shrink-0 border-b lg:w-52 lg:overflow-y-auto lg:border-r lg:border-b-0"
        >
          <ol className="flex gap-1 overflow-x-auto p-2 lg:flex-col">
            {DEMOS.map((d, i) => (
              <li key={d.id} className="shrink-0">
                <Link
                  href={`/visualize?demo=${d.id}`}
                  replace
                  scroll={false}
                  aria-current={d.id === demo.id ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm whitespace-nowrap text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
                    d.id === demo.id && "bg-accent font-medium text-foreground"
                  )}
                >
                  <span className="w-4 text-right font-mono text-[11px] tabular-nums opacity-70">
                    {i + 1}
                  </span>
                  {d.title}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
        <DemoView key={demo.id} demo={demo} />
      </div>
    </main>
  )
}

function DemoView({ demo }: { demo: Demo }) {
  const layout = useMemo(() => layoutOf(demo.steps), [demo])
  const player = usePlayer(demo.steps.length)
  const step = layout.frames[player.index].step

  return (
    // Reduced motion for everything in the demo: canvas, code highlight, output.
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section
          className="relative order-1 h-[56svh] min-h-80 shrink-0 lg:order-2 lg:h-auto lg:flex-1"
          aria-label="Visualization"
        >
          {/* absolute: React Flow sizes itself to 100% of its parent, which a flex item's height isn't */}
          <div className="absolute inset-0">
            <VizCanvas
              key={demo.id}
              layout={layout}
              index={player.index}
              forward={player.forward}
              speed={player.speed}
            />
          </div>
        </section>

        <aside className="order-2 flex shrink-0 flex-col gap-4 border-t p-4 lg:order-1 lg:w-[400px] lg:overflow-y-auto lg:border-t-0 lg:border-r">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {demo.title}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {demo.summary}
            </p>
          </div>

          <CodePanel code={demo.code} line={step?.line} />

          <section
            aria-live="polite"
            aria-label="What just happened"
            className="min-h-24 rounded-lg border bg-card p-3"
          >
            {step ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono">
                    {step.event.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    line {step.line}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed">{step.note}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nothing has run yet. Press Step to run the first operation.
              </p>
            )}
          </section>

          <VizTimeline player={player} />

          <a
            href={demo.reference.href}
            target="_blank"
            rel="noreferrer"
            className="mt-auto flex items-center gap-1 text-xs text-link hover:underline"
          >
            Reference: {demo.reference.label}
            <ArrowUpRightIcon className="size-3" />
          </a>
        </aside>
      </div>
    </MotionConfig>
  )
}
