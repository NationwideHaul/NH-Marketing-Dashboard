"use client";

import { useState, useMemo, useEffect } from "react";
import {
  TrendingUp, TrendingDown, Minus, HelpCircle, X, ChevronDown,
  DollarSign, Target, Users, BarChart3, Percent, ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart,
} from "recharts";
import { cn, formatNumber, formatCurrency, formatPercent } from "@/lib/utils";
import { useAccount } from "@/context/account-context";
import { useDateRange } from "@/context/date-range-context";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { generateTimeSeries, aggregateMonthly, aggregateMonthlyAvg } from "@/lib/mock-data/generator";
import { platformMetricConfigs } from "@/lib/mock-data/platform-configs";
import { getPlatformsForAccount } from "@/lib/inventory-platforms-data";

const BLANK = "—";

/**
 * NHTTR ad spend = real Google Ads spend for the active date range PLUS
 * the account's inventory-platform monthly fees (annualCost / 12 for each
 * annual platform). Returns null while loading so the card can display a
 * blank until data arrives.
 */
// NHTTR has two separate Google Ads customer IDs (RV & Bus Repair and
// Truck & Trailer Repair) plus annually-billed listing platforms. ROI here
// reflects NHTTR as a whole, so we fetch BOTH Google Ads accounts and
// pro-rate the annual listings to the selected date range.
function useNhttrAdSpend(
  accountId: string,
  startDate: string,
  endDate: string,
): { total: number; googleAds: number; inventoryPeriod: number } | null {
  const [googleAds, setGoogleAds] = useState<number | null>(null);
  useEffect(() => {
    if (!accountId.startsWith("nhttr")) { setGoogleAds(null); return; }
    let cancelled = false;

    const fetchSpend = async (acctId: string) => {
      const r = await fetch(`/api/google-ads?startDate=${startDate}&endDate=${endDate}&accountId=${acctId}`);
      const res = await r.json();
      if (res.status !== "live") return 0;
      const rows = Array.isArray(res.data)
        ? res.data.flatMap((r: { results?: unknown[] }) => r.results ?? [])
        : res.data?.results ?? [];
      let totalMicros = 0;
      for (const row of rows as { metrics?: { costMicros?: string } }[]) {
        totalMicros += parseInt(row.metrics?.costMicros ?? "0", 10);
      }
      return totalMicros / 1_000_000;
    };

    Promise.all([fetchSpend("nhttr-rv"), fetchSpend("nhttr-ttr")])
      .then(([rv, ttr]) => { if (!cancelled) setGoogleAds(rv + ttr); })
      .catch(() => { if (!cancelled) setGoogleAds(null); });

    return () => { cancelled = true; };
  }, [startDate, endDate, accountId]);

  if (!accountId.startsWith("nhttr")) return null;

  const platforms = getPlatformsForAccount("nhttr");
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1,
  );
  const inventoryPeriod = platforms.reduce((sum, p) => {
    if (p.billingCycle === "annual" && p.annualCost) return sum + (p.annualCost / 365) * days;
    if (p.billingCycle === "monthly") return sum + p.pricePerMonth * (days / 30);
    return sum;
  }, 0);

  if (googleAds === null) return null;
  return {
    googleAds: Math.round(googleAds * 100) / 100,
    inventoryPeriod: Math.round(inventoryPeriod * 100) / 100,
    total: Math.round((googleAds + inventoryPeriod) * 100) / 100,
  };
}

