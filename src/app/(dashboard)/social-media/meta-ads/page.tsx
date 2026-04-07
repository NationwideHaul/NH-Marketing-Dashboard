"use client";

import { useMemo } from "react";
import { Megaphone } from "lucide-react";
import { useDateRange } from "@/context/date-range-context";
import { KPICard } from "@/components/dashboard/kpi-card";
import { ChartGrid } from "@/components/charts/chart-grid";
import { ComparisonTable } from "@/components/charts/comparison-table";
import { getKPIMetrics, getPlatformTimeSeries } from "@/lib/mock-data";
import { chartConfigs } from "@/lib/chart-configs";
import { subMonths } from "date-fns";

const campaigns = [
  { name: "VOLVO Sleepers (SAIA)", clicks: 2988, impressions: 82183, cpc: 0.13, ctr: 3.64, status: "Active" },
  { name: "VANGUARD Trailers", clicks: 2866, impressions: 103287, cpc: 0.17, ctr: 2.77, status: "Active" },
  { name: "Truck Paper General Ad", clicks: 1245, impressions: 45620, cpc: 0.21, ctr: 2.73, status: "Active" },
  { name: "Main Website", clicks: 892, impressions: 38450, cpc: 0.19, ctr: 2.32, status: "Active" },
  { name: "Facebook Ads", clicks: 654, impressions: 28900, cpc: 0.24, ctr: 2.26, status: "Active" },
  { name: "Inventory Ads", clicks: 478, impressions: 22100, cpc: 0.28, ctr: 2.16, status: "Paused" },
  { name: "Commercial Trader", clicks: 312, impressions: 15680, cpc: 0.31, ctr: 1.99, status: "Active" },
];

export default function MetaAdsPage() {
  const { dateRange, comparison } = useDateRange();
  const platform = "meta-ads";

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
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Megaphone className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Meta Ads</h3>
          <p className="text-sm text-muted-foreground">Facebook & Instagram paid campaigns</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {metrics.map((m) => <KPICard key={m.id} {...m} />)}
      </div>

      {comparison.enabled && <div className="mb-6"><ComparisonTable metrics={metrics} /></div>}

      {/* Campaign Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-border bg-muted/50 flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-card-foreground">
            Active Campaigns · {campaigns.length} total
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Campaign</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Clicks</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Impressions</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Avg. CPC</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">CTR</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.name} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 font-medium text-card-foreground">{c.name}</td>
                  <td className="px-4 py-2.5 text-right">{c.clicks.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right">{c.impressions.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right">${c.cpc.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right">{c.ctr.toFixed(2)}%</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      c.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ChartGrid configs={chartConfigs["meta-ads"]} data={chartData} comparisonData={comparisonChartData} />
    </div>
  );
}
