import { generateTimeSeries, aggregateMonthly, aggregateWeekly } from "./generator";
import type { TimeSeriesPoint } from "./generator";
import { platformMetricConfigs } from "./platform-configs";
import type { KPIMetric } from "@/types/kpi";

export type { TimeSeriesPoint };

export interface PlatformTimeSeries {
  [metricKey: string]: TimeSeriesPoint[];
}

export function getPlatformTimeSeries(
  platform: string,
  startDate: Date,
  endDate: Date
): PlatformTimeSeries {
  const configs = platformMetricConfigs[platform];
  if (!configs) return {};

  const result: PlatformTimeSeries = {};
  for (const config of configs) {
    result[config.key] = generateTimeSeries(platform, config, startDate, endDate);
  }
  return result;
}

export function getPlatformMonthly(
  platform: string,
  startDate: Date,
  endDate: Date
): PlatformTimeSeries {
  const daily = getPlatformTimeSeries(platform, startDate, endDate);
  const result: PlatformTimeSeries = {};
  for (const [key, points] of Object.entries(daily)) {
    result[key] = aggregateMonthly(points);
  }
  return result;
}

export function getPlatformWeekly(
  platform: string,
  startDate: Date,
  endDate: Date
): PlatformTimeSeries {
  const daily = getPlatformTimeSeries(platform, startDate, endDate);
  const result: PlatformTimeSeries = {};
  for (const [key, points] of Object.entries(daily)) {
    result[key] = aggregateWeekly(points);
  }
  return result;
}

function sumPoints(points: TimeSeriesPoint[]): number {
  return points.reduce((sum, p) => sum + p.value, 0);
}

function avgPoints(points: TimeSeriesPoint[]): number {
  if (points.length === 0) return 0;
  return sumPoints(points) / points.length;
}

export function getKPIMetrics(
  platform: string,
  dateRange: { from: Date; to: Date },
  comparisonRange?: { from: Date; to: Date } | null
): KPIMetric[] {
  const configs = platformMetricConfigs[platform];
  if (!configs) return [];

  const metrics: KPIMetric[] = [];

  for (const config of configs) {
    const points = generateTimeSeries(platform, config, dateRange.from, dateRange.to);
    const isRate = config.format === "percent";
    const currentValue = isRate ? avgPoints(points) : sumPoints(points);

    let trend: "up" | "down" | "flat" = "flat";
    let changePercent = 0;
    let previousValue: number | undefined;

    if (comparisonRange) {
      const compPoints = generateTimeSeries(platform, config, comparisonRange.from, comparisonRange.to);
      previousValue = isRate ? avgPoints(compPoints) : sumPoints(compPoints);
      if (previousValue !== 0) {
        changePercent = ((currentValue - previousValue) / previousValue) * 100;
        trend = changePercent > 1 ? "up" : changePercent < -1 ? "down" : "flat";
      }
    } else {
      // Default: compare with previous period of same length
      const duration = dateRange.to.getTime() - dateRange.from.getTime();
      const prevFrom = new Date(dateRange.from.getTime() - duration);
      const prevTo = new Date(dateRange.from.getTime() - 1);
      const compPoints = generateTimeSeries(platform, config, prevFrom, prevTo);
      previousValue = isRate ? avgPoints(compPoints) : sumPoints(compPoints);
      if (previousValue !== 0) {
        changePercent = ((currentValue - previousValue) / previousValue) * 100;
        trend = changePercent > 1 ? "up" : changePercent < -1 ? "down" : "flat";
      }
    }

    metrics.push({
      id: config.key,
      label: config.label,
      value: isRate ? Math.round(currentValue * 10) / 10 : Math.round(currentValue),
      previousValue: previousValue !== undefined ? (isRate ? Math.round(previousValue * 10) / 10 : Math.round(previousValue)) : undefined,
      format: config.format,
      trend,
      changePercent: Math.round(changePercent * 10) / 10,
    });
  }

  return metrics;
}
