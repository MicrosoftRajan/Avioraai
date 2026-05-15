"use client";

import type { CSSProperties, ReactNode } from "react";
import { memo } from "react";
import {
  BezierEdge,
  Handle,
  Position,
  SimpleBezierEdge,
  SmoothStepEdge,
  StepEdge,
  StraightEdge,
  type Node,
  type NodeProps,
} from "reactflow";

/** Module-level singletons — keeps React Flow nodeTypes/edgeTypes referentially stable (RF #002). */
export const MindMapNode = memo(function MindMapNode({ data }: NodeProps) {
  return (
    <div className="relative h-full w-full">
      <Handle type="target" position={Position.Left} id="target" />
      <div className="h-full w-full">{data.label as ReactNode}</div>
      <Handle type="source" position={Position.Right} id="source" />
    </div>
  );
});

export const MIND_MAP_NODE_TYPES = { default: MindMapNode };

export const MIND_MAP_EDGE_TYPES = {
  default: BezierEdge,
  straight: StraightEdge,
  step: StepEdge,
  smoothstep: SmoothStepEdge,
  simplebezier: SimpleBezierEdge,
};

export const MIND_MAP_FIT_VIEW_OPTIONS = { padding: 0.2 };
export const MIND_MAP_PRO_OPTIONS = { hideAttribution: true };

export const MIND_MAP_MINIMAP_STYLE: CSSProperties = {
  border: "3px solid #000",
  borderRadius: 12,
  margin: 12,
  boxShadow: "4px 4px 0 0 #000",
};

export const MIND_MAP_CONTROLS_STYLE: CSSProperties = {
  border: "3px solid #000",
  borderRadius: 12,
  margin: 12,
  boxShadow: "4px 4px 0 0 #000",
};

export function mindMapNodeColor(n: Node): string {
  if (n.id === "auth") return "#fde047";
  if (n.id === "home") return "#a5f3fc";
  if (n.id === "companions") return "#fbcfe8";
  if (n.id === "new") return "#d9f99d";
  if (n.id === "subtitles") return "#fef08e";
  if (n.id === "history") return "#a5b4fc";
  if (n.id === "subscription") return "#fda4af";
  return "#ffffff";
}
