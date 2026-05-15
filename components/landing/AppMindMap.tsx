"use client";

import { useMemo } from "react";
import type { Edge, Node } from "reactflow";

import MindMapCanvas from "@/components/landing/mind-map-canvas";

const neoNode =
  "rounded-xl border-[3px] border-black bg-white px-4 py-3 shadow-[6px_6px_0_0_#000] text-black";

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
      <MindMapCanvas nodes={nodes} edges={edges} />
    </div>
  );
}

