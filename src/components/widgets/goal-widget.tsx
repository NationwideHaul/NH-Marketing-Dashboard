"use client";

import { useWidgetMetric } from "@/hooks/use-widget-data";
import { formatNumber, formatCurrency, formatPercent } from "@/lib/utils";
import type { WidgetConfig } from "@/types/widget";

export function GoalWidget({ config }: { config: WidgetConfig }) {
  const metric = useWidgetMetric(config);
  const current = metric?.value || 0;
  const goal = config.goalValue || 1;
  const pct = Math.min(100, Math.round((current / goal) * 100));

  const fmt = config.format === "currency" ? formatCurrency
    : config.format === "percent" ? formatPercent
    : formatNumber;

  return (
    <div className="flex flex-col justify-center h-full px-4 gap-2">
      <div className="flex justify-between text-sm">
        <span className="font-semibold text-card-foreground">{fmt(current)}</span>
        <span className="text-muted-foreground">of {fmt(goal)}</span>
      </div>
      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: pct >= 90 ? "#EF4444" : pct >= 70 ? "#D97706" : "#16A34A",
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-right">{pct}% used</p>
    </div>
  );
}
