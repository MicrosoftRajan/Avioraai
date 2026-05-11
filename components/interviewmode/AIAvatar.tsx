"use client";

import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export default function AIAvatar({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "sm"
      ? "h-14 w-14"
      : size === "lg"
        ? "h-24 w-24"
        : "h-[4.5rem] w-[4.5rem]";
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-2xl border-2 border-white/60 bg-gradient-to-br from-violet-500/90 via-fuchsia-500/80 to-cyan-400/90 shadow-[4px_4px_0_0_rgba(0,0,0,0.35)]",
        dim,
        className,
      )}
      aria-hidden
    >
      <Sparkles className="size-6 text-white drop-shadow-sm" strokeWidth={2} />
      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-400 text-[10px] font-black text-black">
        AI
      </span>
    </div>
  );
}
