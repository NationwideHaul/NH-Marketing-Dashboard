"use client";

import { useMemo } from "react";
import { useDateRange } from "@/context/date-range-context";
import { getKPIMetrics, getPlatformTimeSeries } from "@/lib/mock-data";
import { subMonths } from "date-fns";
import type { WidgetConfig } from "@/types/widget";
import type { KPIMetric } from "@/types/kpi";
import type { TimeSeriesPoint } from "@/lib/mock-data";

// Map widget dataSource to mock-data platform key
function mapDataSource(ds: string): string {
  if (ds === "email-marketing") return "go-high-level";
  return ds;
}

export function useWidgetMetric(config: WidgetConfig): KPIMetric | null {
  const { dateRange, comparison } = useDateRange();
  const platform = mapDataSource(config.dataSource);

  return useMemo(() => {
    const metrics = getKPIMetrics(platform, dateRange, comparison.enabled ? comparison.range : null);
    return metrics.find((m) => m.id === config.metric) || null;
  }, [platform, config.metric, dateRange, comparison]);
}

export function useWidgetTimeSeries(config: WidgetConfig): TimeSeriesPoint[] {
  const { dateRange } = useDateRange();
  const platform = mapDataSource(config.dataSource);

  return useMemo(() => {
    const data = getPlatformTimeSeries(platform, subMonths(dateRange.from, 2), dateRange.to);
    return data[config.metric] || [];
  }, [platform, config.metric, dateRange]);
}

export function useWidgetAllMetrics(config: WidgetConfig): KPIMetric[] {
  const { dateRange, comparison } = useDateRange();
  const platform = mapDataSource(config.dataSource);

  return useMemo(() => {
    return getKPIMetrics(platform, dateRange, comparison.enabled ? comparison.range : null);
  }, [platform, dateRange, comparison]);
}
