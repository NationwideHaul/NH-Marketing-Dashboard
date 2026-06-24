"use client";

import { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { X, BarChart3, FileText } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useDateRange } from "@/context/date-range-context";
import { useAccount } from "@/context/account-context";
import type { WidgetConfig } from "@/types/widget";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).catch(() => ({ status: "error" }));

// Total info submits across all inventory platforms, with a click-through
// breakdown by platform. Reads /api/inventory-platform-leads (channel=info-submit
// grouped by lead source), the same source the Inventory Platforms tab uses.
export function InfoSubmitTotalWidget({ config }: { config: WidgetConfig }) {
  const [expanded, setExpanded] = useState(false);
  const { dateRange } = useDateRange();
  const { apiAccountId } = useAccount();
  const startDate = format(dateRange.from, "yyyy-MM-dd");
  const endDate = format(dateRange.to, "yyyy-MM-dd");

  const { data } = useSWR(
    `/api/inventory-platform-leads?startDate=${startDate}&endDate=${endDate}&accountId=${apiAccountId}`,
    fetcher,
    { refreshInterval: 300000, revalidateOnFocus: false },
  );

  // Sum byPlatform across all months → per-platform totals + grand total.
  const byPlatform: Record<string, number> = {};
  if (data?.status === "live" && Array.isArray(data.data)) {
    for (const m of data.data) {
      const bp = (m?.byPlatform ?? {}) as Record<string, number>;
      for (const [p, c] of Object.entries(bp)) byPlatform[p] = (byPlatform[p] ?? 0) + (Number(c) || 0);
    }
  }
  const breakdown = Object.entries(byPlatform)
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count);
  const total = breakdown.reduce((s, b) => s + b.count, 0);
  const maxCount = breakdown.length > 0 ? breakdown[0].count : 0;

  const loading = !data;

  return (
    <>
      <div
        className="relative flex flex-col justify-center h-full px-4 py-3 cursor-pointer group transition-colors hover:bg-muted/30 overflow-hidden"
        onClick={() => setExpanded(true)}
      >
        <p className="relative z-10 text-3xl font-bold text-foreground leading-tight">
          {loading ? "—" : formatNumber(total)}
        </p>
        <p className="relative z-10 text-xs text-muted-foreground mt-1">
          {breakdown.length > 0 ? `across ${breakdown.length} platforms` : "info submits"}
        </p>
        <div className="absolute bottom-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>

      {expanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setExpanded(false)}>
          <div className="bg-card border border-border rounded-xl shadow-2xl w-[90vw] max-w-[560px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <div>
                  <h3 className="text-base font-bold text-foreground">{config.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Info submits by platform — selected date range</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-2xl font-bold text-foreground">{formatNumber(total)}</p>
                <button onClick={() => setExpanded(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
            <div className="px-5 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {breakdown.length > 0 ? breakdown.map(({ platform, count }) => (
                <div key={platform} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{platform}</span>
                    <span className="text-muted-foreground">
                      {formatNumber(count)} <span className="text-xs">({total > 0 ? Math.round((count / total) * 100) : 0}%)</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%` }} />
                  </div>
                </div>
              )) : (
                <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                  {loading ? "Loading…" : "No info submits in this range"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
