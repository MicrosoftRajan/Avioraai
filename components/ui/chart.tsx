"use client";

import * as React from "react";
import { Tooltip, ResponsiveContainer } from "recharts";

import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  {
    label?: string;
    color?: string;
  }
>;

type ChartContextValue = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextValue | null>(null);

function useChart() {
  const ctx = React.useContext(ChartContext);
  if (!ctx) throw new Error("Chart components must be used within ChartContainer");
  return ctx;
}

function configToCssVars(config: ChartConfig) {
  const style: React.CSSProperties = {};
  for (const [key, v] of Object.entries(config)) {
    if (v?.color) {
      // @ts-expect-error CSS custom prop
      style[`--color-${key}`] = v.color;
    }
  }
  return style;
}

function ChartContainer({
  config,
  className,
  children,
}: {
  config: ChartConfig;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        className={cn(
          "relative w-full min-h-[200px] min-w-0 shrink-0 [&_.recharts-responsive-container]:min-h-[200px]",
          className,
        )}
        style={configToCssVars(config)}
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={48}
          minHeight={200}
          debounce={50}
        >
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

function ChartTooltip({
  cursor,
  content,
}: {
  cursor?: boolean;
  content: React.ReactElement;
}) {
  return <Tooltip cursor={cursor} content={content as any} />;
}

function ChartTooltipContent({
  hideLabel,
  className,
  ...props
}: {
  active?: boolean;
  payload?: Array<{
    dataKey?: string | number;
    value?: number | string;
  }>;
  label?: string | number;
  hideLabel?: boolean;
  className?: string;
}) {
  const { config } = useChart();
  const payload = props.payload ?? [];
  const label = props.label;

  if (!props.active || !payload?.length) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-popover px-3 py-2 text-popover-foreground shadow-md",
        className
      )}
    >
      {!hideLabel && label != null ? (
        <div className="mb-2 text-xs font-semibold text-muted-foreground">
          {String(label)}
        </div>
      ) : null}

      <div className="grid gap-1">
        {payload.map((item, idx) => {
          const key = item.dataKey as string | undefined;
          const meta = key ? config[key] : undefined;
          const color =
            key && meta?.color ? `var(--color-${key})` : "currentColor";

          return (
            <div key={idx} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block size-2 rounded-[3px]"
                  style={{ background: color }}
                />
                <span className="text-xs font-medium">
                  {meta?.label ?? key ?? "value"}
                </span>
              </div>
              <span className="text-xs tabular-nums text-muted-foreground">
                {item.value?.toLocaleString?.() ?? String(item.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { ChartContainer, ChartTooltip, ChartTooltipContent };

