"use client"

import { useMemo } from "react"
import type { Node, NodeProps } from "@xyflow/react"
import { AnimatePresence, motion } from "motion/react"

import { formatVal } from "@/lib/viz/events"
import { project } from "@/lib/viz/iso"
import { FRAME, machine, MACHINE, type FnData } from "@/lib/viz/layout"

import { FaceText, IsoBox, Tag } from "../iso-block"
import { EASE, useDur } from "../timing"
import { NodeCanvas } from "./node-canvas"

/**
 * FunctionVisualizer + RecursionVisualizer: a machine. Each call stacks a frame on top of
 * it (arguments go in); each return lifts the top frame away and hands its value down.
 * A recursive function is the same machine with a taller stack.
 */
export function FnNode({ data }: NodeProps<Node<FnData, "fn">>) {
  const dur = useDur()
  const g = useMemo(() => machine(data.maxDepth), [data.maxDepth])
  const face = project({ x: MACHINE.w / 2, y: MACHINE.d, z: MACHINE.h / 2 })

  return (
    <NodeCanvas
      canvas={g}
      label={`function ${data.name}: ${data.frames.length ? `running ${data.frames.map((f) => f.label).join(", then ")}` : "not running"}`}
    >
      <IsoBox box={MACHINE} tone={data.busy ? "accent" : "neutral"} />
      <FaceText at={face}>{`${data.name}()`}</FaceText>
      <AnimatePresence initial={false}>
        {data.frames.map((fr, i) => {
          const p = project(g.frame(i))
          const side = project({
            x: g.frame(i).x + FRAME.w,
            y: g.frame(i).y,
            z: (g.frame(i).z ?? 0) + FRAME.h / 2,
          })
          return (
            <motion.g
              key={fr.id}
              initial={{ opacity: 0, y: -44 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{
                opacity: 0,
                y: -36,
                transition: { duration: dur(0.35), ease: EASE },
              }}
              transition={{ duration: dur(0.5), ease: EASE }}
            >
              <g transform={`translate(${p.x},${p.y})`}>
                <IsoBox box={FRAME} tone={fr.active ? "accent" : "neutral"} />
              </g>
              <Tag
                at={{ x: side.x + 10, y: side.y }}
                anchor="start"
                tone={fr.active ? "accent" : "strong"}
                mono
              >
                {fr.label}
              </Tag>
              {fr.got !== undefined && (
                <Tag
                  at={{ x: side.x + 10, y: side.y + 14 }}
                  anchor="start"
                  mono
                  size={10}
                >
                  {`got ${formatVal(fr.got)}`}
                </Tag>
              )}
            </motion.g>
          )
        })}
      </AnimatePresence>
    </NodeCanvas>
  )
}
