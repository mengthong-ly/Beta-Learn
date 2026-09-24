"use client"

import "@xyflow/react/dist/base.css"

import { useMemo } from "react"
import { ConnectionMode, Controls, ReactFlow } from "@xyflow/react"
import { MotionConfig } from "motion/react"

import { sceneAt, type Layout } from "@/lib/viz/layout"

import { FlyingTokens } from "./flying-token"
import { IsoEdge } from "./iso-edge"
import { IsoGrid } from "./iso-grid"
import { ArrayNode } from "./nodes/array-node"
import { BranchNode, GateNode } from "./nodes/condition-nodes"
import { FnNode } from "./nodes/fn-node"
import { OutputNode, StageNode } from "./nodes/pipeline-nodes"
import { ScopeNode } from "./nodes/scope-node"
import { SpeedContext } from "./timing"

const nodeTypes = { scope: ScopeNode, array: ArrayNode, gate: GateNode, branch: BranchNode, fn: FnNode, stage: StageNode, output: OutputNode }
const edgeTypes = { iso: IsoEdge }

/**
 * VisualizationCanvas: the isometric world for one frame of a demo. React Flow handles
 * nodes, connections, pan and zoom; the nodes and edges draw the isometric language.
 * Remount it (key) per demo so fitView frames the new world. Colours come from the page's own
 * tokens (app/globals.css --iso-*), so light/dark follows the app theme without colorMode.
 */
export function VizCanvas({ layout, index, forward, speed }: { layout: Layout; index: number; forward: boolean; speed: number }) {
  const { nodes, edges, flights } = useMemo(() => sceneAt(layout, index, forward), [layout, index, forward])
  return (
    <SpeedContext value={speed}>
      <MotionConfig reducedMotion="user">
        <ReactFlow
          className="viz-flow"
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{ padding: 0.12 }}
          minZoom={0.3}
          maxZoom={2}
          nodesDraggable={false}
          nodesConnectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          elementsSelectable={false}
          zoomOnScroll={false}
          preventScrolling={false}
        >
          <IsoGrid />
          <FlyingTokens flights={flights} />
          <Controls showInteractive={false} position="top-right" />
        </ReactFlow>
      </MotionConfig>
    </SpeedContext>
  )
}
