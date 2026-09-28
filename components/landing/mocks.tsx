import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloudIcon,
  PlayIcon,
  PlusIcon,
} from "lucide-react"

import { ProgressRing } from "@/components/progress-ring"
import { cn } from "@/lib/utils"

/**
 * Small static pictures of the product for the landing page's feature cards.
 * They are drawings of real screens, not the screens themselves: no state, no
 * workers, nothing to hydrate. Colours come from the theme tokens so each one
 * follows light and dark on its own.
 */

// Syntax colours for the hand-written snippets, one family per role.
const kw = "text-pine-green-800 dark:text-pine-green-400"
const fn = "text-rusty-nail-800 dark:text-rusty-nail-500"
const str = "text-salem-800 dark:text-salem-400"
const dim = "text-muted-foreground"

export function Panel({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl border bg-background text-left text-[13px] shadow-[0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-18px_rgb(22_60_40/0.28)] dark:shadow-[0_1px_2px_rgb(0_0_0/0.5),0_18px_40px_-18px_rgb(0_0_0/0.8)]",
        className
      )}
    >
      {children}
    </div>
  )
}

function Bar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b px-4 py-2.5 font-mono text-xs text-muted-foreground">
      {children}
    </div>
  )
}

function Passed({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-success">
      <span className="flex size-4 items-center justify-center rounded-full bg-success text-background">
        <CheckIcon className="size-2.5" strokeWidth={4} />
      </span>
      {children}
    </div>
  )
}

/** The editor: code, the Run button, what it printed. */
export function RunMock() {
  return (
    <Panel className="max-w-md">
      <Bar>
        <span className="text-foreground">main.py</span>
        <span className="ml-auto flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground">
          <PlayIcon className="size-3 fill-current" /> Run
        </span>
      </Bar>
      <pre className="px-4 py-3.5 font-mono leading-relaxed">
        <span className={dim}>1 </span>scores = [<span className={str}>72</span>
        , <span className={str}>91</span>, <span className={str}>85</span>]
        {"\n"}
        <span className={dim}>2 </span>
        <span className={kw}>for</span> s <span className={kw}>in</span>{" "}
        <span className={fn}>sorted</span>(scores):{"\n"}
        <span className={dim}>3 </span>
        {"    "}
        <span className={fn}>print</span>(s)
      </pre>
      <div className="border-t bg-muted/60 px-4 py-3 font-mono leading-relaxed">
        <div>72</div>
        <div>85</div>
        <div>91</div>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-success" />
          CPython 3.14 · in this tab
        </div>
      </div>
    </Panel>
  )
}

/** A lesson challenge's check block, and the verdict it produced. */
export function CheckMock() {
  return (
    <Panel className="max-w-sm">
      <Bar>
        <span className="text-foreground">Challenge</span>
        <span>· sum the evens</span>
      </Bar>
      <pre className="px-4 py-3.5 font-mono leading-relaxed">
        <span className={dim}># the check runs after your code{"\n"}</span>
        <span className={kw}>assert</span> __stdout__.strip() =={" "}
        <span className={str}>&quot;30&quot;</span>
      </pre>
      <div className="flex flex-col gap-3 border-t px-4 py-3.5">
        <Passed>Check passed — lesson complete</Passed>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-[38%] rounded-full bg-success" />
        </div>
      </div>
    </Panel>
  )
}

/** The Visualize tab: the current line, the variables it changed, the scrubber. */
export function VizMock() {
  const lines = [
    ["total = 0", false],
    ["for n in [3, 4, 5]:", false],
    ["    total += n", true],
    ["print(total)", false],
  ] as const
  return (
    <Panel className="max-w-lg">
      <div className="grid sm:grid-cols-[1.4fr_1fr]">
        <pre className="py-3 font-mono leading-relaxed">
          {lines.map(([code, now], i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3 px-4",
                now && "bg-link/10 shadow-[inset_2px_0_0_var(--link)]"
              )}
            >
              <span className={dim}>{i + 1}</span>
              {code}
            </div>
          ))}
        </pre>
        <div className="border-t p-3 font-mono sm:border-t-0 sm:border-l">
          <div className="mb-2 text-[11px] text-muted-foreground">
            Variables
          </div>
          <div className="flex justify-between rounded-md bg-(--iso-changed) px-2 py-1">
            <span>total</span>
            <span className="tabular-nums">
              <span className="text-muted-foreground line-through">3</span> 7
            </span>
          </div>
          <div className="flex justify-between px-2 py-1">
            <span>n</span>
            <span className="tabular-nums">4</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 border-t px-4 py-2.5 font-mono text-[11px] text-muted-foreground">
        <ChevronLeftIcon className="size-3.5" />
        <div className="h-1 flex-1 rounded-full bg-muted">
          <div className="h-full w-[55%] rounded-full bg-link" />
        </div>
        <ChevronRightIcon className="size-3.5" />
        <span className="tabular-nums">step 6 of 11</span>
      </div>
    </Panel>
  )
}

