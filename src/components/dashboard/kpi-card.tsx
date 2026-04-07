import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn, formatNumber, formatCurrency, formatPercent } from "@/lib/utils";
import type { KPIMetric } from "@/types/kpi";

export function KPICard({ label, value, format, trend, changePercent }: KPIMetric) {
  const formattedValue =
    format === "currency"
      ? formatCurrency(value)
      : format === "percent"
        ? formatPercent(value)
        : formatNumber(value);

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-card-foreground">
        {formattedValue}
      </p>
      {changePercent !== undefined && (
        <div className="mt-2 flex items-center gap-1">
          <TrendIcon
            className={cn(
              "h-3.5 w-3.5",
              trend === "up" && "text-green-600",
              trend === "down" && "text-red-500",
              trend === "flat" && "text-muted-foreground"
            )}
          />
          <span
            className={cn(
              "text-xs font-medium",
              trend === "up" && "text-green-600",
              trend === "down" && "text-red-500",
              trend === "flat" && "text-muted-foreground"
            )}
          >
            {changePercent > 0 ? "+" : ""}
            {changePercent.toFixed(1)}%
          </span>
          <span className="text-xs text-muted-foreground">vs last period</span>
        </div>
      )}
    </div>
  );
}
