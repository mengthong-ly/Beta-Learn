"use client"

import { Handle, Position } from "@xyflow/react"

import type { P2 } from "@/lib/viz/iso"
import type { Canvas } from "@/lib/viz/layout"

/** Invisible connection points at the canvas anchors, so edges land exactly on the drawing. */
export function Handles({ canvas }: { canvas: Canvas }) {
  return Object.entries(canvas.anchors).map(([id, a]) => (
    <Handle key={id} id={id} type="source" position={Position.Left} isConnectable={false} style={{ left: a.x, top: a.y }} />
  ))
}

/**
 * The frame every isometric node draws in: an SVG sized to the node, with world (0,0,0)
 * moved to the canvas origin. `label` is what a screen reader hears for the whole node.
 */
export function NodeCanvas({ canvas, label, children }: { canvas: Canvas; label: string; children: React.ReactNode }) {
  return (
    <div role="img" aria-label={label} className="relative" style={{ width: canvas.width, height: canvas.height }}>
      <svg width={canvas.width} height={canvas.height} className="absolute inset-0 overflow-visible" aria-hidden>
        <g transform={`translate(${canvas.origin.x},${canvas.origin.y})`}>{children}</g>
      </svg>
      <Handles canvas={canvas} />
    </div>
  )
}

/** A node-local anchor → the origin-relative coordinates children draw in. */
export const local = (canvas: Canvas, p: P2): P2 => ({ x: p.x - canvas.origin.x, y: p.y - canvas.origin.y })
