"use client"

import { ViewportPortal } from "@xyflow/react"
import { arc, motion } from "motion/react"

import type { Flight } from "@/lib/viz/layout"

import { EASE, useDur } from "./timing"

/**
 * A value in transit between two things in the world: an argument entering a function,
 * a list item copied into a variable, a result heading to the output. Travels on an arc
 * in flow coordinates, so it pans and zooms with everything else.
 */
export function FlyingTokens({ flights }: { flights: Flight[] }) {
  const dur = useDur()
  return (
    <ViewportPortal>
      {flights.map((f) => (
        <motion.div
          key={f.key}
          className="pointer-events-none absolute top-0 left-0 z-10"
          initial={{ x: f.from.x, y: f.from.y, opacity: 0 }}
          animate={{ x: f.to.x, y: f.to.y, opacity: [0, 1, 1, 0] }}
          transition={{
            duration: dur(0.85),
            ease: EASE,
            path: arc({ strength: 0.35 }),
            opacity: { duration: dur(0.85), times: [0, 0.12, 0.82, 1] },
          }}
          aria-hidden
        >
          <span className="absolute bottom-1 left-0 -translate-x-1/2 rounded-md border border-(--iso-accent) bg-card px-1.5 py-0.5 font-mono text-xs font-semibold whitespace-nowrap text-foreground shadow-sm">
            {f.label}
          </span>
        </motion.div>
      ))}
    </ViewportPortal>
  )
}