// ========== METRIC DEFINITIONS (for ? tooltips) ==========
const metricDefinitions: Record<string, { title: string; definition: string; formula: string }> = {
  revenue: {
    title: "Total Revenue",
    definition: "The total income generated from all sales within the selected period.",
    formula: "Sum of all closed deal values",
  },
  closeRate: {
    title: "Close Rate (Lead-to-Sale)",
    definition: "The percentage of leads that convert into paying customers.",
    formula: "Closed Deals / Total Leads x 100",
  },
  aov: {
    title: "Average Order Value (AOV)",
    definition: "The average revenue per transaction or closed deal.",
    formula: "Total Revenue / Number of Orders",
  },
  adSpend: {
    title: "Total Advertising Spend",
    definition: "The combined amount spent across all advertising platforms (Google Ads, Meta Ads, etc.).",
    formula: "Google Ads Spend + Meta Ads Spend + Other Ad Spend",
  },
  roas: {
    title: "Return on Ad Spend (ROAS)",
    definition: "How much revenue you earn for every dollar spent on advertising. A ROAS of 10x means $10 revenue per $1 spent.",
    formula: "Revenue / Ad Spend",
  },
  mer: {
    title: "Marketing Efficiency Ratio (MER)",
    definition: "Measures overall marketing efficiency including all marketing costs (not just ads). Higher is better.",
    formula: "Total Revenue / Total Marketing Spend",
  },
  roi: {
    title: "Return on Investment (ROI)",
    definition: "The profit generated relative to the total marketing investment. Shows the net return as a percentage.",
    formula: "(Revenue - Total Spend) / Total Spend x 100",
  },
  cac: {
    title: "Customer Acquisition Cost (CAC)",
    definition: "The average cost to acquire one new customer. Lower is better.",
    formula: "Total Marketing Spend / Number of New Customers",
  },
  ltv: {
    title: "Lifetime Value (LTV)",
    definition: "The total revenue a customer generates over their entire relationship with the business.",
    formula: "AOV x Purchase Frequency x Customer Lifespan",
  },
  ltvCacRatio: {
    title: "LTV:CAC Ratio",
    definition: "Compares customer lifetime value to acquisition cost. Target should be 3:1 or higher. Below 3:1 means you're overspending; much higher means you're under-investing.",
    formula: "LTV / CAC",
  },
  trafficGrowth: {
    title: "Traffic Growth",
    definition: "Month-over-month percentage change in website traffic.",
    formula: "(Current Period Sessions - Previous Period Sessions) / Previous Period Sessions x 100",
  },
  revenueGrowth: {
    title: "Revenue Growth",
    definition: "Month-over-month percentage change in total revenue.",
    formula: "(Current Revenue - Previous Revenue) / Previous Revenue x 100",
  },
  costEfficiency: {
    title: "Cost Efficiency",
    definition: "How efficiently your marketing budget is being used. Higher percentage means less waste.",
    formula: "Revenue-Generating Spend / Total Spend x 100",
  },
  profitMargin: {
    title: "Profit Margin",
    definition: "The percentage of revenue remaining after all marketing costs are deducted.",
    formula: "(Revenue - Total Marketing Spend) / Revenue x 100",
  },
  funnel: {
    title: "Conversion Funnel",
    definition: "Tracks the journey from initial lead to closed deal. Leads are raw inquiries, MQLs are marketing-qualified, SQLs are sales-qualified, and Closed Deals are finalized sales.",
    formula: "Leads > MQLs > SQLs > Closed Deals (each stage filters by qualification criteria)",
  },
};

