"use client"

import { AnimatePresence, motion } from "motion/react"

import type { P2 } from "@/lib/viz/iso"

import { EASE, useDur } from "./timing"

/**
 * Where execution is right now: a small marker hovering over the active thing.
 * It glides between positions, so the learner sees execution move, not jump.
 */
export function ExecutionCursor({ at }: { at: P2 | null }) {
  const dur = useDur()
  return (
    <AnimatePresence>
      {at && (
        <motion.g
          initial={{ opacity: 0, x: at.x, y: at.y - 10 }}
          animate={{ opacity: 1, x: at.x, y: at.y }}
          exit={{ opacity: 0 }}
          transition={{ duration: dur(0.4), ease: EASE }}
          aria-hidden
        >
          <line x1={0} y1={-26} x2={0} y2={-8} style={{ stroke: "var(--iso-accent)", strokeWidth: 1.5 }} />
          <path d="M-5,-12 L0,-4 L5,-12 Z" style={{ fill: "var(--iso-accent)" }} />
          <circle cx={0} cy={-28} r={3.5} style={{ fill: "var(--iso-accent)" }} />
        </motion.g>
      )}
    </AnimatePresence>
  )
}
