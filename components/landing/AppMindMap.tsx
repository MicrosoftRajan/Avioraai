"use client";

import type { CSSProperties, ReactNode } from "react";
import { useMemo } from "react";
import ReactFlow, {
  Background,
  BezierEdge,
  Controls,
  Handle,
  MiniMap,
  Position,
  SimpleBezierEdge,
  SmoothStepEdge,
  StepEdge,
  StraightEdge,
  type Edge,
  type Node,
  type NodeProps,
} from "reactflow";

import "reactflow/dist/style.css";

const neoNode =
  "rounded-xl border-[3px] border-black bg-white px-4 py-3 shadow-[6px_6px_0_0_#000] text-black";

/** Stable references — inline objects/functions each render trigger React Flow warning #002 */
const FIT_VIEW_OPTIONS = { padding: 0.2 };
const PRO_OPTIONS = { hideAttribution: true };
const MINIMAP_STYLE: CSSProperties = {
  border: "3px solid #000",
  borderRadius: 12,
  margin: 12,
  boxShadow: "4px 4px 0 0 #000",
};
const CONTROLS_STYLE: CSSProperties = {
  border: "3px solid #000",
  borderRadius: 12,
  margin: 12,
  boxShadow: "4px 4px 0 0 #000",
};

function miniMapNodeColor(n: Node): string {
  if (n.id === "auth") return "#fde047";
  if (n.id === "home") return "#a5f3fc";
  if (n.id === "companions") return "#fbcfe8";
  if (n.id === "new") return "#d9f99d";
  if (n.id === "subtitles") return "#fef08e";
  if (n.id === "history") return "#a5b4fc";
  if (n.id === "subscription") return "#fda4af";
  return "#ffffff";
}

/** Handles required so edges resolve (RF #008); module-level component avoids RF #002 churn. */
function MindMapNode({ data }: NodeProps) {
  return (
    <div className="relative h-full w-full">
      <Handle type="target" position={Position.Left} id="target" />
      <div className="h-full w-full">{data.label as ReactNode}</div>
      <Handle type="source" position={Position.Right} id="source" />
    </div>
  );
}

const STABLE_NODE_TYPES = {
  default: MindMapNode,
};

const STABLE_EDGE_TYPES = {
  default: BezierEdge,
  straight: StraightEdge,
  step: StepEdge,
  smoothstep: SmoothStepEdge,
  simplebezier: SimpleBezierEdge,
};

