"use client";

import { useMemo } from "react";
import { DashboardChart } from "./dashboard-chart";
import { aggregateWeekly } from "@/lib/mock-data/generator";
import type { ChartConfig } from "@/types/chart";
import type { PlatformTimeSeries, TimeSeriesPoint } from "@/lib/mock-data";

interface ChartGridProps {
  configs: ChartConfig[];
  data: PlatformTimeSeries;
  comparisonData?: PlatformTimeSeries;
}

export function ChartGrid({ configs, data, comparisonData }: ChartGridProps) {
  // Aggregate to weekly for cleaner charts
  const weeklyData = useMemo(() => {
    const result: PlatformTimeSeries = {};
    for (const [key, points] of Object.entries(data)) {
      result[key] = aggregateWeekly(points);
    }
    return result;
  }, [data]);

  const weeklyComparison = useMemo(() => {
    if (!comparisonData) return undefined;
    const result: PlatformTimeSeries = {};
    for (const [key, points] of Object.entries(comparisonData)) {
      result[key] = aggregateWeekly(points);
    }
    return result;
  }, [comparisonData]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {configs.map((config) => {
        const chartData = weeklyData[config.metricKey] || [];
        const compData = weeklyComparison?.[config.metricKey];
        return (
          <DashboardChart
            key={config.metricKey}
            config={config}
            data={chartData}
            comparisonData={compData}
          />
        );
      })}
    </div>
  );
}
