"use client";

import { useMemo } from "react";
import { Play, ExternalLink } from "lucide-react";
import { useDateRange } from "@/context/date-range-context";
import { KPICard } from "@/components/dashboard/kpi-card";
import { ChartGrid } from "@/components/charts/chart-grid";
import { ComparisonTable } from "@/components/charts/comparison-table";
import { SocialPreview } from "@/components/dashboard/social-preview";
import { getKPIMetrics, getPlatformTimeSeries } from "@/lib/mock-data";
import { chartConfigs } from "@/lib/chart-configs";
import { subMonths } from "date-fns";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

// Mock top videos data
const topVideos = [
  { title: "2025 Volvo VNL 860 Full Walkaround", views: 4820, likes: 142, comments: 28, published: "Oct 2025" },
  { title: "Why Owner-Operators Choose SAIA Trucks", views: 3640, likes: 98, comments: 15, published: "Sep 2025" },
  { title: "Vanguard Trailers - Built to Last", views: 2910, likes: 76, comments: 12, published: "Sep 2025" },
  { title: "Nationwide Haul Pompano Beach Tour", views: 2150, likes: 63, comments: 9, published: "Aug 2025" },
  { title: "Commercial Truck Financing Tips 2025", views: 1890, likes: 54, comments: 18, published: "Aug 2025" },
  { title: "Day Cab vs Sleeper: Which is Right?", views: 1620, likes: 41, comments: 7, published: "Jul 2025" },
  { title: "Tri-Axle Stability - Legal Payloads", views: 1340, likes: 38, comments: 5, published: "Jul 2025" },
  { title: "How to Get Your CDL in Florida", views: 1180, likes: 32, comments: 11, published: "Jun 2025" },
];

const trafficSources = [
  { name: "YouTube Search", value: 42, fill: "#BE1E23" },
  { name: "Suggested Videos", value: 28, fill: "#8C0F14" },
  { name: "Browse Features", value: 12, fill: "#2563EB" },
  { name: "External", value: 10, fill: "#16A34A" },
  { name: "Channel Page", value: 5, fill: "#D97706" },
  { name: "Other", value: 3, fill: "#7C3AED" },
];

export default function YouTubePage() {
  const { dateRange, comparison } = useDateRange();
  const platform = "youtube";

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

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 mb-6">
        <SocialPreview platform="youtube" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {metrics.map((m) => <KPICard key={m.id} {...m} />)}
        </div>
      </div>

      {comparison.enabled && <div className="mb-6"><ComparisonTable metrics={metrics} /></div>}

      {/* Video Ranking + Traffic Source */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 mb-6">
        {/* Top Videos Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/50 flex items-center gap-2">
            <Play className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium text-card-foreground">
              Top Videos · {topVideos.length} ranked by views
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground w-8">#</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Video</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Views</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Likes</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Comments</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Published</th>
                </tr>
              </thead>
              <tbody>
                {topVideos.map((v, i) => (
                  <tr key={v.title} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-card-foreground truncate max-w-[280px]">{v.title}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium">{v.views.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right">{v.likes}</td>
                    <td className="px-4 py-2.5 text-right">{v.comments}</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">{v.published}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Views by Traffic Source */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-card-foreground mb-4">Views by Traffic Source</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={trafficSources}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {trafficSources.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {trafficSources.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.fill }} />
                  <span className="text-card-foreground">{s.name}</span>
                </div>
                <span className="font-medium">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ChartGrid configs={chartConfigs.youtube} data={chartData} comparisonData={comparisonChartData} />
    </div>
  );
}
