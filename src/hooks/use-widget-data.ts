"use client";

import useSWR from "swr";
import { useState, useEffect } from "react";
import { useDateRange } from "@/context/date-range-context";
import { useAccount } from "@/context/account-context";
import { format, differenceInDays, subDays, eachMonthOfInterval, startOfYear } from "date-fns";
import type { WidgetConfig } from "@/types/widget";
import type { KPIMetric } from "@/types/kpi";

// Reads the per-month email logs the user enters on the Email Marketing tab
// (stored in localStorage as `nh-email-logs-<accountId>`). Rate metrics (keys
// ending in "Rate") are AVERAGED across the months in `from..to` that have data;
// count metrics (delivered, replied) are SUMMED. Returns 0 when empty.
function emailLogsMetric(
  accountId: string,
  metric: string,
  from: Date,
  to: Date,
): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(`nh-email-logs-${accountId}`);
    if (!raw) return 0;
    const logs = JSON.parse(raw) as Record<string, Record<string, number>>;
    const months = eachMonthOfInterval({ start: from, end: to });
    const vals: number[] = [];
    for (const m of months) {
      const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
      const entry = logs[key];
      if (entry && typeof entry[metric] === "number") vals.push(entry[metric]);
    }
    if (vals.length === 0) return 0;
    const total = vals.reduce((s, v) => s + v, 0);
    if (metric.endsWith("Rate")) return Math.round((total / vals.length) * 10) / 10; // average rate
    return total; // sum counts
  } catch {
    return 0;
  }
}

// Map widget dataSource to API route
function getApiRoute(dataSource: string): string {
  const routes: Record<string, string> = {
    "google-analytics": "/api/google-analytics",
    "google-ads": "/api/google-ads",
    "meta-ads": "/api/meta-ads",
    "facebook": "/api/meta-ads?type=facebook",
    "instagram": "/api/meta-ads?type=instagram",
    "youtube": "/api/youtube",
    "callrail": "/api/callrail",
    "email-marketing": "/api/go-high-level",
    "ringcentral": "/api/ringcentral",
    "gmb": "/api/gmb",
    "linkedin": "/api/linkedin",
    "overview": "/api/google-analytics", // default
    "nationwide-haul-crm": "/api/nationwide-haul-crm",
    "info-submits": "/api/inventory-platform-leads",
  };
  return routes[dataSource] || "/api/google-analytics";
}

const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok && r.status === 401) return { status: "error", error: "Not authenticated" };
  return r.json();
}).catch(() => ({ status: "error", error: "Network error" }));

const SWR_CONFIG = {
  refreshInterval: 300000,
  revalidateOnFocus: false,
  dedupingInterval: 60000,
  errorRetryCount: 1,
  shouldRetryOnError: false,
};

