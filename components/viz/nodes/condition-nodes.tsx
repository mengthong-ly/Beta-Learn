"use client"

import type { Node, NodeProps } from "@xyflow/react"
import { motion } from "motion/react"

import { topCenter } from "@/lib/viz/iso"
import { branch, BRANCH, gate, GATE, type BranchData, type GateData } from "@/lib/viz/layout"

import { FloorText, IsoBox } from "../iso-block"
import { IsoGate } from "../iso-gate"
import { useDur } from "../timing"
import { NodeCanvas } from "./node-canvas"

const GATE_CANVAS = gate()
const BRANCH_CANVAS = branch()

/** ConditionVisualizer, part 1: the decision itself. */
export function GateNode({ data }: NodeProps<Node<GateData, "gate">>) {
  return (
    <NodeCanvas canvas={GATE_CANVAS} label={`if ${data.expr}: ${data.result === null ? "not evaluated yet" : `evaluated to ${data.result ? "True" : "False"}`}`}>
      <IsoGate box={GATE} expr={data.expr} result={data.result} />
    </NodeCanvas>
  )
}

/** ConditionVisualizer, part 2: one way out. The branch not taken fades back. */
export function BranchNode({ data }: NodeProps<Node<BranchData, "branch">>) {
  const dur = useDur()
  return (
    <NodeCanvas canvas={BRANCH_CANVAS} label={`${data.label} branch: ${data.code}${data.state === "idle" ? "" : data.state === "taken" ? ", runs" : ", skipped"}`}>
      <motion.g animate={{ opacity: data.state === "skipped" ? 0.38 : 1 }} transition={{ duration: dur(0.3) }}>
        <IsoBox box={BRANCH} tone={data.state === "taken" ? "accent" : "neutral"} />
        <FloorText at={topCenter(BRANCH)} size={11} weight={500}>
          {data.code}
        </FloorText>
      </motion.g>
    </NodeCanvas>
  )
}
