"use client"

import { motion } from "motion/react"

import { cn } from "@/lib/utils"

import { EASE_IN_OUT } from "./timing"

/** leading-6 */
const LINE = 24

/**
 * Read-only demo code with the line that caused the current step highlighted. The highlight
 * is one bar that slides from line to line, so execution visibly moves through the code the
 * way the cursor moves through the world. Same tint as the Inspect tab's picked line.
 */
export function CodePanel({ code, line }: { code: string; line?: number }) {
  return (
    <pre
      className="relative overflow-x-auto rounded-lg border bg-background py-2 font-mono text-[13px] leading-6"
      aria-label="Code"
    >
      {line !== undefined && (
        <motion.div
          aria-hidden
          className="inspect-line pointer-events-none absolute inset-x-0 top-2 h-6 border-l-2 border-(--iso-accent)"
          initial={{ opacity: 0, y: (line - 1) * LINE }}
          animate={{ opacity: 1, y: (line - 1) * LINE }}
          transition={{ duration: 0.28, ease: EASE_IN_OUT }}
        />
      )}
      {code.split("\n").map((text, i) => {
        const active = i + 1 === line
        return (
          <div
            key={i}
            aria-current={active ? "step" : undefined}
            className="relative flex pr-3"
          >
            <span
              className={cn(
                "w-9 shrink-0 pr-3 text-right text-muted-foreground tabular-nums transition-colors duration-200 select-none",
                active && "text-(--iso-accent)"
              )}
            >
              {i + 1}
            </span>
            <span className="whitespace-pre text-foreground">
              {text || " "}
            </span>
          </div>
        )
      })}
    </pre>
  )
}
