"use client"

import { ChevronRightIcon, CpuIcon, ScanSearchIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { opcodeHelp } from "@/lib/opcodes"
import type { Inspect, RunState } from "@/lib/runner"
import { cn } from "@/lib/utils"

// Immortal objects (small ints, interned strings, None, True) report a huge constant refcount.
const IMMORTAL = 1e8
const ALIAS_COLORS = [
  "bg-tint-sky",
  "bg-tint-peach",
  "bg-tint-lavender",
  "bg-tint-mint",
  "bg-tint-rose",
  "bg-tint-yellow",
]

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      <div>
        <h3 className="text-[11px] font-semibold tracking-[1px] text-muted-foreground uppercase">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      {children}
    </section>
  )
}

function Variables({ vars }: { vars: Inspect["vars"] }) {
  // Names that point at the same object share a colour: that's aliasing, made visible.
  const shared = [...new Set(vars.map((v) => v.id))].filter(
    (id) => vars.filter((v) => v.id === id).length > 1
  )
  if (!vars.length)
    return (
      <p className="text-sm text-muted-foreground">
        Your code didn&apos;t create any variables.
      </p>
    )
  const help = (label: string, text: React.ReactNode) => (
    <Tooltip>
      <TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-2">
        {label}
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{text}</TooltipContent>
    </Tooltip>
  )
  return (
    <div className="flex flex-col gap-2">
      {/* cards, not a table: the pane is often narrow */}
      <ul className="flex flex-col gap-2">
        {vars.map((v) => {
          const alias = shared.indexOf(v.id)
          return (
            <li
              key={v.name}
              className="rounded-lg border bg-background px-3 py-2 text-xs"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-sm font-semibold text-foreground">
                  {v.name}
                </span>
                <Badge
                  variant="secondary"
                  className="h-4 rounded-sm px-1 font-mono text-[10px]"
                >
                  {v.type}
                </Badge>
                <span
                  className={cn(
                    "text-[10px]",
                    v.mutable ? "text-warning" : "text-muted-foreground"
                  )}
                >
                  {v.mutable ? "mutable" : "immutable"}
                </span>
              </div>
              <p className="mt-1 font-mono break-all text-foreground">
                {v.repr}
              </p>
              <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground">
                <span>
                  {help(
                    "id",
                    "The object's identity (its memory address). Same id = the very same object."
                  )}{" "}
                  <span
                    className={cn(
                      "rounded-sm px-1 font-mono",
                      alias >= 0 &&
                        ALIAS_COLORS[alias % ALIAS_COLORS.length] +
                          " text-foreground"
                    )}
                  >
                    {v.id}
                  </span>
                </span>
                <span>
                  {help(
                    "refs",
                    "How many references point at this object. When it drops to 0, CPython frees it immediately."
                  )}{" "}
                  {v.refs > IMMORTAL ? (
                    help(
                      "immortal",
                      "Since Python 3.12, small ints, interned strings, None, True and False are immortal: never freed, so their reference count is frozen."
                    )
                  ) : (
                    <span className="font-mono text-foreground tabular-nums">
                      {v.refs}
                    </span>
                  )}
                </span>
                <span>
                  {help(
                    "size",
                    "sys.getsizeof: bytes of this object itself (not the objects it contains)."
                  )}{" "}
                  <span className="font-mono text-foreground tabular-nums">
                    {v.size} B
                  </span>
                </span>
              </p>
            </li>
          )
        })}
      </ul>
      {shared.length > 0 && (
        <p className="rounded-lg bg-tint-yellow px-3 py-2 text-xs text-foreground">
          <strong>Aliasing:</strong> highlighted ids are shared, so those names
          point at the <em>same</em> object. Changing it through one name
          changes it for all.
        </p>
      )}
    </div>
  )
}

function Bytecode({
  blocks,
  onPickLine,
}: {
  blocks: Inspect["bytecode"]
  onPickLine: (line: number) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      {blocks.map((b, i) => (
        <Collapsible
          key={b.name + i}
          defaultOpen={i === 0}
          className="rounded-lg border bg-background"
        >
          <CollapsibleTrigger className="group flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60">
            <ChevronRightIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
            <span className="font-mono font-semibold text-foreground">
              {b.name}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              {b.ops.length} instructions
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ol className="border-t font-mono text-xs">
              {b.ops.map(([offset, op, arg, line], j) => {
                const newLine = line !== null && line !== b.ops[j - 1]?.[3]
                return (
                  <li
                    key={offset}
                    className={cn(
                      "flex items-baseline gap-2 px-3 py-0.5",
                      newLine && j > 0 && "border-t border-dashed"
                    )}
                  >
                    <span className="w-7 shrink-0 text-right">
                      {newLine && (
                        <button
                          onClick={() => onPickLine(line!)}
                          className="text-link hover:underline focus-visible:underline focus-visible:outline-none"
                          aria-label={`Highlight line ${line} in the editor`}
                        >
                          {line}
                        </button>
                      )}
                    </span>
                    <span className="w-8 shrink-0 text-right text-muted-foreground tabular-nums">
                      {offset}
                    </span>
                    <Tooltip>
                      <TooltipTrigger className="cursor-help text-left font-medium text-foreground">
                        {op}
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-72">
                        {opcodeHelp(op)}
                      </TooltipContent>
                    </Tooltip>
                    {arg && (
                      <span className="truncate text-muted-foreground">
                        {arg}
                      </span>
                    )}
                  </li>
                )
              })}
            </ol>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  )
}

export function InspectPane({
  state,
  onPickLine,
}: {
  state: RunState
  onPickLine: (line: number) => void
}) {
  if (state.status === "running" || !state.inspect) {
    return (
      <Empty className="h-full">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ScanSearchIcon />
          </EmptyMedia>
          <EmptyTitle>
            {state.status === "running" ? "Running…" : "Look inside your code"}
          </EmptyTitle>
          <EmptyDescription>
            Run your code and this tab shows what Python really did: every
            variable with its identity and reference count, and the bytecode
            instructions your code compiled to.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }
  const { vars, bytecode } = state.inspect
  const total = bytecode.reduce((n, b) => n + b.ops.length, 0)
  return (
    <div className="flex flex-col gap-6 p-4">
      <Section
        title="Variables"
        hint="What your code left in memory once it finished."
      >
        <Variables vars={vars} />
      </Section>
      <Section
        title="Bytecode"
        hint="Python compiles your code to these instructions, then its virtual machine runs them one by one. Hover an instruction to see what it does; click a line number to find it in the editor."
      >
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CpuIcon className="size-3.5" />
          {total} instructions in {bytecode.length} code object
          {bytecode.length === 1 ? "" : "s"}
        </p>
        <Bytecode blocks={bytecode} onPickLine={onPickLine} />
      </Section>
    </div>
  )
}