// Main hook — fetches from real API and extracts metric, with previous period comparison
export function useWidgetMetric(config: WidgetConfig): KPIMetric | null {
  const { dateRange } = useDateRange();
  const { apiAccountId, currentAccount } = useAccount();
  const startDate = format(dateRange.from, "yyyy-MM-dd");
  const endDate = format(dateRange.to, "yyyy-MM-dd");
  const route = getApiRoute(config.dataSource);
  const sep = route.includes("?") ? "&" : "?";
  // When a widget targets a single dimension value (e.g. Paid Search channel),
  // request the dimension breakdown so extractMetric can pick that row.
  const dimensionParam = config.dimension ? `&dimension=${encodeURIComponent(config.dimension)}` : "";
  const url = `${route}${sep}startDate=${startDate}&endDate=${endDate}&accountId=${apiAccountId}${dimensionParam}`;

  // Calculate previous period (same duration, immediately before)
  const days = differenceInDays(dateRange.to, dateRange.from) + 1;
  const prevEnd = subDays(dateRange.from, 1);
  const prevStart = subDays(prevEnd, days - 1);
  const prevUrl = `${route}${sep}startDate=${format(prevStart, "yyyy-MM-dd")}&endDate=${format(prevEnd, "yyyy-MM-dd")}&accountId=${apiAccountId}${dimensionParam}`;

  // SWR keys are null for email-logs so no network request fires. Hooks still
  // run unconditionally to keep React's hook ordering stable.
  const isEmailLogs = config.dataSource === "email-logs";
  const { data } = useSWR(isEmailLogs ? null : url, fetcher, SWR_CONFIG);
  const { data: prevData } = useSWR(
    !isEmailLogs && config.comparisonEnabled ? prevUrl : null,
    fetcher,
    SWR_CONFIG
  );

  // Email-logs reads from localStorage and re-renders on storage events so
  // edits made on the Email Marketing tab flow into Overview widgets.
  const [logsTick, setLogsTick] = useState(0);
  useEffect(() => {
    if (!isEmailLogs) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === `nh-email-logs-${currentAccount.id}`) setLogsTick((t) => t + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [isEmailLogs, currentAccount.id]);

  if (isEmailLogs) {
    void logsTick; // force recomputation when storage changes
    const value = emailLogsMetric(currentAccount.id, config.metric, dateRange.from, dateRange.to);
    let trend: "up" | "down" | "flat" = "flat";
    let changePercent = 0;
    if (config.comparisonEnabled) {
      const prev = emailLogsMetric(currentAccount.id, config.metric, prevStart, prevEnd);
      if (prev !== 0) {
        changePercent = ((value - prev) / prev) * 100;
        trend = changePercent > 0 ? "up" : changePercent < 0 ? "down" : "flat";
      }
    }
    return { id: config.metric, label: config.title, value, format: config.format, trend, changePercent };
  }

  if (!data || data.status === "error") return null;

  // Extract the metric from the API response
  const metricValue = extractMetric(data, config.metric, config.dataSource, config.tracker, config.dimensionValue);
  if (metricValue === null) return null;

  // Compute trend vs previous period
  let trend: "up" | "down" | "flat" = "flat";
  let changePercent = 0;

  if (config.comparisonEnabled && prevData && prevData.status !== "error") {
    const prevValue = extractMetric(prevData, config.metric, config.dataSource, config.tracker, config.dimensionValue);
    if (prevValue !== null && prevValue !== 0) {
      changePercent = ((metricValue - prevValue) / prevValue) * 100;
      trend = changePercent > 0 ? "up" : changePercent < 0 ? "down" : "flat";
    }
  }

  return {
    id: config.metric,
    label: config.title,
    value: metricValue,
    format: config.format,
    trend,
    changePercent,
  };
}

// For charts — returns time series from API
// If config.trendMonths is set, extends the date range back N months for monthly comparisons
// If config.dimension is set, fetches a separate GA4 query with that dimension
export function useWidgetTimeSeries(config: WidgetConfig): { date: string; value: number }[] {
  const { dateRange } = useDateRange();
  const { apiAccountId } = useAccount();
  // Use the user's selected date range for charts, with two opt-outs:
  // - config.yearToDate: always show Jan 1 of the current year → today, so the
  //   chart stays a fixed month-by-month view of the year as it progresses,
  //   independent of the global date selector.
  // - config.trendMonths: show a rolling window of N months back from today.
  const today = new Date();
  const effectiveStart = config.yearToDate
    ? startOfYear(today)
    : config.trendMonths
    ? subDays(dateRange.to, config.trendMonths * 30)
    : dateRange.from;
  const effectiveEnd = config.yearToDate ? today : dateRange.to;
  const startDate = format(effectiveStart, "yyyy-MM-dd");
  const endDate = format(effectiveEnd, "yyyy-MM-dd");
  const route = getApiRoute(config.dataSource);
  const sep = route.includes("?") ? "&" : "?";
  const dimensionParam = config.dimension ? `&dimension=${config.dimension}` : "";
  const url = `${route}${sep}startDate=${startDate}&endDate=${endDate}&accountId=${apiAccountId}${dimensionParam}`;

  const { data } = useSWR(url, fetcher, {
    refreshInterval: 300000,
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  if (!data || !data.data) return [];

  // If dimension query, extract category-based data instead of time series
  if (config.dimension && data.data?.rows) {
    return extractDimensionData(data, config.metric);
  }

  // Try to extract time series from the response
  return extractTimeSeries(data, config.metric) || [];
}

// For table widgets — returns all metrics
export function useWidgetAllMetrics(config: WidgetConfig): KPIMetric[] {
  const { dateRange } = useDateRange();
  const { apiAccountId } = useAccount();
  const startDate = format(dateRange.from, "yyyy-MM-dd");
  const endDate = format(dateRange.to, "yyyy-MM-dd");
  const route = getApiRoute(config.dataSource);
  const sep = route.includes("?") ? "&" : "?";
  const url = `${route}${sep}startDate=${startDate}&endDate=${endDate}&accountId=${apiAccountId}`;

  const { data } = useSWR(url, fetcher, {
    refreshInterval: 300000,
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  if (!data || !data.data) return [];

  return extractAllMetrics(data, config.dataSource);
}

// ========== DATA EXTRACTION HELPERS ==========

function extractMetric(apiResponse: any, metric: string, dataSource: string, tracker?: string, dimensionValue?: string): number | null { // eslint-disable-line @typescript-eslint/no-explicit-any
  const d = apiResponse.data;
  if (!d) {
    // Some routes return metrics at top level
    if (apiResponse.metrics && apiResponse.metrics[metric] !== undefined) {
      return apiResponse.metrics[metric];
    }
    return null;
  }

  // Info submits per inventory platform (from /api/inventory-platform-leads).
  // data is [{ month, monthKey, byPlatform: { Platform: count } }]. Sum across
  // months — all platforms, or just one when dimensionValue names a platform.
  if (dataSource === "info-submits") {
    const months = Array.isArray(d) ? d : [];
    let total = 0;
    for (const m of months) {
      const bp = (m?.byPlatform ?? {}) as Record<string, number>;
      if (dimensionValue) {
        total += bp[dimensionValue] ?? 0;
      } else {
        for (const v of Object.values(bp)) total += Number(v) || 0;
      }
    }
    return total;
  }

  // Nationwide Haul CRM format (nested summary response)
  if (dataSource === "nationwide-haul-crm") {
    if (d[metric] !== undefined) return d[metric];
    if (d.leads && d.leads[metric] !== undefined) return d.leads[metric];
    if (d.deals && d.deals[metric] !== undefined) return d.deals[metric];
    if (d.funnel && d.funnel[metric] !== undefined) return d.funnel[metric];
    // Aliases: totalLeads → leads.total, closeRate → deals.closeRate
    if (metric === "totalLeads") return d.leads?.total ?? null;
    if (metric === "closeRate") return d.deals?.closeRate ?? null;
    if (metric === "closedDeals") return d.funnel?.closedDeals ?? null;
    return null;
  }

  // CallRail format
  if (dataSource === "callrail") {
    // When a `tracker` filter is set, return the call count for that tracker
    // from the breakdown (substring match — CallRail tracker names often
    // contain extra suffixes like "- TruckPaper Banner").
    if (tracker && Array.isArray(d.trackerBreakdown)) {
      const match = d.trackerBreakdown.find((t: { tracker: string; count: number }) =>
        t.tracker.toLowerCase().includes(tracker.toLowerCase())
      );
      return match ? match.count : 0;
    }
    if (d[metric] !== undefined) return d[metric];
  }

  // GHL format
  if (dataSource === "email-marketing") {
    if (d[metric] !== undefined) return d[metric];
    if (d.totalContacts !== undefined && metric === "newContacts") return d.totalContacts;
  }

  // RingCentral format
  if (dataSource === "ringcentral" && d[metric] !== undefined) return d[metric];

  // YouTube format — the API already returns range-scoped views/likes/
  // comments/subscribers/watchTime, with all-time totals under totalX.
  if (apiResponse.platform === "youtube") {
    if (d[metric] !== undefined) return d[metric];
    return null;
  }

  // Google Ads format — array of searchStream results with daily metrics
  if (dataSource === "google-ads" || apiResponse.platform === "google-ads") {
    const rows = Array.isArray(d) ? d.flatMap((r: any) => r.results || []) : d.results || []; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (rows.length > 0) {
      const metricMap: Record<string, string> = {
        spend: "costMicros",
        clicks: "clicks",
        impressions: "impressions",
        ctr: "ctr",
        conversions: "conversions",
        cpc: "costMicros", // computed: spend / clicks
        costPerConversion: "costPerConversion",
      };
      const apiField = metricMap[metric];
      if (!apiField) return null;

      if (metric === "ctr") {
        let totalClicks = 0, totalImpressions = 0;
        for (const row of rows) {
          totalClicks += parseInt(row.metrics?.clicks || "0", 10);
          totalImpressions += parseInt(row.metrics?.impressions || "0", 10);
        }
        return totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0;
      }

      if (metric === "cpc") {
        let totalCost = 0, totalClicks = 0;
        for (const row of rows) {
          totalCost += parseInt(row.metrics?.costMicros || "0", 10);
          totalClicks += parseInt(row.metrics?.clicks || "0", 10);
        }
        return totalClicks > 0 ? Math.round((totalCost / totalClicks / 1_000_000) * 100) / 100 : 0;
      }

      if (metric === "spend") {
        let total = 0;
        for (const row of rows) total += parseInt(row.metrics?.costMicros || "0", 10);
        return Math.round(total / 1_000_000 * 100) / 100;
      }

      if (metric === "costPerConversion") {
        let totalCost = 0, totalConversions = 0;
        for (const row of rows) {
          totalCost += parseInt(row.metrics?.costMicros || "0", 10);
          totalConversions += parseFloat(row.metrics?.conversions || "0");
        }
        return totalConversions > 0 ? Math.round((totalCost / totalConversions / 1_000_000) * 100) / 100 : 0;
      }

      // Sum-based metrics (clicks, impressions, conversions)
      let total = 0;
      for (const row of rows) {
        total += parseFloat(row.metrics?.[apiField] || "0");
      }
      return Math.round(total * 100) / 100;
    }
  }

  // Generic: try direct property access
  if (d[metric] !== undefined) return d[metric];

  // Google Analytics format (GA4 returns rows)
  if (d.rows) {
    const metricIndex = getGA4MetricIndex(metric);
    if (metricIndex >= 0) {
      // When a dimensionValue is set (e.g. "Paid Search"), the rows are broken
      // down by that dimension — sum only the matching row(s), not every channel.
      const rows = dimensionValue
        ? d.rows.filter((row: any) => row.dimensionValues?.[0]?.value === dimensionValue) // eslint-disable-line @typescript-eslint/no-explicit-any
        : d.rows;
      let total = 0;
      rows.forEach((row: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        total += parseFloat(row.metricValues?.[metricIndex]?.value || "0");
      });
      return Math.round(total * 100) / 100;
    }
  }

  // Meta Social (Facebook/Instagram) — flat object with named metrics
  if (apiResponse.platform === "meta" && d && !d.data && typeof d === "object") {
    if (d[metric] !== undefined) return d[metric];
    // Aliases for widget metric names
    const aliases: Record<string, string> = {
      pageViews: "views",
      postEngagement: "interactions",
      follows: "followers",
      likes: "totalLikes",
      mediaCount: "mediaCount",
    };
    if (aliases[metric] && d[aliases[metric]] !== undefined) return d[aliases[metric]];
    return null;
  }

  // Meta Ads — daily rows from Meta Ads API (time_increment=1)
  if (apiResponse.platform === "meta" && d.data && Array.isArray(d.data)) {
    const rows = d.data;
    // Summable metrics
    const sumMetrics = ["spend", "impressions", "clicks", "reach"];
    // Rate metrics — compute weighted average
    const rateMetrics = ["ctr", "cpc"];

    if (sumMetrics.includes(metric)) {
      let total = 0;
      for (const row of rows) {
        total += parseFloat(row[metric] || "0");
      }
      return Math.round(total * 100) / 100;
    }

    if (metric === "ctr") {
      // CTR = total clicks / total impressions * 100
      let totalClicks = 0, totalImpressions = 0;
      for (const row of rows) {
        totalClicks += parseFloat(row.clicks || "0");
        totalImpressions += parseFloat(row.impressions || "0");
      }
      return totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0;
    }

    if (metric === "cpc") {
      // CPC = total spend / total clicks
      let totalSpend = 0, totalClicks = 0;
      for (const row of rows) {
        totalSpend += parseFloat(row.spend || "0");
        totalClicks += parseFloat(row.clicks || "0");
      }
      return totalClicks > 0 ? Math.round((totalSpend / totalClicks) * 100) / 100 : 0;
    }

    // Leads — extract from actions array (action_type: "lead")
    if (metric === "conversions" || metric === "leads") {
      let total = 0;
      for (const row of rows) {
        if (row.actions) {
          const lead = row.actions.find((a: any) => a.action_type === "lead"); // eslint-disable-line @typescript-eslint/no-explicit-any
          if (lead) total += parseFloat(lead.value || "0");
        }
      }
      return total;
    }

    // Cost per lead — extract from cost_per_action_type
    if (metric === "costPerLead") {
      let totalSpend = 0, totalLeads = 0;
      for (const row of rows) {
        totalSpend += parseFloat(row.spend || "0");
        if (row.actions) {
          const lead = row.actions.find((a: any) => a.action_type === "lead"); // eslint-disable-line @typescript-eslint/no-explicit-any
          if (lead) totalLeads += parseFloat(lead.value || "0");
        }
      }
      return totalLeads > 0 ? Math.round((totalSpend / totalLeads) * 100) / 100 : 0;
    }

    // Fallback — try direct field from first row
    for (const insight of rows) {
      if (insight[metric] !== undefined) return parseFloat(insight[metric]);
    }
  }

  return null;
}

function extractTimeSeries(apiResponse: any, metric: string): { date: string; value: number }[] | null { // eslint-disable-line @typescript-eslint/no-explicit-any
  const d = apiResponse.data;
  if (!d) return null;

  // Info submits per platform (inventory-platform-leads): monthly totals.
  // Shape: [{ month, monthKey, byPlatform }]. Detected by the byPlatform key.
  if (Array.isArray(d) && d.length > 0 && d[0] && typeof d[0] === "object" && "byPlatform" in d[0]) {
    return d.map((m: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const bp = m.byPlatform ?? {};
      let total = 0;
      for (const v of Object.values(bp)) total += Number(v) || 0;
      return { date: `${m.monthKey || ""}-01`, value: total };
    }).filter((p: { date: string }) => p.date.length > 4);
  }

  // Nationwide Haul CRM: leads or deals time series
  if (apiResponse.platform === "nationwide-haul-crm") {
    if (metric === "totalRevenue" || metric === "closedWon" || metric === "avgDealValue") {
      return d.deals?.timeSeries ?? d.timeSeries ?? null;
    }
    return d.leads?.timeSeries ?? d.timeSeries ?? null;
  }

  // CallRail: extract from calls array by date. CallRail calls carry start_time
  // (created_at is often absent), so fall back across both.
  if (apiResponse.platform === "callrail" && Array.isArray(d.calls)) {
    const byDate: Record<string, number> = {};
    d.calls.forEach((call: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const raw = call.start_time || call.created_at || call.start_time_formatted || "";
      const date = String(raw).split("T")[0].split(" ")[0];
      if (date) byDate[date] = (byDate[date] || 0) + 1;
    });
    return Object.entries(byDate).map(([date, value]) => ({ date, value })).sort((a, b) => a.date.localeCompare(b.date));
  }

  // YouTube time series — prefer Analytics daily rows if available, otherwise
  // aggregate videos[] by publishedAt month.
  if (apiResponse.platform === "youtube") {
    const analyticsRows = d.analytics?.rows;
    if (Array.isArray(analyticsRows) && analyticsRows.length > 0) {
      // columnHeaders: [day, views, estimatedMinutesWatched, subscribersGained, likes, comments]
      const metricIdx: Record<string, number> = {
        views: 1,
        watchTime: 2,
        estimatedMinutesWatched: 2,
        subscribers: 3,
        likes: 4,
        comments: 5,
      };
      const idx = metricIdx[metric] ?? 1;
      return analyticsRows.map((row: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
        date: row[0],
        value: row[idx] || 0,
      }));
    }

    // Fallback: aggregate videos by month
    const videos: any[] = d.videos ?? []; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (videos.length === 0) return [];
    const byMonth: Record<string, number> = {};
    for (const v of videos) {
      if (!v.publishedAt) continue;
      const d0 = new Date(v.publishedAt);
      const key = `${d0.getFullYear()}-${String(d0.getMonth() + 1).padStart(2, "0")}-01`;
      const val =
        metric === "views" ? v.views || 0
        : metric === "likes" ? v.likes || 0
        : metric === "comments" ? v.comments || 0
        : metric === "videosPublished" ? 1
        : 0;
      byMonth[key] = (byMonth[key] || 0) + val;
    }
    return Object.entries(byMonth)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Google Ads: daily rows with segments.date and metrics
  if (apiResponse.platform === "google-ads") {
    const rows = Array.isArray(d) ? d.flatMap((r: any) => r.results || []) : d.results || []; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (rows.length > 0) {
      return rows.map((row: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const date = row.segments?.date?.replace(/-/g, "") || "";
        let value = 0;
        if (metric === "spend") {
          value = parseInt(row.metrics?.costMicros || "0", 10) / 1_000_000;
        } else if (metric === "cpc") {
          const cost = parseInt(row.metrics?.costMicros || "0", 10) / 1_000_000;
          const clicks = parseInt(row.metrics?.clicks || "0", 10);
          value = clicks > 0 ? cost / clicks : 0;
        } else if (metric === "ctr") {
          value = (row.metrics?.ctr || 0) * 100;
        } else {
          value = parseFloat(row.metrics?.[metric] || row.metrics?.clicks || "0");
        }
        return { date, value: Math.round(value * 100) / 100 };
      }).filter((p: any) => p.date); // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  }

  // Meta Social (Facebook/Instagram): pre-built daily time series from Page/IG Insights
  if (apiResponse.platform === "meta" && d && !d.data) {
    const seriesMap: Record<string, string> = {
      reach: "reachTimeSeries",
      interactions: "engagementTimeSeries",
      postEngagement: "engagementTimeSeries",
      views: "viewsTimeSeries",
      pageViews: "viewsTimeSeries",
      likes: "engagementTimeSeries",
    };
    const key = seriesMap[metric];
    if (key && Array.isArray(d[key])) return d[key];
  }

  // Meta Ads: daily rows with date_start
  if (apiResponse.platform === "meta" && d.data && Array.isArray(d.data)) {
    return d.data.map((row: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      let value = 0;
      if (metric === "conversions" || metric === "leads") {
        const lead = row.actions?.find((a: any) => a.action_type === "lead"); // eslint-disable-line @typescript-eslint/no-explicit-any
        value = lead ? parseFloat(lead.value || "0") : 0;
      } else {
        value = parseFloat(row[metric] || "0");
      }
      return { date: row.date_start || "", value };
    }).filter((p: any) => p.date); // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  // CallRail: build a monthly series by counting calls from the raw calls array
  if (apiResponse.platform === "callrail" && Array.isArray(d?.calls)) {
    const byMonth: Record<string, number> = {};
    for (const c of d.calls) { // eslint-disable-line @typescript-eslint/no-explicit-any
      const t = c.start_time || c.created_at || c.start_time_formatted;
      if (!t) continue;
      const key = String(t).slice(0, 7) + "-01"; // YYYY-MM-01 bucket
      byMonth[key] = (byMonth[key] || 0) + 1;
    }
    return Object.entries(byMonth)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // GA4: rows with date dimension
  if (d.rows) {
    return d.rows.map((row: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      date: row.dimensionValues?.[0]?.value || "",
      value: parseFloat(row.metricValues?.[0]?.value || "0"),
    })).filter((p: any) => p.date); // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  return null;
}

// Extract category-based data from GA4 dimension queries (e.g. deviceCategory, channelGroup)
function extractDimensionData(apiResponse: any, metric: string): { date: string; value: number }[] { // eslint-disable-line @typescript-eslint/no-explicit-any
  const d = apiResponse.data;
  if (!d?.rows) return [];
  const metricIndex = getGA4MetricIndex(metric);
  const idx = metricIndex >= 0 ? metricIndex : 0; // default to sessions (index 0)
  return d.rows.map((row: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    date: row.dimensionValues?.[0]?.value || "Unknown",
    value: parseFloat(row.metricValues?.[idx]?.value || "0"),
  })).filter((p: any) => p.value > 0); // eslint-disable-line @typescript-eslint/no-explicit-any
}

function extractAllMetrics(apiResponse: any, dataSource: string): KPIMetric[] { // eslint-disable-line @typescript-eslint/no-explicit-any
  const d = apiResponse.data;
  if (!d) return [];

  // Google Ads
  if (dataSource === "google-ads") {
    const rows = Array.isArray(d) ? d.flatMap((r: any) => r.results || []) : d.results || []; // eslint-disable-line @typescript-eslint/no-explicit-any
    let totalCost = 0, totalClicks = 0, totalImpressions = 0, totalConversions = 0;
    for (const row of rows) {
      totalCost += parseInt(row.metrics?.costMicros || "0", 10);
      totalClicks += parseInt(row.metrics?.clicks || "0", 10);
      totalImpressions += parseInt(row.metrics?.impressions || "0", 10);
      totalConversions += parseFloat(row.metrics?.conversions || "0");
    }
    const spend = totalCost / 1_000_000;
    return [
      { id: "spend", label: "Cost (Spend)", value: Math.round(spend * 100) / 100, format: "currency" as const },
      { id: "clicks", label: "Clicks", value: totalClicks, format: "number" as const },
      { id: "impressions", label: "Impressions", value: totalImpressions, format: "number" as const },
      { id: "ctr", label: "CTR", value: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0, format: "percent" as const },
      { id: "cpc", label: "Avg. CPC", value: totalClicks > 0 ? Math.round((spend / totalClicks) * 100) / 100 : 0, format: "currency" as const },
      { id: "conversions", label: "Conversions", value: Math.round(totalConversions), format: "number" as const },
      { id: "costPerConversion", label: "Cost/Conversion", value: totalConversions > 0 ? Math.round((spend / totalConversions) * 100) / 100 : 0, format: "currency" as const },
    ];
  }

  // CallRail
  if (dataSource === "callrail") {
    return [
      { id: "totalCalls", label: "Total Calls", value: d.totalCalls || 0, format: "number" },
      { id: "answered", label: "Answered", value: d.answered || 0, format: "number" },
      { id: "missed", label: "Missed", value: d.missed || 0, format: "number" },
      { id: "avgDuration", label: "Avg Duration", value: d.avgDuration || 0, format: "number" },
      { id: "answerRate", label: "Answer Rate", value: d.answerRate || 0, format: "percent" },
    ];
  }

  // GHL
  if (dataSource === "email-marketing") {
    return [
      { id: "totalContacts", label: "Total Contacts", value: d.totalContacts || 0, format: "number" },
      { id: "totalCampaigns", label: "Campaigns", value: d.totalCampaigns || 0, format: "number" },
    ];
  }

  // RingCentral
  if (dataSource === "ringcentral") {
    return [
      { id: "totalCalls", label: "Total Calls", value: d.totalCalls || 0, format: "number" },
      { id: "answered", label: "Answered", value: d.answered || 0, format: "number" },
      { id: "missed", label: "Missed", value: d.missed || 0, format: "number" },
      { id: "answerRate", label: "Answer Rate", value: d.answerRate || 0, format: "percent" },
    ];
  }

  // Generic: try to extract all numeric properties
  const metrics: KPIMetric[] = [];
  if (typeof d === "object") {
    Object.entries(d).forEach(([key, value]) => {
      if (typeof value === "number") {
        metrics.push({ id: key, label: key, value, format: "number" });
      }
    });
  }
  return metrics;
}

function getGA4MetricIndex(metric: string): number {
  const ga4Metrics = ["sessions", "totalUsers", "screenPageViews", "bounceRate", "averageSessionDuration", "conversions"];
  const mapping: Record<string, number> = {
    sessions: 0, users: 1, pageViews: 2, bounceRate: 3, avgSessionDuration: 4, conversions: 5,
  };
  return mapping[metric] ?? -1;
}
