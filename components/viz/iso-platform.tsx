"use client"

import { useEffect } from "react"
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react"

import { boxFaces, project, type Box } from "@/lib/viz/iso"
import { SLOT } from "@/lib/viz/layout"

import { FACE_FILL, hairline, IsoBox, Tag } from "./iso-block"
import { EASE_IN_OUT, useDur } from "./timing"

/** World width of a plate holding n slots. Matches `lane()` in lib/viz/layout. */
const widthFor = (n: number) => (n > 0 ? n * SLOT + 12 : 0)

/**
 * A thin slab that holds things: a list's slots, a scope's variables, a call frame.
 * The full plate is drawn as a dashed footprint — the surface this thing can grow into, and
 * where the world's connections land — with a solid plate that grows across it as slots fill.
 * The name tag sits upright off its left tip so it stays readable.
 */
export function IsoPlatform({
  box,
  slots,
  title,
  active = false,
}: {
  box: Box
  /** how many slots currently hold something */
  slots: number
  title?: string
  active?: boolean
}) {
  const tip = project({ x: 0, y: box.d, z: box.h / 2 })
  return (
    <g>
      <IsoBox box={box} tone="ghost" dashed shadow={false} />
      <SolidPlate box={box} slots={slots} active={active} />
      {title && (
        <Tag at={{ x: tip.x - 10, y: tip.y }} anchor="end" tone="strong" mono>
          {title}
        </Tag>
      )}
    </g>
  )
}

/**
 * The part of the plate that's in use. Its faces are recomputed from an animating width on a
 * motion value, so growing stays off the React render path the way the rest of the world does.
 */
function SolidPlate({
  box,
  slots,
  active,
}: {
  box: Box
  slots: number
  active: boolean
}) {
  const dur = useDur()
  const reduce = useReducedMotion()
  const target = widthFor(slots)
  const seconds = dur(0.4)
  const w = useMotionValue(target)
  useEffect(() => {
    if (reduce) {
      w.set(target)
      return
    }
    const run = animate(w, target, { duration: seconds, ease: EASE_IN_OUT })
    return () => run.stop()
  }, [w, target, seconds, reduce])

  const top = useTransform(w, (v) => boxFaces({ ...box, w: v }).top)
  const left = useTransform(w, (v) => boxFaces({ ...box, w: v }).left)
  const right = useTransform(w, (v) => boxFaces({ ...box, w: v }).right)
  const floor = useTransform(w, (v) => boxFaces({ ...box, w: v }).floor)

  const [topFill, leftFill, rightFill] =
    FACE_FILL[active ? "accent" : "neutral"]
  const edge = hairline()
  return (
    <motion.g
      initial={{ opacity: slots > 0 ? 1 : 0 }}
      animate={{ opacity: slots > 0 ? 1 : 0 }}
      transition={{ duration: dur(0.25) }}
    >
      <motion.polygon
        points={floor}
        transform="translate(4,6)"
        style={{ fill: "var(--iso-shadow)" }}
        filter="url(#iso-soft)"
      />
      <motion.polygon points={left} style={{ ...edge, fill: leftFill }} />
      <motion.polygon points={right} style={{ ...edge, fill: rightFill }} />
      <motion.polygon points={top} style={{ ...edge, fill: topFill }} />
    </motion.g>
  )
}