// ========== INFO TOOLTIP COMPONENT ==========
function InfoTooltip({ metricKey }: { metricKey: string }) {
  const [open, setOpen] = useState(false);
  const def = metricDefinitions[metricKey];
  if (!def) return null;

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="ml-1.5 p-0.5 rounded-full hover:bg-muted/50 transition-colors inline-flex items-center justify-center"
        title={`What is ${def.title}?`}
      >
        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="bg-card border border-border rounded-xl shadow-2xl w-[90vw] max-w-[420px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">{def.title}</h3>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">{def.definition}</p>
              <div className="rounded-lg bg-muted/30 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-1">How it&apos;s measured</p>
                <p className="text-xs font-mono text-foreground/80">{def.formula}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ========== STAT CARD WITH ? TOOLTIP ==========
function ROIStatCard({
  title, value, subtitle, metricKey, trend, changePercent, onClick, accent,
}: {
  title: string;
  value: string;
  subtitle?: string;
  metricKey: string;
  trend?: "up" | "down" | "flat";
  changePercent?: number;
  onClick?: () => void;
  accent?: string;
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 transition-all",
        onClick && "cursor-pointer hover:shadow-md hover:border-primary/30 group"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center">
          <p className="text-xs text-muted-foreground">{title}</p>
          <InfoTooltip metricKey={metricKey} />
        </div>
        {onClick && (
          <BarChart3 className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
        )}
      </div>
      <p className="text-2xl font-bold" style={{ color: accent }}>{value}</p>
      {trend && changePercent !== undefined && (
        <div className="flex items-center gap-1 mt-1">
          <TrendIcon className={cn("h-3 w-3",
            trend === "up" && "text-emerald-500",
            trend === "down" && "text-red-500",
            trend === "flat" && "text-muted-foreground"
          )} />
          <span className={cn("text-[11px] font-medium",
            trend === "up" && "text-emerald-500",
            trend === "down" && "text-red-500",
            trend === "flat" && "text-muted-foreground"
          )}>
            {changePercent > 0 ? "+" : ""}{changePercent.toFixed(1)}% vs prev
          </span>
        </div>
      )}
      {subtitle && <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}

// ========== SECTION HEADER ==========
const sectionIcons: Record<string, React.ElementType> = {
  "Overall Sales & Spend": DollarSign,
  "Top-Line Profitability": Percent,
  "Efficiency": Target,
  "Performance Trend": BarChart3,
  "Conversion Funnel": Users,
  "Key Metrics Summary": TrendingUp,
};

function SectionHeader({ title, metricKey }: { title: string; metricKey?: string }) {
  const Icon = sectionIcons[title] || BarChart3;
  return (
    <div className="flex items-center gap-2.5 mt-7 mb-3">
      <div className="p-1.5 rounded-md bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      {metricKey && <InfoTooltip metricKey={metricKey} />}
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

// ========== CHART MODAL ==========
function ChartModal({
  title, data, dataKey, format: fmt, onClose, color,
}: {
  title: string;
  data: { month: string; value: number }[];
  dataKey: string;
  format: "currency" | "number" | "percent";
  onClose: () => void;
  color: string;
}) {
  const formatValue = (v: number) =>
    fmt === "currency" ? formatCurrency(v) : fmt === "percent" ? formatPercent(v) : formatNumber(v);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl shadow-2xl w-[90vw] max-w-[720px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="px-5 py-4">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={formatValue} width={65} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(v: number) => [formatValue(v), title]}
                  labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                />
                <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2} dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== MAIN PAGE ==========
export default function ROIMetricsPage() {
  const { currentAccount, apiAccountId } = useAccount();
  const { dateRange } = useDateRange();
  const COLORS = currentAccount.chartPalette;
  const primary = currentAccount.colors.primary;
  const secondary = currentAccount.colors.secondary;
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const isNHTTR = apiAccountId.startsWith("nhttr");
  const nhttrSpendStartStr = format(subMonths(startOfMonth(new Date()), 11), "yyyy-MM-dd");
  const nhttrSpendEndStr = format(new Date(), "yyyy-MM-dd");
  const nhttrAdSpend = useNhttrAdSpend(apiAccountId, nhttrSpendStartStr, nhttrSpendEndStr);

  // Generate 12 months of data for all metrics
  const monthlyData = useMemo(() => {
    const endDate = dateRange.to;
    const startDate = subMonths(startOfMonth(endDate), 11);
    const configs = platformMetricConfigs["overview"];
    const result: Record<string, { month: string; value: number }[]> = {};

    // Metrics that should be averaged (not summed) per month
    const avgMetrics = new Set([
      "closeRate", "aov", "roas", "mer", "cac", "ltv", "roi",
      "profitMargin", "trafficGrowth", "revenueGrowth", "costEfficiency",
      "conversionRate", "ctr", "cpc", "costPerConversion", "bounceRate",
    ]);

    const toMonthLabel = (p: { date: string; value: number }) => {
      const s = String(p.date);
      const yr = s.substring(0, 4);
      const mo = s.replace("-", "").substring(4, 6);
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const label = monthNames[parseInt(mo, 10) - 1] || mo;
      return { month: `${label} ${yr.substring(2)}`, value: p.value };
    };

    for (const config of configs) {
      const ts = generateTimeSeries("overview", config, startDate, endDate);
      const monthly = avgMetrics.has(config.key) ? aggregateMonthlyAvg(ts) : aggregateMonthly(ts);
      result[config.key] = monthly.map(toMonthLabel);
    }

    // Also get Google Ads and Meta Ads spend for the breakdown
    for (const platform of ["google-ads", "meta-ads"]) {
      const pConfigs = platformMetricConfigs[platform];
      for (const config of pConfigs) {
        const ts = generateTimeSeries(platform, config, startDate, endDate);
        const monthly = avgMetrics.has(config.key) ? aggregateMonthlyAvg(ts) : aggregateMonthly(ts);
        result[`${platform}-${config.key}`] = monthly.map(toMonthLabel);
      }
    }

    // Get GA sessions for traffic
    const gaConfigs = platformMetricConfigs["google-analytics"];
    for (const config of gaConfigs) {
      const ts = generateTimeSeries("google-analytics", config, startDate, endDate);
      const monthly = avgMetrics.has(config.key) ? aggregateMonthlyAvg(ts) : aggregateMonthly(ts);
      result[`ga-${config.key}`] = monthly.map(toMonthLabel);
    }

    return result;
  }, [dateRange.to]);

  // Compute current period values (last month's data)
  const current = useMemo(() => {
    const get = (key: string) => {
      const data = monthlyData[key];
      return data && data.length > 0 ? data[data.length - 1].value : 0;
    };
    const prev = (key: string) => {
      const data = monthlyData[key];
      return data && data.length > 1 ? data[data.length - 2].value : 0;
    };
    const pctChange = (cur: number, prv: number) => prv ? ((cur - prv) / prv) * 100 : 0;
    const trendDir = (change: number): "up" | "down" | "flat" => change > 0.5 ? "up" : change < -0.5 ? "down" : "flat";

    const revenue = get("revenue");
    const prevRevenue = prev("revenue");
    const adSpend = get("adSpend");
    const prevAdSpend = prev("adSpend");
    const totalSpend = get("totalSpend");
    const prevTotalSpend = prev("totalSpend");
    const leads = get("totalLeads");
    const prevLeads = prev("totalLeads");
    const newCustomers = get("newCustomers");
    const prevNewCustomers = prev("newCustomers");
    const closeRate = get("closeRate");
    const aov = get("aov");
    const cac = get("cac");
    const ltv = get("ltv");
    const mql = get("mql");
    const sql = get("sql");
    const closedDeals = get("closedDeals");

    const roas = adSpend > 0 ? revenue / adSpend : 0;
    const mer = totalSpend > 0 ? revenue / totalSpend : 0;
    const roiPct = totalSpend > 0 ? ((revenue - totalSpend) / totalSpend) * 100 : 0;
    const ltvCacRatio = cac > 0 ? ltv / cac : 0;

    const prevRoas = prevAdSpend > 0 ? prevRevenue / prevAdSpend : 0;
    const prevMer = prevTotalSpend > 0 ? prevRevenue / prevTotalSpend : 0;
    const prevRoi = prevTotalSpend > 0 ? ((prevRevenue - prevTotalSpend) / prevTotalSpend) * 100 : 0;

    return {
      revenue, adSpend, totalSpend, leads, newCustomers, closeRate, aov, cac, ltv,
      roas, mer, roiPct, ltvCacRatio, mql, sql, closedDeals,
      changes: {
        revenue: pctChange(revenue, prevRevenue),
        adSpend: pctChange(adSpend, prevAdSpend),
        totalSpend: pctChange(totalSpend, prevTotalSpend),
        leads: pctChange(leads, prevLeads),
        newCustomers: pctChange(newCustomers, prevNewCustomers),
        closeRate: pctChange(closeRate, prev("closeRate")),
        aov: pctChange(aov, prev("aov")),
        cac: pctChange(cac, prev("cac")),
        ltv: pctChange(ltv, prev("ltv")),
        roas: pctChange(roas, prevRoas),
        mer: pctChange(mer, prevMer),
        roi: pctChange(roiPct, prevRoi),
        trafficGrowth: pctChange(get("trafficGrowth"), prev("trafficGrowth")),
        revenueGrowth: pctChange(get("revenueGrowth"), prev("revenueGrowth")),
        costEfficiency: pctChange(get("costEfficiency"), prev("costEfficiency")),
        profitMargin: pctChange(get("profitMargin"), prev("profitMargin")),
      },
      trends: {
        revenue: trendDir(pctChange(revenue, prevRevenue)),
        adSpend: trendDir(pctChange(adSpend, prevAdSpend)),
        totalSpend: trendDir(pctChange(totalSpend, prevTotalSpend)),
        leads: trendDir(pctChange(leads, prevLeads)),
        closeRate: trendDir(pctChange(closeRate, prev("closeRate"))),
        aov: trendDir(pctChange(aov, prev("aov"))),
        cac: trendDir(pctChange(cac, prev("cac"))),
        ltv: trendDir(pctChange(ltv, prev("ltv"))),
        roas: trendDir(pctChange(roas, prevRoas)),
        mer: trendDir(pctChange(mer, prevMer)),
        roi: trendDir(pctChange(roiPct, prevRoi)),
      },
      raw: {
        trafficGrowth: get("trafficGrowth"),
        revenueGrowth: get("revenueGrowth"),
        costEfficiency: get("costEfficiency"),
        profitMargin: get("profitMargin"),
      },
    };
  }, [monthlyData]);

  // Spend vs Revenue overlap chart data
  const overlapData = useMemo(() => {
    const revenueData = monthlyData["revenue"] || [];
    const spendData = monthlyData["adSpend"] || [];
    return revenueData.map((r, i) => ({
      month: r.month,
      revenue: r.value,
      adSpend: spendData[i]?.value || 0,
    }));
  }, [monthlyData]);

  // Top channels data
  const channelData = useMemo(() => {
    const gadsSpend = monthlyData["google-ads-spend"];
    const metaSpend = monthlyData["meta-ads-spend"];
    const gaTraffic = monthlyData["ga-sessions"];
    const last = (arr: { value: number }[]) => arr && arr.length > 0 ? arr[arr.length - 1].value : 0;
    return [
      { channel: "Google Ads", value: last(gadsSpend), fill: COLORS[0] },
      { channel: "Meta Ads", value: last(metaSpend), fill: COLORS[1] },
      { channel: "Inventory Platforms", value: Math.round(last(gaTraffic) * 0.3), fill: COLORS[2] },
      { channel: "NH Website (Organic)", value: Math.round(last(gaTraffic) * 0.45), fill: COLORS[3] },
      { channel: "Other", value: Math.round(last(gaTraffic) * 0.08), fill: COLORS[4] },
    ];
  }, [monthlyData, COLORS]);

  // Conversion funnel data
  const funnelData = useMemo(() => {
    return [
      { stage: "Leads", value: Math.round(current.leads), color: COLORS[0], pct: 100 },
      { stage: "MQLs", value: Math.round(current.mql), color: COLORS[1], pct: current.leads > 0 ? Math.round((current.mql / current.leads) * 100) : 0 },
      { stage: "SQLs", value: Math.round(current.sql), color: COLORS[2], pct: current.leads > 0 ? Math.round((current.sql / current.leads) * 100) : 0 },
      { stage: "Closed Deals", value: Math.round(current.closedDeals), color: COLORS[3], pct: current.leads > 0 ? Math.round((current.closedDeals / current.leads) * 100) : 0 },
    ];
  }, [current, COLORS]);

  const getModalData = (key: string) => monthlyData[key] || [];

  return (
    <div>
      {/* Page Header */}
      <div className="mb-5 flex items-center gap-4">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <TrendingUp className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">ROI & Revenue Metrics</h2>
          <p className="text-sm text-muted-foreground">Sales performance and return on marketing investment</p>
        </div>
      </div>

      {/* ==================== OVERALL SALES & SPEND ==================== */}
      <SectionHeader title="Overall Sales & Spend" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ROIStatCard
          title="Total Revenue (Monthly)"
          value={isNHTTR ? BLANK : formatCurrency(current.revenue)}
          metricKey="revenue"
          trend={isNHTTR ? undefined : current.trends.revenue}
          changePercent={isNHTTR ? undefined : current.changes.revenue}
          onClick={isNHTTR ? undefined : () => setExpandedMetric("revenue")}
          accent={primary}
          subtitle={isNHTTR ? "No CRM connected" : undefined}
        />
        <ROIStatCard
          title="Close Rate (Lead-to-Sale)"
          value={isNHTTR ? BLANK : formatPercent(current.closeRate)}
          metricKey="closeRate"
          trend={isNHTTR ? undefined : current.trends.closeRate}
          changePercent={isNHTTR ? undefined : current.changes.closeRate}
          onClick={isNHTTR ? undefined : () => setExpandedMetric("closeRate")}
          accent={primary}
          subtitle={isNHTTR ? "No CRM connected" : undefined}
        />
        <ROIStatCard
          title="AOV (Avg. Order Value)"
          value={isNHTTR ? BLANK : formatCurrency(current.aov)}
          metricKey="aov"
          trend={isNHTTR ? undefined : current.trends.aov}
          changePercent={isNHTTR ? undefined : current.changes.aov}
          onClick={isNHTTR ? undefined : () => setExpandedMetric("aov")}
          accent={primary}
          subtitle={isNHTTR ? "No CRM connected" : undefined}
        />
        <ROIStatCard
          title="New Customers"
          value={isNHTTR ? BLANK : formatNumber(Math.round(current.newCustomers))}
          metricKey="cac"
          subtitle={isNHTTR ? "No CRM connected" : "This month"}
          trend={isNHTTR ? undefined : (current.changes.newCustomers > 0.5 ? "up" : current.changes.newCustomers < -0.5 ? "down" : "flat")}
          changePercent={isNHTTR ? undefined : current.changes.newCustomers}
          onClick={isNHTTR ? undefined : () => setExpandedMetric("newCustomers")}
          accent={primary}
        />
      </div>

      {/* Revenue Trend Chart — hidden for NHTTR since revenue is not connected */}
      {!isNHTTR && (
        <div className="mt-3 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-semibold text-card-foreground">Revenue Trend (Monthly)</h4>
            <InfoTooltip metricKey="revenue" />
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData["revenue"] || []} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} width={50} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(v: number) => [formatCurrency(v), "Revenue"]} />
                <Area type="monotone" dataKey="value" stroke={primary} fill={primary} fillOpacity={0.12} strokeWidth={2} dot={{ r: 2.5, fill: primary }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ==================== TOP-LINE PROFITABILITY ==================== */}
      <SectionHeader title="Top-Line Profitability" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ROIStatCard
          title="Total Ad Spend"
          value={
            isNHTTR
              ? (nhttrAdSpend ? formatCurrency(nhttrAdSpend.total) : BLANK)
              : formatCurrency(current.adSpend)
          }
          metricKey="adSpend"
          trend={isNHTTR ? undefined : current.trends.adSpend}
          changePercent={isNHTTR ? undefined : current.changes.adSpend}
          onClick={isNHTTR ? undefined : () => setExpandedMetric("adSpend")}
          accent={COLORS[1]}
          subtitle={
            isNHTTR && nhttrAdSpend
              ? `Google Ads ${formatCurrency(nhttrAdSpend.googleAds)} (RV + TTR) + Listings ${formatCurrency(nhttrAdSpend.inventoryPeriod)}`
              : "Click for breakdown"
          }
        />
        <ROIStatCard
          title="ROAS"
          value={isNHTTR ? BLANK : `${current.roas.toFixed(1)}x`}
          metricKey="roas"
          trend={isNHTTR ? undefined : current.trends.roas}
          changePercent={isNHTTR ? undefined : current.changes.roas}
          onClick={isNHTTR ? undefined : () => setExpandedMetric("roas")}
          accent={COLORS[0]}
          subtitle={isNHTTR ? "Needs revenue source" : undefined}
        />
        <ROIStatCard
          title="MER"
          value={isNHTTR ? BLANK : `${current.mer.toFixed(1)}x`}
          metricKey="mer"
          trend={isNHTTR ? undefined : current.trends.mer}
          changePercent={isNHTTR ? undefined : current.changes.mer}
          onClick={isNHTTR ? undefined : () => setExpandedMetric("mer")}
          accent={COLORS[2]}
          subtitle={isNHTTR ? "Needs revenue source" : undefined}
        />
        <ROIStatCard
          title="ROI"
          value={isNHTTR ? BLANK : `${current.roiPct.toFixed(0)}%`}
          metricKey="roi"
          trend={isNHTTR ? undefined : current.trends.roi}
          changePercent={isNHTTR ? undefined : current.changes.roi}
          onClick={isNHTTR ? undefined : () => setExpandedMetric("roi")}
          accent={COLORS[3]}
          subtitle={isNHTTR ? "Needs revenue source" : undefined}
        />
      </div>

      {/* ==================== EFFICIENCY ==================== */}
      <SectionHeader title="Efficiency" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <ROIStatCard
          title="CAC (Acquisition Cost)"
          value={isNHTTR ? BLANK : formatCurrency(current.cac)}
          metricKey="cac"
          trend={isNHTTR ? undefined : current.trends.cac}
          changePercent={isNHTTR ? undefined : current.changes.cac}
          onClick={isNHTTR ? undefined : () => setExpandedMetric("cac")}
          accent={COLORS[4] || primary}
          subtitle={isNHTTR ? "No CRM connected" : undefined}
        />
        <ROIStatCard
          title="LTV (Lifetime Value)"
          value={isNHTTR ? BLANK : formatCurrency(current.ltv)}
          metricKey="ltv"
          trend={isNHTTR ? undefined : current.trends.ltv}
          changePercent={isNHTTR ? undefined : current.changes.ltv}
          onClick={isNHTTR ? undefined : () => setExpandedMetric("ltv")}
          accent={COLORS[5] || primary}
          subtitle={isNHTTR ? "No CRM connected" : undefined}
        />
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center mb-1">
            <p className="text-xs text-muted-foreground">LTV:CAC Ratio</p>
            <InfoTooltip metricKey="ltvCacRatio" />
          </div>
          {isNHTTR ? (
            <>
              <p className="text-2xl font-bold text-muted-foreground">{BLANK}</p>
              <p className="text-[10px] text-muted-foreground mt-1">No CRM connected</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold" style={{ color: current.ltvCacRatio >= 3 ? "#16A34A" : current.ltvCacRatio >= 2 ? "#D97706" : "#EF4444" }}>
                {current.ltvCacRatio.toFixed(1)}:1
              </p>
              <div className="mt-1.5">
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                  current.ltvCacRatio >= 3 ? "bg-emerald-100 text-emerald-700" :
                  current.ltvCacRatio >= 2 ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"
                )}>
                  {current.ltvCacRatio >= 3 ? "Healthy" : current.ltvCacRatio >= 2 ? "Needs Improvement" : "Overspending"}
                </span>
                <p className="text-[10px] text-muted-foreground mt-1">Target: 3:1 or higher</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ==================== PERFORMANCE TREND ==================== */}
      {!isNHTTR && (
        <>
          <SectionHeader title="Performance Trend" />
          {/* Ad Spend vs Revenue Overlap */}
          <div className="rounded-lg border border-border bg-card p-4 mb-3">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-semibold text-card-foreground">Ad Spend vs. Revenue</h4>
              <InfoTooltip metricKey="roas" />
            </div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={overlapData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="revenue" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} width={55} />
                  <YAxis yAxisId="spend" orientation="right" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} width={55} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(v: number, name: string) => [formatCurrency(v), name === "revenue" ? "Revenue" : "Ad Spend"]} />
                  <Legend />
                  <Area yAxisId="revenue" type="monotone" dataKey="revenue" name="Revenue" stroke={primary} fill={primary} fillOpacity={0.1} strokeWidth={2} />
                  <Bar yAxisId="spend" dataKey="adSpend" name="Ad Spend" fill={COLORS[1]} fillOpacity={0.7} radius={[2, 2, 0, 0]} barSize={20} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Channels */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="text-sm font-semibold text-card-foreground mb-3">Top Channels by Revenue Contribution</h4>
            <div className="space-y-2.5">
              {channelData.map((ch) => {
                const maxVal = Math.max(...channelData.map((c) => c.value));
                const pct = maxVal > 0 ? (ch.value / maxVal) * 100 : 0;
                return (
                  <div key={ch.channel} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-32 shrink-0 truncate">{ch.channel}</span>
                    <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: ch.fill }} />
                    </div>
                    <span className="text-xs font-medium w-16 text-right">{formatCurrency(ch.value)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ==================== CONVERSION FUNNEL ==================== */}
      {!isNHTTR && <>
      <SectionHeader title="Conversion Funnel" metricKey="funnel" />
      <div className="rounded-lg border border-border bg-card p-5">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-sm font-semibold text-card-foreground">Conversion Funnel</h4>
          <span className="text-xs text-muted-foreground">Total: <span className="font-semibold text-foreground">{formatNumber(funnelData[0]?.value || 0)} Leads</span></span>
        </div>

        {/* Funnel boxes — primary-colored rectangles that shrink in height */}
        <div className="flex items-end gap-0 px-1">
          {funnelData.map((stage, i) => {
            const maxVal = funnelData[0].value || 1;
            const heightPx = Math.max(56, Math.round((stage.value / maxVal) * 160));
            return (
              <div key={stage.stage} className="flex-1 flex items-end">
                {/* Box + label column */}
                <div className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full mx-1 rounded-lg flex flex-col items-center justify-center text-white shadow-sm"
                    style={{
                      height: `${heightPx}px`,
                      backgroundColor: primary,
                    }}
                  >
                    <span className="text-lg lg:text-xl font-bold leading-tight">{formatNumber(stage.value)}</span>
                    <span className="text-[11px] text-white/75 font-medium">{stage.pct}%</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium mt-3">{stage.stage}</span>
                </div>
                {/* Arrow separator */}
                {i < funnelData.length - 1 && (
                  <div className="flex items-center justify-center shrink-0 pb-6">
                    <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      </>}

      {/* ==================== KEY METRICS SUMMARY ==================== */}
      {!isNHTTR && (
        <>
          <SectionHeader title="Key Metrics Summary" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <ROIStatCard
              title="Traffic Growth" value={formatPercent(current.raw.trafficGrowth)} metricKey="trafficGrowth"
              trend={current.changes.trafficGrowth > 0.5 ? "up" : current.changes.trafficGrowth < -0.5 ? "down" : "flat"}
              changePercent={current.changes.trafficGrowth}
              onClick={() => setExpandedMetric("trafficGrowth")} accent="#2563EB"
            />
            <ROIStatCard
              title="Revenue Growth" value={formatPercent(current.raw.revenueGrowth)} metricKey="revenueGrowth"
              trend={current.changes.revenueGrowth > 0.5 ? "up" : current.changes.revenueGrowth < -0.5 ? "down" : "flat"}
              changePercent={current.changes.revenueGrowth}
              onClick={() => setExpandedMetric("revenueGrowth")} accent="#16A34A"
            />
            <ROIStatCard
              title="Cost Efficiency" value={formatPercent(current.raw.costEfficiency)} metricKey="costEfficiency"
              trend={current.changes.costEfficiency > 0.5 ? "up" : current.changes.costEfficiency < -0.5 ? "down" : "flat"}
              changePercent={current.changes.costEfficiency}
              onClick={() => setExpandedMetric("costEfficiency")} accent="#D97706"
            />
            <ROIStatCard
              title="Profit Margin" value={formatPercent(current.raw.profitMargin)} metricKey="profitMargin"
              trend={current.changes.profitMargin > 0.5 ? "up" : current.changes.profitMargin < -0.5 ? "down" : "flat"}
              changePercent={current.changes.profitMargin}
              onClick={() => setExpandedMetric("profitMargin")} accent="#8B5CF6"
            />
          </div>
        </>
      )}

      {/* ========== CHART MODAL (expanded metric) ========== */}
      {expandedMetric && monthlyData[expandedMetric] && (
        <ChartModal
          title={metricDefinitions[expandedMetric]?.title || expandedMetric}
          data={monthlyData[expandedMetric]}
          dataKey="value"
          format={
            ["revenue", "adSpend", "totalSpend", "aov", "cac", "ltv"].includes(expandedMetric) ? "currency" :
            ["closeRate", "trafficGrowth", "revenueGrowth", "costEfficiency", "profitMargin"].includes(expandedMetric) ? "percent" :
            "number"
          }
          onClose={() => setExpandedMetric(null)}
          color={primary}
        />
      )}
    </div>
  );
}
