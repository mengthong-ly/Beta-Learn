"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeftIcon, ArrowUpRightIcon } from "lucide-react"

import { DEMOS } from "@/lib/viz/demos"
import type { Demo } from "@/lib/viz/events"
import { cn } from "@/lib/utils"

import { CodePanel } from "./code-panel"
import { VizPlayer } from "./viz-player"

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
  return (
    <VizPlayer
      steps={demo.steps}
      variant="split"
      aside={(line) => (
        <>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {demo.title}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {demo.summary}
            </p>
          </div>
          <CodePanel code={demo.code} line={line} />
        </>
      )}
      footer={
        <a
          href={demo.reference.href}
          target="_blank"
          rel="noreferrer"
          className="mt-auto flex items-center gap-1 text-xs text-link hover:underline"
        >
          Reference: {demo.reference.label}
          <ArrowUpRightIcon className="size-3" />
        </a>
      }
    />
  )
}
