"use client";

import useSWR from "swr";
import { useDateRange } from "@/context/date-range-context";
import { useAccount } from "@/context/account-context";
import { format, differenceInDays, subDays } from "date-fns";
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
    "nationwide-haul-crm": "/api/nationwide-haul-crm",
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
  const { apiAccountId } = useAccount();
  const startDate = format(dateRange.from, "yyyy-MM-dd");
  const endDate = format(dateRange.to, "yyyy-MM-dd");
  const route = getApiRoute(config.dataSource);
  const sep = route.includes("?") ? "&" : "?";
  const url = `${route}${sep}startDate=${startDate}&endDate=${endDate}&accountId=${apiAccountId}`;

  // Calculate previous period (same duration, immediately before)
  const days = differenceInDays(dateRange.to, dateRange.from) + 1;
  const prevEnd = subDays(dateRange.from, 1);
  const prevStart = subDays(prevEnd, days - 1);
  const prevUrl = `${route}${sep}startDate=${format(prevStart, "yyyy-MM-dd")}&endDate=${format(prevEnd, "yyyy-MM-dd")}&accountId=${apiAccountId}`;

  const { data } = useSWR(url, fetcher, SWR_CONFIG);
  const { data: prevData } = useSWR(
    config.comparisonEnabled ? prevUrl : null,
    fetcher,
    SWR_CONFIG
  );

  if (!data || data.status === "error") return null;

  // Extract the metric from the API response
  const metricValue = extractMetric(data, config.metric, config.dataSource);
  if (metricValue === null) return null;

  // Compute trend vs previous period
  let trend: "up" | "down" | "flat" = "flat";
  let changePercent = 0;

  if (config.comparisonEnabled && prevData && prevData.status !== "error") {
    const prevValue = extractMetric(prevData, config.metric, config.dataSource);
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
  // If trendMonths is set, extend start date back N months from the end date
  const effectiveStart = config.trendMonths
    ? subDays(dateRange.to, config.trendMonths * 30)
    : dateRange.from;
  const startDate = format(effectiveStart, "yyyy-MM-dd");
  const endDate = format(dateRange.to, "yyyy-MM-dd");
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

function extractMetric(apiResponse: any, metric: string, dataSource: string): number | null { // eslint-disable-line @typescript-eslint/no-explicit-any
  const d = apiResponse.data;
  if (!d) {
    // Some routes return metrics at top level
    if (apiResponse.metrics && apiResponse.metrics[metric] !== undefined) {
      return apiResponse.metrics[metric];
    }
    return null;
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

  // Nationwide Haul CRM: leads or deals time series
  if (apiResponse.platform === "nationwide-haul-crm") {
    if (metric === "totalRevenue" || metric === "closedWon" || metric === "avgDealValue") {
      return d.deals?.timeSeries ?? d.timeSeries ?? null;
    }
    return d.leads?.timeSeries ?? d.timeSeries ?? null;
  }

  // CallRail: extract from calls array by date
  if (apiResponse.platform === "callrail" && d.calls) {
    const byDate: Record<string, number> = {};
    d.calls.forEach((call: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const date = call.created_at?.split("T")[0] || call.created_at?.split(" ")[0];
      if (date) byDate[date] = (byDate[date] || 0) + 1;
    });
    return Object.entries(byDate).map(([date, value]) => ({ date, value })).sort((a, b) => a.date.localeCompare(b.date));
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
