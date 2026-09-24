"use client"

import { useMemo } from "react"
import type { Node, NodeProps } from "@xyflow/react"
import { AnimatePresence, motion } from "motion/react"

import { project } from "@/lib/viz/iso"
import {
  CARD,
  CONSOLE,
  outputCard,
  stage,
  STAGE,
  type OutputData,
  type StageData,
} from "@/lib/viz/layout"
import { cn } from "@/lib/utils"

import { FaceText, IsoBox } from "../iso-block"
import { EASE, useDur } from "../timing"
import { Handles, local, NodeCanvas } from "./node-canvas"

/**
 * CompilerPipelineVisualizer: one processing stage as a module, with what it produced on
 * a card beside it. Stages are linked by the same flow connections as everything else.
 */
export function StageNode({ data }: NodeProps<Node<StageData, "stage">>) {
  const dur = useDur()
  const g = useMemo(() => stage(data.lines), [data.lines])
  const face = project({ x: STAGE.w / 2, y: STAGE.d, z: STAGE.h / 2 })
  const card = local(g, { x: g.card.x, y: g.card.y })
  const lit = data.state !== "idle"
  return (
    <NodeCanvas
      canvas={g}
      label={`${data.title}: ${data.payload ? data.payload.join("; ") : "waiting"}`}
    >
      <motion.g
        animate={{ opacity: lit ? 1 : 0.55 }}
        transition={{ duration: dur(0.3) }}
      >
        <IsoBox
          box={STAGE}
          tone={data.state === "active" ? "accent" : "neutral"}
        />
        <FaceText at={face} size={10}>
          {data.title.split(" ")[0].toUpperCase()}
        </FaceText>
      </motion.g>
      <g transform={`translate(${card.x},${card.y})`}>
        <rect
          width={CARD.width}
          height={g.card.height}
          rx={8}
          style={{
            fill: "var(--card)",
            stroke:
              data.state === "active" ? "var(--iso-accent)" : "var(--border)",
            strokeWidth: 1,
            transition: "stroke 240ms ease",
          }}
        />
        <text
          x={10}
          y={17}
          style={{
            fontSize: 11,
            fontWeight: 600,
            fill: lit ? "var(--foreground)" : "var(--muted-foreground)",
          }}
        >
          {data.title}
        </text>
        <AnimatePresence>
          {data.payload?.map((line, i) => (
            <motion.text
              key={`${i}:${line}`}
              x={10}
              y={CARD.head + 10 + i * CARD.line}
              className="font-mono"
              style={{
                fontSize: 11,
                fill: "var(--foreground)",
                whiteSpace: "pre",
              }}
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 10 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: dur(0.25),
                delay: dur(0.035 * i),
                ease: EASE,
              }}
            >
              {line}
            </motion.text>
          ))}
        </AnimatePresence>
      </g>
    </NodeCanvas>
  )
}

/** Where printed values land: a plain console card, one line per print(). */
export function OutputNode({ data }: NodeProps<Node<OutputData, "output">>) {
  const dur = useDur()
  const g = useMemo(() => outputCard(data.capacity), [data.capacity])
  return (
    <div
      aria-label={`output: ${data.lines.join(" / ") || "nothing yet"}`}
      role="img"
      className={cn(
        "relative overflow-hidden rounded-lg border bg-card shadow-xs transition-colors",
        data.active && "border-(--iso-accent)"
      )}
      style={{ width: g.width, height: g.height }}
    >
      <div
        className="border-b px-3 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
        style={{ height: CONSOLE.head, lineHeight: `${CONSOLE.head}px` }}
      >
        Output
      </div>
      <ol className="px-3 pt-1.5 font-mono text-[13px] text-foreground">
        <AnimatePresence initial={false}>
          {data.lines.map((line, i) => (
            <motion.li
              key={i}
              className="truncate whitespace-pre"
              style={{ height: CONSOLE.line, lineHeight: `${CONSOLE.line}px` }}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: dur(0.3), delay: dur(0.45), ease: EASE }}
            >
              {line}
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
      <Handles canvas={g} />
    </div>
  )
}
