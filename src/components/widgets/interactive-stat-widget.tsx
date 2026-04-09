"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, X, BarChart3 } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { cn, formatNumber, formatCurrency, formatPercent } from "@/lib/utils";
import { useWidgetMetric, useWidgetTimeSeries } from "@/hooks/use-widget-data";
import { aggregateMonthly, aggregateWeekly } from "@/lib/mock-data/generator";
import type { WidgetConfig } from "@/types/widget";

export function InteractiveStatWidget({ config }: { config: WidgetConfig }) {
  const [expanded, setExpanded] = useState(false);

  // Use 12-month data for the expanded chart
  const expandedConfig = { ...config, trendMonths: 12 };
  const metric = useWidgetMetric(config);
  const timeSeries = useWidgetTimeSeries(expandedConfig);

  // Sparkline data for background
  const sparkData = aggregateWeekly(timeSeries).map((p) => ({ v: p.value }));

  const monthlyData = aggregateMonthly(timeSeries).map((p) => {
    // Parse month label from YYYYMM or YYYY-MM format
    const s = String(p.date);
    const yr = s.substring(0, 4);
    const mo = s.replace("-", "").substring(4, 6);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const label = monthNames[parseInt(mo, 10) - 1] || mo;
    return { month: `${label} ${yr.substring(2)}`, value: p.value };
  });

  const fmt = (v: number) =>
    config.format === "currency" ? formatCurrency(v)
    : config.format === "percent" ? formatPercent(v)
    : formatNumber(v);

  if (!metric) {
    return (
      <div className="flex flex-col justify-center h-full px-4 py-3">
        <p className="text-2xl text-muted-foreground/50">—</p>
        <p className="text-xs text-muted-foreground/50">Sign in to connect</p>
      </div>
    );
  }

  const value = metric.value ?? 0;
  const formattedValue = fmt(value);
  const trend = metric.trend || "flat";
  const change = metric.changePercent || 0;
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <>
      {/* Stat card — clickable */}
      <div
        className="relative flex flex-col justify-center h-full px-4 py-3 cursor-pointer group transition-colors hover:bg-muted/30 overflow-hidden"
        onClick={() => setExpanded(true)}
      >
        {/* Sparkline background */}
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
          <div className="relative z-10 flex items-center gap-1.5 mt-1.5">
            <TrendIcon className={cn("h-3.5 w-3.5",
              trend === "up" && "text-primary",
              trend === "down" && "text-muted-foreground",
              trend === "flat" && "text-muted-foreground"
            )} />
            <span className={cn("text-xs font-medium",
              trend === "up" && "text-primary",
              trend === "down" && "text-muted-foreground",
              trend === "flat" && "text-muted-foreground"
            )}>
              {change > 0 ? "+" : ""}{change.toFixed(1)}% vs prev
            </span>
          </div>
        )}

        {/* Click hint */}
        <div className="absolute bottom-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>

      {/* Expanded modal overlay with 12-month chart */}
      {expanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setExpanded(false)}>
          <div
            className="bg-card border border-border rounded-xl shadow-2xl w-[90vw] max-w-[700px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">{config.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Last 12 months</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">{formattedValue}</p>
                  {config.comparisonEnabled && (
                    <div className="flex items-center gap-1 justify-end">
                      <TrendIcon className={cn("h-3 w-3",
                        trend === "up" && "text-primary",
                        trend === "down" && "text-muted-foreground"
                      )} />
                      <span className={cn("text-xs font-medium",
                        trend === "up" && "text-primary",
                        trend === "down" && "text-muted-foreground"
                      )}>
                        {change > 0 ? "+" : ""}{change.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setExpanded(false)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Chart */}
            <div className="px-5 py-4">
              {monthlyData.length > 1 ? (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => fmt(v)}
                        width={60}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(v: number) => [fmt(v), config.title]}
                        labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="var(--primary)"
                        fill="var(--primary)"
                        fillOpacity={0.15}
                        strokeWidth={2}
                        dot={{ r: 3, fill: "var(--primary)" }}
                        activeDot={{ r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                  No chart data available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
