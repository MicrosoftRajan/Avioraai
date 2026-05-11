import React, { type ComponentPropsWithoutRef, type CSSProperties } from "react"

import { cn } from "@/lib/utils"

interface RippleProps extends ComponentPropsWithoutRef<"div"> {
  mainCircleSize?: number
  mainCircleOpacity?: number
  numCircles?: number
  /** Light rings for dark / saturated backgrounds (e.g. gradient heroes). */
  variant?: "default" | "on-dark"
}

export const Ripple = React.memo(function Ripple({
  mainCircleSize = 210,
  mainCircleOpacity = 0.24,
  numCircles = 8,
  variant = "default",
  className,
  ...props
}: RippleProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 mask-[linear-gradient(to_bottom,white,transparent)] select-none",
        className
      )}
      {...props}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 70
        const opacity = mainCircleOpacity - i * 0.03
        const animationDelay = `${i * 0.06}s`

        return (
          <div
            key={i}
            className={cn(
              "animate-ripple absolute rounded-full border border-solid shadow-xl",
              variant === "on-dark"
                ? "border-white/35 bg-white/10"
                : "border-[color:var(--foreground)] bg-foreground/25",
            )}
            style={
              {
                "--i": i,
                width: `${size}px`,
                height: `${size}px`,
                opacity,
                animationDelay,
                borderWidth: "1px",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%) scale(1)",
              } as CSSProperties
            }
          />
        )
      })}
    </div>
  )
})

Ripple.displayName = "Ripple"
