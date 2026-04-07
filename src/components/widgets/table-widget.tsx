"use client";

import { useWidgetAllMetrics } from "@/hooks/use-widget-data";
import { formatNumber, formatCurrency, formatPercent } from "@/lib/utils";
import type { WidgetConfig } from "@/types/widget";

export function TableWidget({ config }: { config: WidgetConfig }) {
  const metrics = useWidgetAllMetrics(config);

  if (metrics.length === 0) {
    return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No data</div>;
  }

  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Metric</th>
            <th className="px-3 py-2 text-right font-medium text-muted-foreground">Value</th>
            <th className="px-3 py-2 text-right font-medium text-muted-foreground">Change</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((m) => (
            <tr key={m.id} className="border-b border-border last:border-0">
              <td className="px-3 py-2 text-card-foreground">{m.label}</td>
              <td className="px-3 py-2 text-right font-medium">
                {m.format === "currency" ? formatCurrency(m.value) : m.format === "percent" ? formatPercent(m.value) : formatNumber(m.value)}
              </td>
              <td className="px-3 py-2 text-right">
                {m.changePercent !== undefined && (
                  <span className={m.trend === "up" ? "text-green-600" : m.trend === "down" ? "text-red-500" : "text-muted-foreground"}>
                    {m.changePercent > 0 ? "+" : ""}{m.changePercent.toFixed(1)}%
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
