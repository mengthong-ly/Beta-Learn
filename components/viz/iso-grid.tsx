"use client"

import { useViewport } from "@xyflow/react"

import { C, S } from "@/lib/viz/iso"
import { SLOT } from "@/lib/viz/layout"

const U = SLOT / 2

/** The faint 30° floor grid. Follows pan and zoom the way React Flow's own Background does. */
export function IsoGrid() {
  const { x, y, zoom } = useViewport()
  const w = 2 * C * U
  const h = 2 * S * U
  return (
    <svg className="react-flow__background react-flow__container" aria-hidden>
      <defs>
        <pattern id="iso-grid" width={w} height={h} patternUnits="userSpaceOnUse" patternTransform={`translate(${x},${y}) scale(${zoom})`}>
          <path d={`M0,0 L${w},${h} M0,${h} L${w},0`} style={{ stroke: "var(--iso-grid)", strokeWidth: 1 / zoom }} fill="none" />
        </pattern>
        {/* the blurred ground shadow every IsoBox uses */}
        <filter id="iso-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#iso-grid)" />
    </svg>
  )
}
