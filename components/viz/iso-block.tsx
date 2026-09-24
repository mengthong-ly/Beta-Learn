"use client"

import { AnimatePresence, motion } from "motion/react"

import { formatVal, type Val } from "@/lib/viz/events"
import {
  boxFaces,
  C,
  onFloor,
  S,
  topCenter,
  type Box,
  type P2,
} from "@/lib/viz/iso"
import { BLOCK, LIFT } from "@/lib/viz/layout"

import { EASE, useDur } from "./timing"

export type Tone = "neutral" | "accent" | "changed" | "ghost"

const FILL: Record<Tone, [top: string, left: string, right: string]> = {
  neutral: ["var(--iso-top)", "var(--iso-left)", "var(--iso-right)"],
  accent: ["var(--iso-accent-soft)", "var(--iso-left)", "var(--iso-right)"],
  changed: ["var(--iso-changed)", "var(--iso-left)", "var(--iso-right)"],
  ghost: ["transparent", "transparent", "transparent"],
}

/**
 * The base 2.5D shape: three faces, hairline outline, soft ground shadow.
 * Drawn with its back-bottom corner at the local origin.
 */
export function IsoBox({
  box,
  tone = "neutral",
  shadow = true,
  dashed = false,
}: {
  box: Box
  tone?: Tone
  shadow?: boolean
  dashed?: boolean
}) {
  const f = boxFaces(box)
  const [top, left, right] = FILL[tone]
  const edge = {
    stroke: "var(--iso-stroke)",
    strokeWidth: 1,
    strokeLinejoin: "round" as const,
    strokeDasharray: dashed ? "3 3" : undefined,
    transition: "fill 240ms ease",
  }
  return (
    <g>
      {shadow && (
        <polygon
          points={f.floor}
          transform="translate(4,6)"
          style={{ fill: "var(--iso-shadow)" }}
          filter="url(#iso-soft)"
        />
      )}
      <polygon points={f.left} style={{ ...edge, fill: left }} />
      <polygon points={f.right} style={{ ...edge, fill: right }} />
      <polygon points={f.top} style={{ ...edge, fill: top }} />
    </g>
  )
}

/** Text painted flat on a top face, like a label printed on the block. */
export function FloorText({
  at,
  children,
  size = 13,
  mono = true,
  weight = 600,
}: {
  at: P2
  children: React.ReactNode
  size?: number
  mono?: boolean
  weight?: number
}) {
  return (
    <g transform={onFloor(at)}>
      <text
        textAnchor="middle"
        dominantBaseline="central"
        className={mono ? "font-mono" : undefined}
        style={{
          fontSize: size,
          fontWeight: weight,
          fill: "var(--foreground)",
        }}
      >
        {children}
      </text>
    </g>
  )
}

/** Text painted on the front-left face (the y = d plane), for module names. */
export function FaceText({
  at,
  children,
  size = 11,
}: {
  at: P2
  children: React.ReactNode
  size?: number
}) {
  return (
    <g transform={`matrix(${C},${S},0,1,${at.x},${at.y})`}>
      <text
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontSize: size,
          fontWeight: 600,
          letterSpacing: 0.4,
          fill: "var(--foreground)",
        }}
      >
        {children}
      </text>
    </g>
  )
}

/** Upright label (names, indexes, tags): always readable, never skewed. */
export function Tag({
  at,
  children,
  anchor = "middle",
  tone = "muted",
  size = 11,
  mono = false,
}: {
  at: P2
  children: React.ReactNode
  anchor?: "start" | "middle" | "end"
  tone?: "muted" | "strong" | "accent"
  size?: number
  mono?: boolean
}) {
  const fill =
    tone === "accent"
      ? "var(--iso-accent)"
      : tone === "strong"
        ? "var(--foreground)"
        : "var(--muted-foreground)"
  return (
    <text
      x={at.x}
      y={at.y}
      textAnchor={anchor}
      dominantBaseline="central"
      className={mono ? "font-mono" : undefined}
      style={{ fontSize: size, fontWeight: tone === "muted" ? 500 : 600, fill }}
    >
      {children}
    </text>
  )
}

export type BlockState = "idle" | "active" | "changed"

/**
 * One value as a block: rises when execution is on it, tints when its value just changed,
 * and swaps the painted value (old floats up, new drops in) when it's updated.
 */
export function IsoBlock({
  value,
  state = "idle",
  box = BLOCK,
}: {
  value?: Val
  state?: BlockState
  box?: Box
}) {
  const dur = useDur()
  const full = value === undefined ? "" : formatVal(value)
  const text = full.length > 8 ? `${full.slice(0, 7)}…` : full
  const size = text.length > 4 ? 10 : 13
  return (
    <motion.g
      animate={{ y: state === "active" ? -LIFT : 0 }}
      transition={{ duration: dur(0.3), ease: EASE }}
    >
      <IsoBox
        box={box}
        tone={
          state === "changed"
            ? "changed"
            : state === "active"
              ? "accent"
              : "neutral"
        }
      />
      <AnimatePresence initial={false}>
        <motion.g
          key={text}
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -22 }}
          transition={{ duration: dur(0.32), ease: EASE }}
        >
          <FloorText at={topCenter(box)} size={size}>
            {text}
          </FloorText>
        </motion.g>
      </AnimatePresence>
    </motion.g>
  )
}