export default function AppMindMap() {
  const nodes = useMemo<Node[]>(
    () => [
      {
        id: "landing",
        position: { x: 0, y: 0 },
        data: {
          label: (
            <div className={neoNode}>
              <div className="text-xs font-black uppercase tracking-widest text-black/70">
                Entry
              </div>
              <div className="text-lg font-extrabold">Landing</div>
              <div className="text-xs font-semibold text-black/75">
                First visit → story → CTA
              </div>
            </div>
          ),
        },
        type: "default",
      },
      {
        id: "auth",
        position: { x: 260, y: -40 },
        data: {
          label: (
            <div className={`${neoNode} bg-[#fde047]`}>
              <div className="text-xs font-black uppercase tracking-widest text-black/70">
                Auth
              </div>
              <div className="text-lg font-extrabold">Sign in / Sign up</div>
              <div className="text-xs font-semibold text-black/75">
                Clerk flow
              </div>
            </div>
          ),
        },
      },
      {
        id: "home",
        position: { x: 560, y: 0 },
        data: {
          label: (
            <div className={`${neoNode} bg-[#a5f3fc]`}>
              <div className="text-xs font-black uppercase tracking-widest text-black/70">
                Hub
              </div>
              <div className="text-lg font-extrabold">Home / Dashboard</div>
              <div className="text-xs font-semibold text-black/75">
                Start point for actions
              </div>
            </div>
          ),
        },
      },
      {
        id: "companions",
        position: { x: 880, y: -120 },
        data: {
          label: (
            <div className={`${neoNode} bg-[#fbcfe8]`}>
              <div className="text-xs font-black uppercase tracking-widest text-black/70">
                Library
              </div>
              <div className="text-lg font-extrabold">Companions</div>
              <div className="text-xs font-semibold text-black/75">
                Browse + filter
              </div>
            </div>
          ),
        },
      },
      {
        id: "new",
        position: { x: 880, y: 20 },
        data: {
          label: (
            <div className={`${neoNode} bg-[#d9f99d]`}>
              <div className="text-xs font-black uppercase tracking-widest text-black/70">
                Create
              </div>
              <div className="text-lg font-extrabold">New companion</div>
              <div className="text-xs font-semibold text-black/75">
                Subject • topic • voice • style
              </div>
            </div>
          ),
        },
      },
      {
        id: "session",
        position: { x: 1180, y: -40 },
        data: {
          label: (
            <div className={`${neoNode} bg-white`}>
              <div className="text-xs font-black uppercase tracking-widest text-black/70">
                Live
              </div>
              <div className="text-lg font-extrabold">Session</div>
              <div className="text-xs font-semibold text-black/75">
                Mic • stop • subtitles
              </div>
            </div>
          ),
        },
      },
      {
        id: "subtitles",
        position: { x: 1480, y: -140 },
        data: {
          label: (
            <div className={`${neoNode} bg-[#fef08e]`}>
              <div className="text-xs font-black uppercase tracking-widest text-black/70">
                Output
              </div>
              <div className="text-lg font-extrabold">Subtitles</div>
              <div className="text-xs font-semibold text-black/75">
                Live text + PDF export
              </div>
            </div>
          ),
        },
      },
      {
        id: "history",
        position: { x: 1480, y: 40 },
        data: {
          label: (
            <div className={`${neoNode} bg-[#a5b4fc]`}>
              <div className="text-xs font-black uppercase tracking-widest text-black/70">
                Track
              </div>
              <div className="text-lg font-extrabold">My Journey</div>
              <div className="text-xs font-semibold text-black/75">
                Session history + progress
              </div>
            </div>
          ),
        },
      },
      {
        id: "subscription",
        position: { x: 1760, y: -40 },
        data: {
          label: (
            <div className={`${neoNode} bg-[#fda4af]`}>
              <div className="text-xs font-black uppercase tracking-widest text-black/70">
                Monetize
              </div>
              <div className="text-lg font-extrabold">Subscription</div>
              <div className="text-xs font-semibold text-black/75">
                Plans + limits
              </div>
            </div>
          ),
        },
      },
    ],
    []
  );

  const edges = useMemo<Edge[]>(
    () => [
      { id: "e1", source: "landing", target: "auth", animated: true },
      { id: "e2", source: "auth", target: "home", animated: true },
      { id: "e3", source: "home", target: "companions" },
      { id: "e4", source: "home", target: "new" },
      { id: "e5", source: "companions", target: "session", animated: true },
      { id: "e6", source: "new", target: "session", animated: true },
      { id: "e7", source: "session", target: "subtitles" },
      { id: "e8", source: "session", target: "history" },
      { id: "e9", source: "home", target: "subscription" },
      { id: "e10", source: "history", target: "subscription" },
    ],
    []
  );

  return (
    <div className="h-[520px] w-full overflow-hidden rounded-xl border-[3px] border-black bg-white shadow-[6px_6px_0_0_#000]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={STABLE_NODE_TYPES}
        edgeTypes={STABLE_EDGE_TYPES}
        fitView
        fitViewOptions={FIT_VIEW_OPTIONS}
        nodesConnectable={false}
        nodesDraggable
        elementsSelectable
        panOnScroll
        zoomOnScroll
        proOptions={PRO_OPTIONS}
      >
        <Background gap={18} color="#111" />
        <MiniMap
          pannable
          zoomable
          nodeColor={miniMapNodeColor}
          maskColor="rgba(255,255,245,0.65)"
          style={MINIMAP_STYLE}
        />
        <Controls style={CONTROLS_STYLE} />
      </ReactFlow>
    </div>
  );
}

