"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { cn, formatNumber, formatCurrency, formatPercent } from "@/lib/utils";
import { useWidgetMetric, useWidgetTimeSeries } from "@/hooks/use-widget-data";
import { getDataSource } from "@/lib/widget-registry";
import { aggregateWeekly } from "@/lib/mock-data/generator";
import type { WidgetConfig } from "@/types/widget";

export function StatWidget({ config }: { config: WidgetConfig }) {
  const metric = useWidgetMetric(config);
  const timeSeries = useWidgetTimeSeries(config);
  const ds = getDataSource(config.dataSource);

  // Aggregate for sparkline
  const sparkData = aggregateWeekly(timeSeries).map((p) => ({ v: p.value }));

  if (!metric) {
    return (
      <div className="flex flex-col justify-center h-full px-3 py-2">
        <p className="text-lg text-muted-foreground/50">—</p>
        <p className="text-[10px] text-muted-foreground/50">Sign in to connect</p>
      </div>
    );
  }

  const value = metric.value ?? 0;
  const formattedValue =
    config.format === "currency" ? formatCurrency(value)
    : config.format === "percent" ? formatPercent(value)
    : formatNumber(value);

  const trend = metric.trend || "flat";
  const change = metric.changePercent || 0;
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div className="relative flex flex-col justify-center h-full px-3 py-2 overflow-hidden">
      {sparkData.length > 2 && (
        <div className="absolute inset-0 top-[50%] opacity-[0.08]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <Area type="monotone" dataKey="v" stroke="var(--primary)" fill="var(--primary)" fillOpacity={1} strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="relative z-10 text-3xl font-bold text-foreground leading-tight">{formattedValue}</p>

      {config.comparisonEnabled && (
        <div className="relative z-10 flex items-center gap-1 mt-1">
          <TrendIcon className={cn("h-3 w-3",
            trend === "up" && "text-primary",
            trend === "down" && "text-muted-foreground",
            trend === "flat" && "text-muted-foreground"
          )} />
          <span className={cn("text-xs font-medium",
            trend === "up" && "text-primary",
            trend === "down" && "text-muted-foreground",
            trend === "flat" && "text-muted-foreground"
          )}>
            {change > 0 ? "+" : ""}{change.toFixed(1)}{metric.changeUnit === "pts" ? " pts" : "%"} vs prev month
          </span>
        </div>
      )}
    </div>
  );
}
