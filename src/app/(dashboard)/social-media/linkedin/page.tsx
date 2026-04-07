"use client";

import { useMemo } from "react";
import { useDateRange } from "@/context/date-range-context";
import { KPICard } from "@/components/dashboard/kpi-card";
import { ChartGrid } from "@/components/charts/chart-grid";
import { ComparisonTable } from "@/components/charts/comparison-table";
import { SocialPreview } from "@/components/dashboard/social-preview";
import { getKPIMetrics, getPlatformTimeSeries } from "@/lib/mock-data";
import { chartConfigs } from "@/lib/chart-configs";
import { subMonths } from "date-fns";

export default function LinkedInPage() {
  const { dateRange, comparison } = useDateRange();
  const platform = "linkedin";

  const metrics = useMemo(
    () => getKPIMetrics(platform, dateRange, comparison.enabled ? comparison.range : null),
    [dateRange, comparison]
  );
  const chartData = useMemo(
    () => getPlatformTimeSeries(platform, subMonths(dateRange.from, 3), dateRange.to),
    [dateRange]
  );
  const comparisonChartData = useMemo(() => {
    if (!comparison.enabled || !comparison.range) return undefined;
    return getPlatformTimeSeries(platform, subMonths(comparison.range.from, 3), comparison.range.to);
  }, [comparison]);

  // Only show: Followers, Impressions (as Reach), Clicks — no Ad Spend, no leads
  const filteredMetrics = metrics.filter(
    (m) => ["followers", "impressions", "clicks"].includes(m.id)
  );

  // LinkedIn-only chart configs: no Ad Spend chart
  const linkedInCharts = chartConfigs.linkedin.filter(
    (c) => c.metricKey !== "adSpend"
  );

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 mb-6">
        <SocialPreview platform="linkedin" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredMetrics.map((m) => <KPICard key={m.id} {...m} />)}
        </div>
      </div>
      {comparison.enabled && <div className="mb-6"><ComparisonTable metrics={filteredMetrics} /></div>}
      <ChartGrid configs={linkedInCharts} data={chartData} comparisonData={comparisonChartData} />
    </div>
  );
}
