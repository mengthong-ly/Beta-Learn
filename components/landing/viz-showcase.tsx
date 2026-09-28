"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { CodePanel } from "@/components/viz/code-panel"
import { Skeleton } from "@/components/ui/skeleton"
import { DEMOS } from "@/lib/viz/demos"
import { cn } from "@/lib/utils"

// The real player, not a picture of it. React Flow and motion are heavy, so they
// load after the page instead of with it.
const VizPlayer = dynamic(
  () => import("@/components/viz/viz-player").then((m) => m.VizPlayer),
  {
    ssr: false,
    loading: () => <Skeleton className="m-2 min-h-80 flex-1 rounded-2xl" />,
  }
)

// The demos that show the most on one screen, in the order a course meets them.
const PICKS = ["loop", "function", "recursion", "pipeline"]
const demos = PICKS.map((id) => DEMOS.find((d) => d.id === id)!)

export function VizShowcase() {
  const [demo, setDemo] = useState(demos[0])

  return (
    <div className="mt-12">
      <div
        role="group"
        aria-label="Demo"
        className="reveal flex flex-wrap justify-center gap-2"
      >
        {demos.map((d) => (
          <button
            key={d.id}
            type="button"
            aria-pressed={d.id === demo.id}
            onClick={() => setDemo(d)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm transition-[color,background-color,transform] duration-150 ease-glide active:scale-[0.97] motion-reduce:transition-none",
              d.id === demo.id
                ? "border-foreground bg-foreground text-background"
                : "bg-background text-muted-foreground hover:text-foreground"
            )}
          >
            {d.title}
          </button>
        ))}
      </div>

      {/* A window resting in a tray, like the hero's editor resting on its canvas. */}
      <div className="mt-8 rounded-[28px] bg-muted p-2">
        <div className="overflow-hidden rounded-[20px] border bg-background shadow-[0_24px_60px_-28px_rgb(22_60_40/0.35)] dark:shadow-[0_24px_60px_-28px_rgb(0_0_0/0.9)]">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
            <span className="ml-2 font-mono text-xs text-muted-foreground">
              Visualizer · {demo.title}
            </span>
          </div>
          <div className="flex flex-col lg:h-[620px]">
            <VizPlayer
              key={demo.id}
              steps={demo.steps}
              variant="split"
              keys={false}
              aside={(line) => (
                <>
                  <p className="text-sm text-muted-foreground">
                    {demo.summary}
                  </p>
                  <CodePanel code={demo.code} line={line} />
                </>
              )}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <span>
          In Python and C++ lessons, the Visualize tab does this with your own
          code.
        </span>
        <Link
          href={`/visualize?demo=${demo.id}`}
          className="flex items-center gap-1 font-medium text-foreground"
        >
          All {DEMOS.length} demos <ArrowRightIcon className="size-3.5" />
        </Link>
      </div>
    </div>
  )
}
