"use client";

import { useMemo, useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Sparkles, RefreshCw } from "lucide-react";
import { subMonths } from "date-fns";
import { useDateRange } from "@/context/date-range-context";
import { KPICard } from "@/components/dashboard/kpi-card";
import { ComparisonTable } from "@/components/charts/comparison-table";
import { getKPIMetrics, getPlatformMonthly } from "@/lib/mock-data";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { KPIMetric } from "@/types/kpi";

const COLORS = ["#BE1E23", "#8C0F14", "#2563EB", "#16A34A", "#D97706", "#7C3AED", "#DB2777"];

const platforms = [
  { key: "google-analytics", label: "Google Analytics", spendKey: null },
  { key: "google-ads", label: "Google Ads", spendKey: "spend" },
  { key: "gmb", label: "GMB", spendKey: null },
  { key: "facebook", label: "Facebook", spendKey: null },
  { key: "instagram", label: "Instagram", spendKey: null },
  { key: "youtube", label: "YouTube", spendKey: null },
  { key: "meta-ads", label: "Meta Ads", spendKey: "spend" },
  { key: "ringcentral", label: "RingCentral", spendKey: null },
  { key: "go-high-level", label: "Go High Level", spendKey: null },
  { key: "linkedin", label: "LinkedIn", spendKey: "adSpend" },
];

function generateAISummary(metrics: KPIMetric[]): string {
  const totalLeads = metrics.find((m) => m.id === "totalLeads");
  const totalSpend = metrics.find((m) => m.id === "totalSpend");
  const cpl = metrics.find((m) => m.id === "costPerLead");
  const calls = metrics.find((m) => m.id === "phoneCalls");

  const highlights: string[] = [];

  if (totalLeads && totalLeads.trend === "up") {
    highlights.push(`Lead generation is trending upward at ${totalLeads.value} total leads (+${totalLeads.changePercent}% vs previous period). This indicates strong campaign performance across channels.`);
  }

  if (cpl && cpl.trend === "down") {
    highlights.push(`Cost per lead improved to ${formatCurrency(cpl.value)}, down ${Math.abs(cpl.changePercent ?? 0)}%. This efficiency gain means more leads for less spend.`);
  } else if (cpl && cpl.trend === "up") {
    highlights.push(`Cost per lead increased to ${formatCurrency(cpl.value)} (+${cpl.changePercent}%). Consider reviewing underperforming campaigns to optimize spend.`);
  }

  if (calls && calls.trend === "up") {
    highlights.push(`Phone calls are up ${calls.changePercent}% to ${calls.value} total calls. Strong indicator of high-intent prospects reaching out directly.`);
  }

  if (totalSpend) {
    highlights.push(`Total marketing spend for the period is ${formatCurrency(totalSpend.value)}. Monitor budget pacing in the Budget tab to ensure alignment with monthly targets.`);
  }

  highlights.push("Key opportunities: Focus on scaling top-performing Meta Ads campaigns, optimize Google Ads keywords with high CTR, and continue building YouTube content for long-term organic growth.");

  return highlights.join("\n\n");
}

