"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn, formatNumber, formatCurrency, formatPercent } from "@/lib/utils";
import type { KPIMetric } from "@/types/kpi";

interface ComparisonTableProps {
  metrics: KPIMetric[];
}

function fmtValue(value: number, format: "number" | "currency" | "percent") {
  if (format === "currency") return formatCurrency(value);
  if (format === "percent") return formatPercent(value);
  return formatNumber(value);
}

export function ComparisonTable({ metrics }: ComparisonTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/50">
        <h3 className="text-sm font-medium text-card-foreground">Period Comparison</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Metric</th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">Current</th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">Previous</th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">Change</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 text-card-foreground">{m.label}</td>
                <td className="px-4 py-2.5 text-right font-medium">{fmtValue(m.value, m.format)}</td>
                <td className="px-4 py-2.5 text-right text-muted-foreground">
                  {m.previousValue !== undefined ? fmtValue(m.previousValue, m.format) : "—"}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {m.changePercent !== undefined && (
                    <span className={cn(
                      "inline-flex items-center gap-1 text-xs font-medium",
                      m.trend === "up" && "text-green-600",
                      m.trend === "down" && "text-red-500",
                      m.trend === "flat" && "text-muted-foreground"
                    )}>
                      {m.trend === "up" ? <TrendingUp className="h-3 w-3" /> :
                       m.trend === "down" ? <TrendingDown className="h-3 w-3" /> :
                       <Minus className="h-3 w-3" />}
                      {m.changePercent > 0 ? "+" : ""}{m.changePercent.toFixed(1)}%
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
