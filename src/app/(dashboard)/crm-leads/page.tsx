"use client";

import useSWR from "swr";
import { format } from "date-fns";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { TrendingUp, TrendingDown, Users, DollarSign, Target, Award } from "lucide-react";
import { useDateRange } from "@/context/date-range-context";
import { useAccount } from "@/context/account-context";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function StatCard({
  label,
  value,
  subtext,
  changePercent,
  icon: Icon,
  format: fmt = "number",
  accentColor,
}: {
  label: string;
  value: number | null;
  subtext?: string;
  changePercent?: number;
  icon: React.ElementType;
  format?: "number" | "currency" | "percent";
  accentColor?: string;
}) {
  const isLoading = value === null;
  const displayValue = isLoading
    ? "—"
    : fmt === "currency"
    ? formatCurrency(value!)
    : fmt === "percent"
    ? formatPercent(value! * 100)
    : formatNumber(value!);

  const trendUp = changePercent !== undefined && changePercent > 0;
  const trendDown = changePercent !== undefined && changePercent < 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className="p-1.5 rounded-lg bg-muted/40">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground" style={accentColor ? { color: accentColor } : undefined}>
          {displayValue}
        </p>
        {subtext && <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>}
      </div>
      {changePercent !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? "text-green-600" : trendDown ? "text-red-500" : "text-muted-foreground"}`}>
          {trendUp ? <TrendingUp className="h-3 w-3" /> : trendDown ? <TrendingDown className="h-3 w-3" /> : null}
          {changePercent > 0 ? "+" : ""}{changePercent.toFixed(1)}% vs prior period
        </div>
      )}
    </div>
  );
}

function FunnelBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{formatNumber(count)} <span className="text-xs">({pct}%)</span></span>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function CRMLeadsPage() {
  const { dateRange } = useDateRange();
  const { apiAccountId, currentAccount } = useAccount();
  const primary = currentAccount.colors.primary;
  const positiveColor = currentAccount.positiveColor;
  const COLORS = currentAccount.chartPalette;

  const startDate = format(dateRange.from, "yyyy-MM-dd");
  const endDate = format(dateRange.to, "yyyy-MM-dd");

  const { data, isLoading } = useSWR(
    `/api/nationwide-haul-crm?startDate=${startDate}&endDate=${endDate}&accountId=${apiAccountId}`,
    fetcher,
    { refreshInterval: 300000, revalidateOnFocus: false }
  );

  const summary = data?.data;
  const leads = summary?.leads;
  const deals = summary?.deals;
  const funnel = summary?.funnel;

  // Build "leads by source" bar chart data
  const bySourceData = leads?.bySource
    ? Object.entries(leads.bySource as Record<string, number>)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    : [];

  // Build "leads by type" data
  const byTypeData = leads?.byType
    ? Object.entries(leads.byType as Record<string, number>)
        .map(([type, count]) => ({ type: type.charAt(0).toUpperCase() + type.slice(1), count }))
        .sort((a, b) => b.count - a.count)
    : [];

  const isLive = data?.status === "live" && summary;

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-bold text-foreground">CRM Leads & Revenue</h2>
        <p className="text-sm text-muted-foreground">Email leads routed by the CRM — sources, pipeline, and deal revenue</p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && data?.status === "error" && (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          <p className="text-sm">{data?.error || "Unable to load CRM data. Check NH_CRM_API_KEY."}</p>
        </div>
      )}

      {isLive && (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <StatCard
              label="Total Leads"
              value={leads?.total ?? null}
              changePercent={leads?.changePercent}
              icon={Users}
              format="number"
              accentColor={primary}
            />
            <StatCard
              label="Closed Won"
              value={deals?.closedWon ?? null}
              subtext={`of ${deals?.total ?? 0} deals`}
              changePercent={deals?.previousClosedWon ? ((deals.closedWon - deals.previousClosedWon) / deals.previousClosedWon) * 100 : undefined}
              icon={Award}
              format="number"
              accentColor={positiveColor}
            />
            <StatCard
              label="Revenue"
              value={deals?.totalRevenue ?? null}
              changePercent={deals?.revenueChangePercent}
              icon={DollarSign}
              format="currency"
            />
            <StatCard
              label="Close Rate"
              value={deals?.closeRate ?? null}
              subtext={`Avg deal: ${formatCurrency(deals?.avgDealValue ?? 0)}`}
              icon={Target}
              format="percent"
            />
          </div>

          {/* Row 2: Leads Over Time + Leads by Source */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Leads Over Time */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-base font-semibold text-foreground mb-3">Leads Over Time</h3>
              {leads?.timeSeries && leads.timeSeries.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={leads.timeSeries}>
                      <defs>
                        <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={primary} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={primary} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(d) => {
                          const dt = new Date(d + "T00:00:00");
                          return `${dt.getMonth() + 1}/${dt.getDate()}`;
                        }}
                        interval="preserveStartEnd"
                      />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", fontSize: 12 }}
                        labelFormatter={(d) => new Date(d + "T00:00:00").toLocaleDateString()}
                        formatter={(v: unknown) => [formatNumber(Number(v)), "Leads"]}
                      />
                      <Area type="monotone" dataKey="value" stroke={primary} fill="url(#leadGrad)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No time series data</div>
              )}
            </div>

            {/* Leads by Source */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-base font-semibold text-foreground mb-3">Leads by Source</h3>
              {bySourceData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bySourceData} layout="vertical" margin={{ left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="source" width={120} tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", fontSize: 12 }}
                        formatter={(v: unknown) => [formatNumber(Number(v)), "Leads"]}
                      />
                      <Bar dataKey="count" name="Leads" radius={[0, 6, 6, 0]} maxBarSize={20}>
                        {bySourceData.map((_, i) => (
                          <rect key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No source data</div>
              )}
            </div>
          </div>

          {/* Row 3: Funnel + Lead Types */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Sales Funnel */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-base font-semibold text-foreground mb-4">Sales Funnel</h3>
              {funnel && (
                <div className="space-y-4">
                  <FunnelBar label="Total Leads" count={funnel.totalLeads} total={funnel.totalLeads} color={primary} />
                  <FunnelBar label="Marketing Qualified (MQL)" count={funnel.mql} total={funnel.totalLeads} color={COLORS[2] || "#D97706"} />
                  <FunnelBar label="Sales Qualified (SQL)" count={funnel.sql} total={funnel.totalLeads} color={COLORS[3] || "#EA580C"} />
                  <FunnelBar label="Closed Won" count={funnel.closedDeals} total={funnel.totalLeads} color={positiveColor} />
                  <div className="pt-2 border-t border-border grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Lead → MQL</p>
                      <p className="font-bold text-sm">{funnel.totalLeads > 0 ? Math.round((funnel.mql / funnel.totalLeads) * 100) : 0}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">MQL → SQL</p>
                      <p className="font-bold text-sm">{funnel.mql > 0 ? Math.round((funnel.sql / funnel.mql) * 100) : 0}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Overall Close</p>
                      <p className="font-bold text-sm">{funnel.totalLeads > 0 ? Math.round((funnel.closedDeals / funnel.totalLeads) * 100) : 0}%</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Leads by Type */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-base font-semibold text-foreground mb-4">Leads by Type</h3>
              {byTypeData.length > 0 ? (
                <div className="space-y-3">
                  {byTypeData.map(({ type, count }, i) => (
                    <div key={type} className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm font-medium text-foreground">{type}</span>
                          <span className="text-sm text-muted-foreground">{formatNumber(count)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${leads?.total ? Math.round((count / leads.total) * 100) : 0}%`,
                              backgroundColor: COLORS[i % COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No type data</div>
              )}

              {/* Revenue trend mini */}
              {deals?.timeSeries && deals.timeSeries.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Revenue Trend</p>
                  <div className="h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={deals.timeSeries}>
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={positiveColor} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={positiveColor} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Tooltip
                          contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", fontSize: 11 }}
                          labelFormatter={(d) => new Date(d + "T00:00:00").toLocaleDateString()}
                          formatter={(v: unknown) => [formatCurrency(Number(v)), "Revenue"]}
                        />
                        <Area type="monotone" dataKey="value" stroke={positiveColor} fill="url(#revGrad)" strokeWidth={1.5} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Row 4: Source breakdown table */}
          {bySourceData.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <h3 className="text-base font-semibold text-foreground">Lead Source Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Source</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Leads</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bySourceData.map(({ source, count }) => (
                      <tr key={source} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-2.5 font-medium text-foreground">{source}</td>
                        <td className="px-4 py-2.5 text-right">{formatNumber(count)}</td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground">
                          {leads?.total ? Math.round((count / leads.total) * 100) : 0}%
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-muted/20">
                      <td className="px-4 py-2.5 font-bold text-foreground">Total</td>
                      <td className="px-4 py-2.5 text-right font-bold">{formatNumber(leads?.total ?? 0)}</td>
                      <td className="px-4 py-2.5 text-right font-bold">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