export default function OverviewPage() {
  const { dateRange, comparison } = useDateRange();
  const [aiSummary, setAiSummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Aggregate KPIs across platforms
  const overviewMetrics = useMemo(() => {
    let totalLeads = 0, totalSpend = 0, totalClicks = 0, totalImpressions = 0;
    let totalCalls = 0, totalEmails = 0, totalVideoViews = 0;
    let prevLeads = 0, prevSpend = 0, prevClicks = 0, prevImpressions = 0;

    const compRange = comparison.enabled ? comparison.range : null;

    for (const p of platforms) {
      const metrics = getKPIMetrics(p.key, dateRange, compRange);
      for (const m of metrics) {
        if (m.id === "conversions" || m.id === "leads") { totalLeads += m.value; prevLeads += m.previousValue ?? 0; }
        if (m.id === "spend" || m.id === "adSpend") { totalSpend += m.value; prevSpend += m.previousValue ?? 0; }
        if (m.id === "clicks") { totalClicks += m.value; prevClicks += m.previousValue ?? 0; }
        if (m.id === "impressions") { totalImpressions += m.value; prevImpressions += m.previousValue ?? 0; }
        if (m.id === "totalCalls") { totalCalls += m.value; }
        if (m.id === "emailsSent") { totalEmails += m.value; }
        if (m.id === "views" && p.key === "youtube") { totalVideoViews += m.value; }
      }
    }

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0;

    const pct = (curr: number, prev: number) => prev ? Math.round(((curr - prev) / prev) * 1000) / 10 : 0;
    const trend = (p: number): "up" | "down" | "flat" => p > 1 ? "up" : p < -1 ? "down" : "flat";

    const leadsChange = pct(totalLeads, prevLeads);
    const spendChange = pct(totalSpend, prevSpend);
    const clicksChange = pct(totalClicks, prevClicks);
    const impressionsChange = pct(totalImpressions, prevImpressions);

    const result: KPIMetric[] = [
      { id: "totalLeads", label: "Total Leads", value: totalLeads, format: "number", trend: trend(leadsChange), changePercent: leadsChange },
      { id: "totalSpend", label: "Total Spend", value: totalSpend, format: "currency", trend: trend(spendChange), changePercent: spendChange },
      { id: "totalClicks", label: "Total Clicks", value: totalClicks, format: "number", trend: trend(clicksChange), changePercent: clicksChange },
      { id: "totalImpressions", label: "Total Impressions", value: totalImpressions, format: "number", trend: trend(impressionsChange), changePercent: impressionsChange },
      { id: "ctr", label: "Overall CTR", value: Math.round(ctr * 100) / 100, format: "percent", trend: "flat", changePercent: 0 },
      { id: "costPerLead", label: "Cost Per Lead", value: Math.round(cpl), format: "currency", trend: trend(-pct(cpl, 0)), changePercent: 0 },
      { id: "phoneCalls", label: "Phone Calls", value: totalCalls, format: "number", trend: "up", changePercent: 15.3 },
      { id: "emailsSent", label: "Emails Sent", value: totalEmails, format: "number", trend: "flat", changePercent: 0.5 },
      { id: "videoViews", label: "Video Views", value: totalVideoViews, format: "number", trend: "up", changePercent: 28.4 },
    ];

    return result;
  }, [dateRange, comparison]);

  // Spend by platform for pie chart
  const spendByPlatform = useMemo(() => {
    return [
      { name: "Google Ads", value: getKPIMetrics("google-ads", dateRange).find((m) => m.id === "spend")?.value ?? 0, fill: COLORS[0] },
      { name: "Meta Ads", value: getKPIMetrics("meta-ads", dateRange).find((m) => m.id === "spend")?.value ?? 0, fill: COLORS[1] },
      { name: "LinkedIn", value: getKPIMetrics("linkedin", dateRange).find((m) => m.id === "adSpend")?.value ?? 0, fill: COLORS[2] },
    ];
  }, [dateRange]);

  // Monthly traffic trend
  const trafficTrend = useMemo(() => {
    const gaMonthly = getPlatformMonthly("google-analytics", subMonths(dateRange.from, 5), dateRange.to);
    return (gaMonthly.sessions || []).map((p) => ({ date: p.date, sessions: p.value }));
  }, [dateRange]);

  // Generate AI summary
  useEffect(() => {
    setSummaryLoading(true);
    const timer = setTimeout(() => {
      setAiSummary(generateAISummary(overviewMetrics));
      setSummaryLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [overviewMetrics]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Overview</h2>
        <p className="text-sm text-muted-foreground">All platforms at a glance</p>
      </div>

      {/* AI Summary */}
      <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-primary">AI Performance Summary</h3>
          <button
            onClick={() => {
              setSummaryLoading(true);
              setTimeout(() => {
                setAiSummary(generateAISummary(overviewMetrics));
                setSummaryLoading(false);
              }, 800);
            }}
            className="ml-auto p-1 rounded hover:bg-primary/10 transition-colors"
            title="Regenerate summary"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-primary ${summaryLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
        {summaryLoading ? (
          <div className="space-y-2">
            <div className="h-3 w-3/4 rounded bg-primary/10 animate-pulse" />
            <div className="h-3 w-full rounded bg-primary/10 animate-pulse" />
            <div className="h-3 w-2/3 rounded bg-primary/10 animate-pulse" />
          </div>
        ) : (
          <div className="text-sm text-card-foreground leading-relaxed whitespace-pre-line">{aiSummary}</div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {overviewMetrics.map((metric) => (
          <KPICard key={metric.id} id={metric.id} label={metric.label} value={metric.value} format={metric.format} trend={metric.trend} changePercent={metric.changePercent} previousValue={metric.previousValue} />
        ))}
      </div>

      {/* Comparison Table */}
      {comparison.enabled && (
        <div className="mb-6">
          <ComparisonTable metrics={overviewMetrics} />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Trend */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-card-foreground mb-4">Website Traffic Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={50} />
                <Tooltip formatter={(value) => formatNumber(Number(value))} />
                <Area type="monotone" dataKey="sessions" stroke="#BE1E23" fill="#BE1E23" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spend by Platform */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-card-foreground mb-4">Ad Spend by Platform</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={spendByPlatform}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {spendByPlatform.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 justify-center mt-2">
            {spendByPlatform.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                <span>{d.name}: {formatCurrency(d.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leads by Source */}
        <div className="rounded-lg border border-border bg-card p-4 lg:col-span-2">
          <h3 className="text-sm font-medium text-card-foreground mb-4">Leads by Source</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { source: "Google Ads", leads: getKPIMetrics("google-ads", dateRange).find((m) => m.id === "conversions")?.value ?? 0 },
                  { source: "Meta Ads", leads: getKPIMetrics("meta-ads", dateRange).find((m) => m.id === "conversions")?.value ?? 0 },
                  { source: "LinkedIn", leads: getKPIMetrics("linkedin", dateRange).find((m) => m.id === "leads")?.value ?? 0 },
                  { source: "Organic", leads: getKPIMetrics("google-analytics", dateRange).find((m) => m.id === "conversions")?.value ?? 0 },
                  { source: "Phone", leads: getKPIMetrics("ringcentral", dateRange).find((m) => m.id === "totalCalls")?.value ?? 0 },
                  { source: "Email", leads: getKPIMetrics("go-high-level", dateRange).find((m) => m.id === "newContacts")?.value ?? 0 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="source" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={40} />
                <Tooltip />
                <Bar dataKey="leads" name="Leads" fill="#BE1E23" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
