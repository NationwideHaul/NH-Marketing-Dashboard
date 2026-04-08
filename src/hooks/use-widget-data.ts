"use client";

import useSWR from "swr";
import { useDateRange } from "@/context/date-range-context";
import { useAccount } from "@/context/account-context";
import { format } from "date-fns";
import type { WidgetConfig } from "@/types/widget";
import type { KPIMetric } from "@/types/kpi";

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

// Main hook — fetches from real API and extracts metric
export function useWidgetMetric(config: WidgetConfig): KPIMetric | null {
  const { dateRange } = useDateRange();
  const { currentAccount } = useAccount();
  const startDate = format(dateRange.from, "yyyy-MM-dd");
  const endDate = format(dateRange.to, "yyyy-MM-dd");
  const route = getApiRoute(config.dataSource);
  const sep = route.includes("?") ? "&" : "?";
  const url = `${route}${sep}startDate=${startDate}&endDate=${endDate}&accountId=${currentAccount.id}`;

  const { data } = useSWR(url, fetcher, SWR_CONFIG);

  if (!data || data.status === "error") return null;

  // Extract the metric from the API response
  const metricValue = extractMetric(data, config.metric, config.dataSource);
  if (metricValue === null) return null;

  return {
    id: config.metric,
    label: config.title,
    value: metricValue,
    format: config.format,
    trend: "flat",
    changePercent: 0,
  };
}

// For charts — returns time series from API
export function useWidgetTimeSeries(config: WidgetConfig): { date: string; value: number }[] {
  const { dateRange } = useDateRange();
  const { currentAccount } = useAccount();
  const startDate = format(dateRange.from, "yyyy-MM-dd");
  const endDate = format(dateRange.to, "yyyy-MM-dd");
  const route = getApiRoute(config.dataSource);
  const sep = route.includes("?") ? "&" : "?";
  const url = `${route}${sep}startDate=${startDate}&endDate=${endDate}&accountId=${currentAccount.id}`;

  const { data } = useSWR(url, fetcher, {
    refreshInterval: 300000,
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  if (!data || !data.data) return [];

  // Try to extract time series from the response
  return extractTimeSeries(data, config.metric) || [];
}

// For table widgets — returns all metrics
export function useWidgetAllMetrics(config: WidgetConfig): KPIMetric[] {
  const { dateRange } = useDateRange();
  const { currentAccount } = useAccount();
  const startDate = format(dateRange.from, "yyyy-MM-dd");
  const endDate = format(dateRange.to, "yyyy-MM-dd");
  const route = getApiRoute(config.dataSource);
  const sep = route.includes("?") ? "&" : "?";
  const url = `${route}${sep}startDate=${startDate}&endDate=${endDate}&accountId=${currentAccount.id}`;

  const { data } = useSWR(url, fetcher, {
    refreshInterval: 300000,
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  if (!data || !data.data) return [];

  return extractAllMetrics(data, config.dataSource);
}

// ========== DATA EXTRACTION HELPERS ==========

function extractMetric(apiResponse: any, metric: string, dataSource: string): number | null { // eslint-disable-line @typescript-eslint/no-explicit-any
  const d = apiResponse.data;
  if (!d) {
    // Some routes return metrics at top level
    if (apiResponse.metrics && apiResponse.metrics[metric] !== undefined) {
      return apiResponse.metrics[metric];
    }
    return null;
  }

  // CallRail format
  if (dataSource === "callrail" && d[metric] !== undefined) return d[metric];

  // GHL format
  if (dataSource === "email-marketing") {
    if (d[metric] !== undefined) return d[metric];
    if (d.totalContacts !== undefined && metric === "newContacts") return d.totalContacts;
  }

  // RingCentral format
  if (dataSource === "ringcentral" && d[metric] !== undefined) return d[metric];

  // Generic: try direct property access
  if (d[metric] !== undefined) return d[metric];

  // Google Analytics format (GA4 returns rows)
  if (d.rows) {
    // Sum up metric from rows
    const metricIndex = getGA4MetricIndex(metric);
    if (metricIndex >= 0) {
      let total = 0;
      d.rows.forEach((row: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        total += parseFloat(row.metricValues?.[metricIndex]?.value || "0");
      });
      return Math.round(total * 100) / 100;
    }
  }

  // Meta format
  if (apiResponse.platform === "meta" && d.data) {
    // Insights format
    for (const insight of d.data) {
      if (insight[metric] !== undefined) return parseFloat(insight[metric]);
    }
  }

  return null;
}

function extractTimeSeries(apiResponse: any, metric: string): { date: string; value: number }[] | null { // eslint-disable-line @typescript-eslint/no-explicit-any
  const d = apiResponse.data;
  if (!d) return null;

  // CallRail: extract from calls array by date
  if (apiResponse.platform === "callrail" && d.calls) {
    const byDate: Record<string, number> = {};
    d.calls.forEach((call: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const date = call.created_at?.split("T")[0] || call.created_at?.split(" ")[0];
      if (date) byDate[date] = (byDate[date] || 0) + 1;
    });
    return Object.entries(byDate).map(([date, value]) => ({ date, value })).sort((a, b) => a.date.localeCompare(b.date));
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

function extractAllMetrics(apiResponse: any, dataSource: string): KPIMetric[] { // eslint-disable-line @typescript-eslint/no-explicit-any
  const d = apiResponse.data;
  if (!d) return [];

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
