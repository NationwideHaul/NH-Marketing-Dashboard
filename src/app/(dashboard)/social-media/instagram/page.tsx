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

export default function InstagramPage() {
  const { dateRange, comparison } = useDateRange();
  const platform = "instagram";

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

  // Filter out "views" — we show Reach instead
  const filteredMetrics = metrics.filter((m) => m.id !== "views");

  // Engagement data from metrics
  const likesVal = metrics.find((m) => m.id === "likes")?.value ?? 294;
  const savesVal = metrics.find((m) => m.id === "saves")?.value ?? 35;
  const commentsVal = metrics.find((m) => m.id === "comments")?.value ?? 9;

  const engagementItems = [
    { label: "Likes", value: likesVal },
    { label: "Saves", value: savesVal },
    { label: "Shares", value: Math.round(savesVal * 0.74) }, // estimate
    { label: "Comments", value: commentsVal },
    { label: "Messages", value: Math.round(commentsVal * 1.3) }, // estimate
  ];

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 mb-6">
        <SocialPreview platform="instagram" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredMetrics.map((m) => <KPICard key={m.id} {...m} />)}
        </div>
      </div>

      {/* Engagement Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <EngagementBars title="Instagram Engagement" items={engagementItems} />
        {comparison.enabled && <ComparisonTable metrics={filteredMetrics} />}
      </div>

      <ChartGrid configs={chartConfigs.instagram} data={chartData} comparisonData={comparisonChartData} />
    </div>
  );
}
