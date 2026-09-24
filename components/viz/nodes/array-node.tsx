"use client"

import { useMemo } from "react"
import type { Node, NodeProps } from "@xyflow/react"
import { AnimatePresence, arc, motion } from "motion/react"

import { formatVal } from "@/lib/viz/events"
import { project } from "@/lib/viz/iso"
import { BLOCK, lane, LIFT, type ArrayData } from "@/lib/viz/layout"

import { ExecutionCursor } from "../execution-cursor"
import { IsoBlock, Tag } from "../iso-block"
import { IsoPlatform } from "../iso-platform"
import { EASE, EASE_IN_OUT, useDur } from "../timing"
import { local, NodeCanvas } from "./node-canvas"

/**
 * ArrayVisualizer: a list as a plate of numbered slots. Blocks keep their identity, so
 * insert opens a gap and remove closes one by sliding the same blocks; a new block flies
 * in on an arc, a removed one lifts out.
 */
export function ArrayNode({ data }: NodeProps<Node<ArrayData, "array">>) {
  const dur = useDur()
  const g = useMemo(
    () => lane(data.capacity, data.name),
    [data.capacity, data.name]
  )
  const n = data.items.length
  const creating = n > 0 && data.items.every((it) => it.entering)
  const cursor =
    data.cursor === null ? null : local(g, g.anchors[`slot:${data.cursor}`])
  const front = (i: number) =>
    project({ x: g.slot(i).x + BLOCK.w / 2, y: g.plate.d, z: 0 })

  return (
    <NodeCanvas
      canvas={g}
      label={
        data.exists
          ? `list ${data.name}: [${data.items.map((it) => formatVal(it.val)).join(", ")}]`
          : `list ${data.name}, not created yet`
      }
    >
      <AnimatePresence>
        {data.exists && (
          <motion.g
            key="lane"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: dur(0.35), ease: EASE }}
          >
            <IsoPlatform box={g.plate} title={data.name} />

            {data.loop && n > 1 && (
              <LoopPath
                from={front(n - 1)}
                to={front(0)}
                active={data.cursor !== null}
              />
            )}
            {data.done && (
              <Tag
                at={{
                  x: local(g, g.anchors.out).x + 12,
                  y: local(g, g.anchors.out).y,
                }}
                anchor="start"
                tone="accent"
              >
                done
              </Tag>
            )}

            {Array.from({ length: n }, (_, i) => (
              <motion.g
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: dur(0.3) }}
              >
                <Tag
                  at={{ x: front(i).x - 5, y: front(i).y + 13 }}
                  tone={data.cursor === i ? "accent" : "muted"}
                  mono
                  size={10}
                >
                  {i}
                </Tag>
              </motion.g>
            ))}

            <AnimatePresence>
              {data.items.map((it, i) => {
                const p = project(g.slot(i))
                const delay = it.entering
                  ? creating
                    ? dur(0.07 * i)
                    : dur(0.22)
                  : data.shift === "remove"
                    ? dur(0.2)
                    : 0
                return (
                  <motion.g
                    key={it.id}
                    initial={{ x: p.x + 28, y: p.y - 84, opacity: 0 }}
                    animate={{ x: p.x, y: p.y, opacity: 1 }}
                    exit={{
                      y: p.y - 56,
                      opacity: 0,
                      transition: { duration: dur(0.35), ease: EASE },
                    }}
                    transition={{
                      duration: dur(it.entering ? 0.6 : 0.45),
                      // arriving blocks decelerate into place; shifting ones move like objects
                      ease: it.entering ? EASE : EASE_IN_OUT,
                      delay,
                      path: it.entering ? arc({ strength: 0.4 }) : undefined,
                    }}
                  >
                    <IsoBlock value={it.val} state={it.state} />
                  </motion.g>
                )
              })}
            </AnimatePresence>

            <ExecutionCursor
              at={cursor && { x: cursor.x, y: cursor.y - LIFT - 4 }}
            />
          </motion.g>
        )}
      </AnimatePresence>
    </NodeCanvas>
  )
}

/** The loop's way back: a curved return path under the list, from the last slot to the first. */
function LoopPath({
  from,
  to,
  active,
}: {
  from: { x: number; y: number }
  to: { x: number; y: number }
  active: boolean
}) {
  const drop = 30
  const a = { x: from.x, y: from.y + 22 }
  const b = { x: to.x, y: to.y + 22 }
  const color = active ? "var(--iso-accent)" : "var(--iso-edge)"
  return (
    <g aria-hidden>
      <path
        d={`M${a.x},${a.y} C${a.x},${a.y + drop} ${b.x},${b.y + drop} ${b.x},${b.y + 4}`}
        fill="none"
        style={{
          stroke: color,
          strokeWidth: 1.25,
          strokeDasharray: "4 4",
          transition: "stroke 240ms ease",
        }}
      />
      <path
        d={`M${b.x - 4},${b.y + 11} L${b.x},${b.y + 3} L${b.x + 4},${b.y + 11} Z`}
        style={{ fill: color }}
      />
    </g>
  )
}
