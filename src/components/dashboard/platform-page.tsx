"use client";

import { useMemo } from "react";
import type { ElementType } from "react";
import { subMonths } from "date-fns";
import { useDateRange } from "@/context/date-range-context";
import { KPICard } from "@/components/dashboard/kpi-card";
import { ChartGrid } from "@/components/charts/chart-grid";
import { ComparisonTable } from "@/components/charts/comparison-table";
import { getKPIMetrics, getPlatformTimeSeries } from "@/lib/mock-data";
import type { ChartConfig } from "@/types/chart";

interface PlatformPageProps {
  title: string;
  description: string;
  icon: ElementType;
  platform: string;
  chartConfigs: ChartConfig[];
  socialPreview?: React.ReactNode;
}

export function PlatformPage({
  title,
  description,
  icon: Icon,
  platform,
  chartConfigs,
  socialPreview,
}: PlatformPageProps) {
  const { dateRange, comparison } = useDateRange();

  const metrics = useMemo(
    () => getKPIMetrics(platform, dateRange, comparison.enabled ? comparison.range : null),
    [platform, dateRange, comparison]
  );

  const chartData = useMemo(
    () => getPlatformTimeSeries(platform, subMonths(dateRange.from, 3), dateRange.to),
    [platform, dateRange]
  );

  const comparisonChartData = useMemo(() => {
    if (!comparison.enabled || !comparison.range) return undefined;
    return getPlatformTimeSeries(platform, subMonths(comparison.range.from, 3), comparison.range.to);
  }, [platform, comparison]);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {socialPreview && (
        <div className="mb-6">{socialPreview}</div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">
        {metrics.map((metric) => (
          <KPICard key={metric.id} {...metric} />
        ))}
      </div>

      {/* Comparison Table */}
      {comparison.enabled && (
        <div className="mb-6">
          <ComparisonTable metrics={metrics} />
        </div>
      )}

      {/* Charts */}
      <ChartGrid
        configs={chartConfigs}
        data={chartData}
        comparisonData={comparisonChartData}
      />
    </div>
  );
}
