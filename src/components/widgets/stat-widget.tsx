"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn, formatNumber, formatCurrency, formatPercent } from "@/lib/utils";
import { useWidgetMetric } from "@/hooks/use-widget-data";
import type { WidgetConfig } from "@/types/widget";

export function StatWidget({ config }: { config: WidgetConfig }) {
  const metric = useWidgetMetric(config);

  if (!metric) {
    return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No data</div>;
  }

  const formattedValue =
    config.format === "currency" ? formatCurrency(metric.value)
    : config.format === "percent" ? formatPercent(metric.value)
    : formatNumber(metric.value);

  const TrendIcon = metric.trend === "up" ? TrendingUp : metric.trend === "down" ? TrendingDown : Minus;

  return (
    <div className="flex flex-col justify-center h-full px-4">
      <p className="text-2xl font-bold text-card-foreground">{formattedValue}</p>
      {config.comparisonEnabled && metric.changePercent !== undefined && (
        <div className="flex items-center gap-1 mt-1">
          <TrendIcon className={cn("h-3.5 w-3.5",
            metric.trend === "up" && "text-green-600",
            metric.trend === "down" && "text-red-500",
            metric.trend === "flat" && "text-muted-foreground"
          )} />
          <span className={cn("text-xs font-medium",
            metric.trend === "up" && "text-green-600",
            metric.trend === "down" && "text-red-500",
            metric.trend === "flat" && "text-muted-foreground"
          )}>
            {metric.changePercent > 0 ? "+" : ""}{metric.changePercent.toFixed(1)}%
          </span>
          <span className="text-xs text-muted-foreground">vs prev</span>
        </div>
      )}
    </div>
  );
}
