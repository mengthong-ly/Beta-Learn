import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import {
  CheckIcon,
  CircleAlertIcon,
  LaptopIcon,
  LoaderCircleIcon,
  SquareIcon,
  TerminalIcon,
  TimerOffIcon,
  XIcon,
} from "lucide-react"

import { RunLocallyDialog } from "@/components/run-locally"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import type { Phase, RunState } from "@/lib/runner"
import { cn } from "@/lib/utils"

const ease = [0.23, 1, 0.32, 1] as const
const PHASE_LABEL: Record<Phase, string> = {
  booting: "Loading Python (first run downloads ~10 MB)",
  compiling: "Compiling",
  installing: "Downloading pandas & numpy (first use only)",
  running: "Running",
}
const ANIMATED_LINES = 60

/** writeOnly: the course name, when it can't run here (a hosted copy without the learner's runner). */
export function OutputPane({ state, writeOnly }: { state: RunState; writeOnly?: string }) {
  const reduce = useReducedMotion()
  const { status, phase, lines, runKey } = state
  const running = status === "running"

  // Remember whether this run had to boot Python, so the step list keeps that row.
  const [track, setTrack] = useState<{ runKey: number; steps: Phase[] }>({
    runKey,
    steps: [],
  })
  if (track.runKey !== runKey) setTrack({ runKey, steps: phase ? [phase] : [] })
  else if (phase && !track.steps.includes(phase))
    setTrack({ runKey, steps: [...track.steps, phase] })
  const steps = track.runKey === runKey ? track.steps : []

  // Let the finished step list (with its checkmarks) linger briefly before it folds away.
  const [folded, setFolded] = useState(-1)
  useEffect(() => {
    if (running) return
    const t = setTimeout(() => setFolded(runKey), 700)
    return () => clearTimeout(t)
  }, [running, runKey])

  const scroller = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (running)
      scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [lines.length, running])

  if (status === "idle" && writeOnly) {
    return (
      <Empty className="h-full">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LaptopIcon />
          </EmptyMedia>
          <EmptyTitle>{writeOnly} runs on your computer</EmptyTitle>
          <EmptyDescription>
            The website can&apos;t run {writeOnly}. Write your code here and compare it with the
            solution (the lightbulb).
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <RunLocallyDialog course={writeOnly} />
        </EmptyContent>
      </Empty>
    )
  }

  if (status === "idle") {
    return (
      <Empty className="h-full">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TerminalIcon />
          </EmptyMedia>
          <EmptyTitle>No output yet</EmptyTitle>
          <EmptyDescription>
            Press Run or{" "}
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>↵</Kbd>
            </KbdGroup>{" "}
            to compile and run your code.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div
      className="relative flex h-full flex-col"
      aria-live="polite"
      aria-busy={running}
    >
      {/* shimmer bar while compiling/running */}
      <AnimatePresence>
        {running && (
          <motion.div
            key="shimmer"
            className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-primary/15"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            <motion.div
              className="h-full w-1/3 bg-primary"
              animate={reduce ? undefined : { x: ["-100%", "300%"] }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={scroller} className="flex-1 overflow-auto p-4">
        {/* the step list is the "compile" animation; it folds away once the run settles */}
        <AnimatePresence initial={false}>
          {(running || folded !== runKey) && (
            <motion.ol
              key={runKey}
              className="flex flex-col gap-1.5 overflow-hidden text-sm"
              initial={false}
              animate={{ height: "auto", opacity: 1, marginBottom: 12 }}
              exit={{
                height: 0,
                opacity: 0,
                marginBottom: 0,
                transition: { duration: 0.2, ease, delay: 0.15 },
              }}
            >
              {steps.map((p, i) => {
                const active = running && p === phase
                const failed =
                  !running && status !== "done" && i === steps.length - 1
                return (
                  <motion.li
                    key={p}
                    className="flex items-center gap-2 text-muted-foreground"
                    initial={reduce ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease }}
                  >
                    <span className="flex size-4 items-center justify-center">
                      {active ? (
                        <LoaderCircleIcon className="size-3.5 animate-spin text-primary" />
                      ) : failed ? (
                        <XIcon className="size-3.5 text-destructive" />
                      ) : (
                        <motion.span
                          initial={reduce ? false : { scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.18, ease }}
                        >
                          <CheckIcon className="size-3.5 text-success" />
                        </motion.span>
                      )}
                    </span>
                    <span className={cn(active && "text-foreground")}>
                      {(p === "running" && state.label) || (p === "booting" && state.booting) || PHASE_LABEL[p]}
                    </span>
                  </motion.li>
                )
              })}
            </motion.ol>
          )}
        </AnimatePresence>

        {lines.length > 0 && (
          <pre
            key={`out-${runKey}`}
            className="overflow-x-auto rounded-lg border bg-background p-3 font-mono text-[13px] leading-relaxed whitespace-pre"
          >
            {lines.map((l, i) => (
              <motion.div
                key={i}
                className={cn(l.kind === "err" && "text-destructive")}
                initial={
                  reduce || i >= ANIMATED_LINES ? false : { opacity: 0, y: 4 }
                }
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.18,
                  ease,
                  delay: running ? 0 : Math.min(i, ANIMATED_LINES) * 0.03,
                }}
              >
                {l.text || " "}
              </motion.div>
            ))}
          </pre>
        )}

        {state.error && status === "error" && (
          <motion.pre
            key={`err-${runKey}`}
            className="mt-3 rounded-lg border border-destructive/25 bg-destructive/8 p-3 font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-destructive"
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease }}
          >
            {state.error}
          </motion.pre>
        )}

        {state.check && <CheckResult check={state.check} runKey={runKey} />}
      </div>

      {!running && <StatusBar state={state} />}
    </div>
  )
}