/** Predict the output before running, then see whether you were right. */
export function PredictMock() {
  return (
    <Panel className="max-w-xs">
      <div className="px-4 pt-4 font-medium">What will this print?</div>
      <pre className="mx-4 mt-3 rounded-lg bg-muted px-3 py-2 font-mono">
        <span className={fn}>print</span>(<span className={fn}>len</span>(
        <span className={str}>&quot;hello&quot;</span>[
        <span className={str}>1</span>:]))
      </pre>
      <div className="mx-4 mt-3 flex items-center rounded-lg border px-3 py-2 font-mono">
        4
        <span className="caret ml-px inline-block h-4 w-px bg-foreground" />
      </div>
      <div className="mt-4 border-t px-4 py-3">
        <Passed>You called it — it printed 4</Passed>
      </div>
    </Panel>
  )
}

/** A guide chapter: prose, a runnable example, a Behind the scenes fold. */
export function GuideMock() {
  return (
    <Panel className="max-w-sm">
      <div className="px-5 pt-5">
        <div className="font-mono text-[11px] text-muted-foreground">
          Guide · chapter 4
        </div>
        <div className="mt-1 text-base font-medium">Lists</div>
        <div className="mt-3 space-y-1.5">
          <div className="h-2 w-full rounded-full bg-muted" />
          <div className="h-2 w-4/5 rounded-full bg-muted" />
        </div>
      </div>
      <div className="mx-5 mt-4 overflow-hidden rounded-lg border">
        <pre className="px-3 py-2 font-mono">
          nums.<span className={fn}>append</span>(<span className={str}>4</span>
          )
        </pre>
        <div className="flex justify-end border-t bg-muted/60 px-3 py-1.5 text-xs font-medium text-link">
          Try it →
        </div>
      </div>
      <div className="mx-5 my-4 flex items-center justify-between rounded-lg bg-tint-sky px-3 py-2 text-xs">
        <span>🔍 Behind the scenes: why append is fast</span>
        <PlusIcon className="size-3.5 shrink-0" />
      </div>
    </Panel>
  )
}

/** Progress per course, with the real lesson totals passed in. */
export function ProgressMock({
  rows,
}: {
  rows: { mark: string; name: string; done: number; total: number }[]
}) {
  return (
    <Panel className="max-w-xs">
      <Bar>
        <span className="text-foreground">Your progress</span>
      </Bar>
      <ul className="divide-y">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center gap-3 px-4 py-2.5">
            <span className="inset flex size-7 items-center justify-center rounded-lg font-mono text-[10px] font-bold">
              {r.mark}
            </span>
            <span className="flex-1">{r.name}</span>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {r.done}/{r.total}
            </span>
            <ProgressRing value={r.done} max={r.total} className="size-4" />
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2 border-t px-4 py-2.5 text-xs text-muted-foreground">
        <CloudIcon className="size-3.5" /> Saved in this browser · sync is
        optional
      </div>
    </Panel>
  )
}

/** How it works, step 1: the course list. */
export function PickMock({
  marks,
}: {
  marks: { mark: string; name: string }[]
}) {
  return (
    <Panel>
      <Bar>
        <span className="text-foreground">Pick a course</span>
      </Bar>
      <ul className="grid grid-cols-2 gap-1.5 p-3">
        {marks.map((m, i) => (
          <li
            key={m.name}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2 py-1.5",
              i === 0 && "bg-muted"
            )}
          >
            <span className="inset flex size-6 items-center justify-center rounded-md font-mono text-[10px] font-bold">
              {m.mark}
            </span>
            <span className="truncate">{m.name}</span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

/** Step 2: a lesson example with its Try it button. */
export function TryMock() {
  return (
    <Panel>
      <div className="px-4 pt-4 font-medium">Loops</div>
      <p className="px-4 pt-1 text-xs text-muted-foreground">
        <code className="font-mono">for</code> runs its body once per item.
      </p>
      <div className="m-4 overflow-hidden rounded-lg border">
        <pre className="px-3 py-2 font-mono">
          <span className={kw}>for</span> c <span className={kw}>in</span>{" "}
          <span className={str}>&quot;hi&quot;</span>:{"\n"}
          {"    "}
          <span className={fn}>print</span>(c)
        </pre>
        <div className="flex items-center justify-between border-t bg-muted/60 px-3 py-1.5 font-mono text-xs">
          <span className="text-muted-foreground">h · i</span>
          <span className="font-sans font-medium text-link">Try it →</span>
        </div>
      </div>
    </Panel>
  )
}

/** Step 3: the challenge, written from an empty file, checked. */
export function SolveMock() {
  return (
    <Panel>
      <Bar>
        <span className="text-foreground">Your turn</span>
        <span>· count the vowels</span>
      </Bar>
      <pre className="px-4 py-3 font-mono leading-relaxed">
        <span className={dim}># write it from scratch{"\n"}</span>
        <span className={fn}>print</span>(<span className={fn}>sum</span>(c{" "}
        <span className={kw}>in</span>{" "}
        <span className={str}>&quot;aeiou&quot;</span>
        {"\n"}
        {"          "}
        <span className={kw}>for</span> c <span className={kw}>in</span> word))
      </pre>
      <div className="border-t px-4 py-3">
        <Passed>Check passed</Passed>
      </div>
    </Panel>
  )
}
