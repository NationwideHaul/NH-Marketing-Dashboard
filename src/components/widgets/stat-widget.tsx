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
      <div className="flex flex-col justify-center h-full px-4">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs">{ds?.icon}</span>
          <span className="text-[10px] text-gray-400 truncate">{config.title}</span>
        </div>
        <p className="text-lg text-gray-300">—</p>
        <p className="text-[10px] text-gray-300">Sign in to connect</p>
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
    <div className="relative flex flex-col justify-between h-full px-4 py-3 overflow-hidden">
      {sparkData.length > 2 && (
        <div className="absolute inset-0 top-[40%] opacity-[0.08]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <Area type="monotone" dataKey="v" stroke="#BE1E23" fill="#BE1E23" fillOpacity={1} strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="relative z-10">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs">{ds?.icon}</span>
          <span className="text-[10px] text-gray-400 truncate">{config.title}</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{formattedValue}</p>
      </div>

      {config.comparisonEnabled && change !== 0 && (
        <div className="relative z-10 flex items-center gap-1">
          <TrendIcon className={cn("h-3 w-3",
            trend === "up" && "text-green-600",
            trend === "down" && "text-red-500",
            trend === "flat" && "text-gray-400"
          )} />
          <span className={cn("text-[11px] font-medium",
            trend === "up" && "text-green-600",
            trend === "down" && "text-red-500",
            trend === "flat" && "text-gray-400"
          )}>
            {change > 0 ? "+" : ""}{change.toFixed(1)}% vs prev
          </span>
        </div>
      )}
    </div>
  );
}
