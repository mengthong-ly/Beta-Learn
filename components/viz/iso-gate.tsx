"use client"

import { motion } from "motion/react"

import { project, topCenter, type Box } from "@/lib/viz/iso"

import { FloorText, IsoBox, Tag } from "./iso-block"
import { EASE, useDur } from "./timing"

/**
 * A decision: the condition printed on top, two outlets underneath. Once evaluated the
 * block takes the accent and shows its result; execution leaves through that outlet.
 */
export function IsoGate({
  box,
  expr,
  result,
}: {
  box: Box
  expr: string
  result: boolean | null
}) {
  const dur = useDur()
  const t = project({ x: box.w * 0.4, y: box.d, z: 0 })
  const f = project({ x: box.w, y: box.d * 0.6, z: 0 })
  const top = project({ x: box.w, y: 0, z: box.h })
  return (
    <g>
      <IsoBox box={box} tone={result === null ? "neutral" : "accent"} />
      <FloorText at={topCenter(box)} size={12}>
        {expr}
      </FloorText>
      <Tag
        at={{ x: t.x - 8, y: t.y + 12 }}
        anchor="end"
        tone={result === true ? "accent" : "muted"}
      >
        True
      </Tag>
      <Tag
        at={{ x: f.x + 8, y: f.y + 12 }}
        anchor="start"
        tone={result === false ? "accent" : "muted"}
      >
        False
      </Tag>
      {result !== null && (
        <motion.g
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur(0.3), ease: EASE }}
        >
          <Tag
            at={{ x: top.x + 10, y: top.y - 6 }}
            anchor="start"
            tone="accent"
            mono
          >
            → {result ? "True" : "False"}
          </Tag>
        </motion.g>
      )}
    </g>
  )
}
