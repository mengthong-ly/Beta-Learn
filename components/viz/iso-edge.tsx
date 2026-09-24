"use client"

import type { EdgeProps } from "@xyflow/react"

import { isoPath } from "@/lib/viz/iso"
import type { VizEdge } from "@/lib/viz/layout"

import { ExecutionParticle } from "./execution-particle"
import { useDur } from "./timing"

/**
 * A connection in the world. `flow` is execution or data moving, `reference` (dashed) is a
 * name pointing at an object, `branch` is a way out of a decision. Active connections take
 * the accent; a particle runs along them on the step that uses them.
 */
export function IsoEdge({ sourceX, sourceY, targetX, targetY, data }: EdgeProps<VizEdge>) {
  const dur = useDur()
  if (!data || data.hidden) return null
  const { d, angle } = isoPath({ x: sourceX, y: sourceY }, { x: targetX, y: targetY }, data.kind)
  const color = data.active ? "var(--iso-accent)" : "var(--iso-edge)"
  const head = `translate(${targetX},${targetY}) rotate(${(angle * 180) / Math.PI})`
  return (
    <g>
      <path
        d={d}
        fill="none"
        style={{
          stroke: color,
          strokeWidth: data.active ? 1.75 : 1.25,
          strokeDasharray: data.look === "reference" ? "5 4" : undefined,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          transition: "stroke 240ms ease",
        }}
      />
      <path d="M-7,-3.5 L0,0 L-7,3.5 Z" transform={head} style={{ fill: color, transition: "fill 240ms ease" }} />
      {data.pulse !== undefined && <ExecutionParticle key={data.pulse} d={d} seconds={dur(0.7)} />}
    </g>
  )
}
