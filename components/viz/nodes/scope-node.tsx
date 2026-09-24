"use client"

import { useMemo } from "react"
import type { Node, NodeProps } from "@xyflow/react"
import { AnimatePresence, motion } from "motion/react"

import { formatVal } from "@/lib/viz/events"
import { project } from "@/lib/viz/iso"
import { BLOCK, lane, type ScopeData } from "@/lib/viz/layout"

import { ExecutionCursor } from "../execution-cursor"
import { IsoBlock, IsoBox, Tag } from "../iso-block"
import { IsoPlatform } from "../iso-platform"
import { EASE, useDur } from "../timing"
import { local, NodeCanvas } from "./node-canvas"

const SOCKET = { ...BLOCK, h: 3 }

/**
 * VariableVisualizer: the global scope as a plate of named slots. A plain value is a block;
 * a name that refers to a list is an empty socket with a post, and the reference itself is
 * a connection to the list (pointers are connections, not blocks).
 */
export function ScopeNode({ data }: NodeProps<Node<ScopeData, "scope">>) {
  const dur = useDur()
  const g = useMemo(
    () => lane(data.capacity, data.title),
    [data.capacity, data.title]
  )
  const active = data.vars.findIndex((v) => v.state === "active")
  const cursor = active < 0 ? null : local(g, g.anchors[`slot:${active}`])
  const shown = data.vars.filter((v) => v.val !== undefined || v.ref)

  return (
    <NodeCanvas
      canvas={g}
      label={`global variables: ${shown.map((v) => `${v.name} = ${v.ref ? "a list" : formatVal(v.val!)}`).join(", ") || "none yet"}`}
    >
      <IsoPlatform box={g.plate} title={data.title} />
      <AnimatePresence initial={false}>
        {data.vars.map((v, i) => {
          if (v.val === undefined && !v.ref) return null
          const p = project(g.slot(i))
          const name = project({
            x: g.slot(i).x + BLOCK.w / 2,
            y: g.plate.d,
            z: 0,
          })
          const post = local(g, g.anchors[`slot:${i}`])
          return (
            <motion.g
              key={v.name}
              initial={{ opacity: 0, y: -40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: dur(0.45), ease: EASE }}
            >
              <g transform={`translate(${p.x},${p.y})`}>
                {v.ref ? (
                  <IsoBox
                    box={SOCKET}
                    tone={v.state === "idle" ? "neutral" : "accent"}
                  />
                ) : (
                  <IsoBlock value={v.val} state={v.state} />
                )}
              </g>
              {v.ref && (
                <g aria-hidden>
                  <line
                    x1={post.x}
                    y1={post.y + BLOCK.h - 3}
                    x2={post.x}
                    y2={post.y}
                    style={{ stroke: "var(--iso-stroke)", strokeWidth: 1 }}
                  />
                  <circle
                    cx={post.x}
                    cy={post.y}
                    r={3.5}
                    style={{
                      fill: "var(--iso-top)",
                      stroke: "var(--iso-stroke)",
                      strokeWidth: 1,
                    }}
                  />
                </g>
              )}
              <Tag
                at={{ x: name.x - 5, y: name.y + 13 }}
                tone={v.state === "idle" ? "strong" : "accent"}
                mono
                size={11}
              >
                {v.name}
              </Tag>
            </motion.g>
          )
        })}
      </AnimatePresence>
      <ExecutionCursor at={cursor && { x: cursor.x, y: cursor.y - 14 }} />
    </NodeCanvas>
  )
}