function CheckResult({
  check,
  runKey,
}: {
  check: NonNullable<RunState["check"]>
  runKey: number
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      key={`check-${runKey}`}
      className={cn(
        "mt-3 rounded-lg p-4 text-sm",
        check.pass ? "bg-tint-mint" : "bg-tint-peach"
      )}
      initial={reduce ? false : { opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease, delay: 0.1 }}
    >
      <p className="font-semibold">
        {check.pass ? "✅ Challenge passed!" : "🎯 Not yet"}
      </p>
      <p className="mt-1 text-slate">
        {check.pass
          ? "Nice work. This lesson is marked complete."
          : check.message}
      </p>
    </motion.div>
  )
}

function StatusBar({ state }: { state: RunState }) {
  const reduce = useReducedMotion()
  const map = {
    done: {
      icon: CheckIcon,
      label: "Success",
      className: "bg-tint-mint text-success",
    },
    error: {
      icon: CircleAlertIcon,
      label: "Error",
      className: "bg-destructive/10 text-destructive",
    },
    timeout: {
      icon: TimerOffIcon,
      label: "Timed out",
      className: "bg-tint-peach text-warning",
    },
    stopped: {
      icon: SquareIcon,
      label: "Stopped",
      className: "bg-muted text-muted-foreground",
    },
  } as const
  const s = map[state.status as keyof typeof map]
  if (!s) return null
  return (
    <div className="flex items-center gap-2 border-t px-4 py-2 text-xs text-muted-foreground">
      <motion.span
        key={state.runKey}
        initial={reduce ? false : { scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2, ease }}
      >
        <Badge className={cn("gap-1 border-transparent", s.className)}>
          <s.icon data-icon="inline-start" />
          {s.label}
        </Badge>
      </motion.span>
      {state.ms !== undefined && (
        <span className="tabular-nums">
          {state.ms < 1 ? "<1" : Math.round(state.ms)} ms
        </span>
      )}
      {(state.status === "timeout" || state.status === "stopped") && (
        <span className="truncate">{state.error}</span>
      )}
      {state.lines.length > 0 && (
        <span className="ml-auto tabular-nums">
          {state.lines.length} line{state.lines.length === 1 ? "" : "s"}
        </span>
      )}
    </div>
  )
}
