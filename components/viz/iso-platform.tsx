"use client"

import { project, type Box } from "@/lib/viz/iso"

import { IsoBox, Tag } from "./iso-block"

/**
 * A thin slab that holds things: a list's slots, a scope's variables, a call frame.
 * The name tag sits upright off its left tip so it stays readable.
 */
export function IsoPlatform({ box, title, active = false }: { box: Box; title?: string; active?: boolean }) {
  const tip = project({ x: 0, y: box.d, z: box.h / 2 })
  return (
    <g>
      <IsoBox box={box} tone={active ? "accent" : "neutral"} />
      {title && (
        <Tag at={{ x: tip.x - 10, y: tip.y }} anchor="end" tone="strong" mono>
          {title}
        </Tag>
      )}
    </g>
  )
}
