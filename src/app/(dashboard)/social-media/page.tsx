"use client";

import { useMemo } from "react";
import { useDateRange } from "@/context/date-range-context";
import { KPICard } from "@/components/dashboard/kpi-card";
import { ChartGrid } from "@/components/charts/chart-grid";
import { ComparisonTable } from "@/components/charts/comparison-table";
import { SocialPreview } from "@/components/dashboard/social-preview";
import { EngagementBars } from "@/components/dashboard/engagement-bars";
import { getKPIMetrics, getPlatformTimeSeries } from "@/lib/mock-data";
import { chartConfigs } from "@/lib/chart-configs";
import { subMonths } from "date-fns";

export default function FacebookPage() {
  const { dateRange, comparison } = useDateRange();
  const platform = "facebook";

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

  const likesVal = metrics.find((m) => m.id === "likes")?.value ?? 180;
  const postsVal = metrics.find((m) => m.id === "posts")?.value ?? 23;

  const engagementItems = [
    { label: "Likes", value: likesVal },
    { label: "Shares", value: Math.round(likesVal * 0.35) },
    { label: "Comments", value: Math.round(likesVal * 0.12) },
    { label: "Saves", value: Math.round(likesVal * 0.08) },
    { label: "Messages", value: Math.round(postsVal * 0.8) },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 mb-6">
        <SocialPreview platform="facebook" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {metrics.map((m) => <KPICard key={m.id} {...m} />)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <EngagementBars title="Facebook Engagement" items={engagementItems} />
        {comparison.enabled && <ComparisonTable metrics={metrics} />}
      </div>

      <ChartGrid configs={chartConfigs.facebook} data={chartData} comparisonData={comparisonChartData} />
    </div>
  );
}
