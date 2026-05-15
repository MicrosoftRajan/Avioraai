"use client";

import { memo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";

import {
  MIND_MAP_CONTROLS_STYLE,
  MIND_MAP_EDGE_TYPES,
  MIND_MAP_FIT_VIEW_OPTIONS,
  MIND_MAP_MINIMAP_STYLE,
  MIND_MAP_NODE_TYPES,
  MIND_MAP_PRO_OPTIONS,
  mindMapNodeColor,
} from "@/lib/mind-map-flow-registry";

type MindMapCanvasProps = {
  nodes: Node[];
  edges: Edge[];
};

const MindMapFlow = memo(function MindMapFlow({ nodes, edges }: MindMapCanvasProps) {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={MIND_MAP_NODE_TYPES}
      edgeTypes={MIND_MAP_EDGE_TYPES}
      fitView
      fitViewOptions={MIND_MAP_FIT_VIEW_OPTIONS}
      nodesConnectable={false}
      nodesDraggable
      elementsSelectable
      panOnScroll
      zoomOnScroll
      proOptions={MIND_MAP_PRO_OPTIONS}
    >
      <Background gap={18} color="#111" />
      <MiniMap
        pannable
        zoomable
        nodeColor={mindMapNodeColor}
        maskColor="rgba(255,255,245,0.65)"
        style={MIND_MAP_MINIMAP_STYLE}
      />
      <Controls style={MIND_MAP_CONTROLS_STYLE} />
    </ReactFlow>
  );
});

export default function MindMapCanvas(props: MindMapCanvasProps) {
  return (
    <ReactFlowProvider>
      <MindMapFlow {...props} />
    </ReactFlowProvider>
  );
}
