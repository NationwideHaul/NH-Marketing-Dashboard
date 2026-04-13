"use client";

import useSWR from "swr";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { format, differenceInDays } from "date-fns";
import { WidgetPage } from "@/components/widgets/widget-page";
import { formatNumber } from "@/lib/utils";
import { useDateRange } from "@/context/date-range-context";
import { useAccount } from "@/context/account-context";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function YouTubeBanner() {
  const { dateRange } = useDateRange();
  const { apiAccountId } = useAccount();
  const startDate = format(dateRange.from, "yyyy-MM-dd");
  const endDate = format(dateRange.to, "yyyy-MM-dd");
  const days = Math.max(1, differenceInDays(dateRange.to, dateRange.from) + 1);

  const { data } = useSWR(
    `/api/youtube?startDate=${startDate}&endDate=${endDate}&accountId=${apiAccountId}`,
    fetcher,
    { refreshInterval: 300000, revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const d = data?.data;
  const rangeVideos: any[] = d?.inRangeVideos ?? []; // eslint-disable-line @typescript-eslint/no-explicit-any
  const rangeViews = d?.views ?? 0;
  const hasRangeVideos = rangeVideos.length > 0;
  const analyticsAvailable = !!d?.analyticsAvailable;

  // Chart data — prefer analytics daily rows if present, else aggregate by week
  let chart: { date: string; value: number }[] = [];
  const rows = d?.analytics?.rows;
  if (Array.isArray(rows) && rows.length > 0) {
    chart = rows.map((row: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      date: row[0],
      value: row[1] || 0,
    }));
  } else if (rangeVideos.length > 0) {
    // Aggregate by week inside the range
    const byWeek: Record<string, number> = {};
    for (const v of rangeVideos) {
      const dt = new Date(v.publishedAt);
      const ws = new Date(dt);
      ws.setDate(dt.getDate() - dt.getDay());
      const key = format(ws, "MMM d");
      byWeek[key] = (byWeek[key] || 0) + (v.views || 0);
    }
    chart = Object.entries(byWeek).map(([date, value]) => ({ date, value }));
  }

  return (
    <div className="mb-4 rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-5">
        <p className="text-sm text-muted-foreground mb-1">
          {analyticsAvailable
            ? "Your channel got"
            : hasRangeVideos
              ? "Videos published in this period got"
              : "Your channel has (all-time)"}
        </p>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-bold text-foreground">
            {formatNumber(rangeViews || d?.totalViews || 0)} views
          </span>
          <span className="text-sm text-muted-foreground">
            {analyticsAvailable
              ? `in the last ${days} days`
              : hasRangeVideos
                ? `from ${rangeVideos.length} video${rangeVideos.length === 1 ? "" : "s"} published in the last ${days} days`
                : `(no videos published in the last ${days} days)`}
          </span>
        </div>
      </div>
      {chart.length > 0 && (
        <div className="h-[140px] px-4 pb-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} width={35} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)" }} />
              <Area type="monotone" dataKey="value" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.12} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default function YouTubePage() {
  return <WidgetPage headerContent={<YouTubeBanner />} />;
}
