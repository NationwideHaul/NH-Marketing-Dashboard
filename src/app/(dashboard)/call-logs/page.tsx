"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { format, subDays } from "date-fns";
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area,
} from "recharts";
import { Phone, PhoneIncoming, PhoneMissed, Clock, TrendingUp, Users, Filter } from "lucide-react";
import { useDateRange } from "@/context/date-range-context";
import { useAccount } from "@/context/account-context";
import { formatNumber, formatPercent } from "@/lib/utils";
import { DataSourceBadge } from "@/components/layout/data-source-badge";
import { externalLinks } from "@/lib/external-links";

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const COLORS = ["#BE1E23", "#8C0F14", "#2563EB", "#16A34A", "#D97706", "#7C3AED", "#DB2777", "#0891B2", "#65A30D", "#DC2626"];

function StatCard({ icon: Icon, label, value, subtitle, color = "text-card-foreground" }: {
  icon: any; label: string; value: string | number; subtitle?: string; color?: string; // eslint-disable-line @typescript-eslint/no-explicit-any
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}

export default function CallLogsPage() {
  const { dateRange } = useDateRange();
  const { currentAccount } = useAccount();
  const startDate = format(dateRange.from, "yyyy-MM-dd");
  const endDate = format(dateRange.to, "yyyy-MM-dd");

  const { data, isLoading } = useSWR(
    `/api/call-logs?startDate=${startDate}&endDate=${endDate}&accountId=${currentAccount.id}`,
    fetcher,
    { refreshInterval: 300000, revalidateOnFocus: false }
  );

  const cr = data?.data?.callrail;
  const isLive = cr && !cr.error;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-foreground">Call Logs</h2>
        <p className="text-sm text-muted-foreground">CallRail marketing attribution + RingCentral call volume</p>
        <DataSourceBadge sources={externalLinks["/call-logs"] || []} />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {isLive && (
        <>
          {/* Row 1: Key Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-4">
            <StatCard icon={Phone} label="Total Calls" value={formatNumber(cr.totalCalls)} />
            <StatCard icon={PhoneIncoming} label="Answered" value={formatNumber(cr.answered)} color="text-green-600" />
            <StatCard icon={PhoneMissed} label="Missed" value={formatNumber(cr.missed)} color="text-red-500" />
            <StatCard icon={TrendingUp} label="Answer Rate" value={formatPercent(cr.answerRate)} />
            <StatCard icon={Clock} label="Avg. Duration" value={`${cr.avgDuration}s`} />
            <StatCard icon={Users} label="First-Time Callers" value={formatNumber(cr.firstTimeCalls)} />
          </div>

          {/* Row 1.5: Funnel + Missed Rate */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-card-foreground mb-3">Efficiency Funnel</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Calls</span>
                  <span className="font-bold">{cr.totalCalls}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full"><div className="h-full bg-blue-500 rounded-full" style={{ width: "100%" }} /></div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Answered</span>
                  <span className="font-bold text-green-600">{cr.answered}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full"><div className="h-full bg-green-500 rounded-full" style={{ width: `${cr.totalCalls > 0 ? (cr.answered / cr.totalCalls) * 100 : 0}%` }} /></div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Qualified (30s+)</span>
                  <span className="font-bold text-primary">{cr.qualifiedCalls}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full"><div className="h-full bg-primary rounded-full" style={{ width: `${cr.totalCalls > 0 ? (cr.qualifiedCalls / cr.totalCalls) * 100 : 0}%` }} /></div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-card-foreground mb-3">Missed Call Rate</h3>
              <p className="text-4xl font-bold text-red-500">{cr.missedCallRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">{cr.missed} of {cr.totalCalls} calls missed</p>
              <div className="mt-3 w-full h-3 bg-muted rounded-full">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${cr.missedCallRate}%` }} />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-card-foreground mb-3">Lead Quality</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Qualified Leads (30s+)</p>
                  <p className="text-xl font-bold text-primary">{cr.qualifiedCalls}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Qualification Rate</p>
                  <p className="text-xl font-bold">{cr.totalCalls > 0 ? Math.round((cr.qualifiedCalls / cr.totalCalls) * 100) : 0}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Lead Attribution Chart + Calls by Day */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Lead Attribution by Source */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-card-foreground mb-3">Lead Attribution by Source</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cr.bySource?.slice(0, 10)} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="source" width={130} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="answered" name="Answered" fill="#16A34A" stackId="a" radius={[0, 2, 2, 0]} />
                    <Bar dataKey="missed" name="Missed" fill="#EF4444" stackId="a" radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Calls by Day of Week */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-card-foreground mb-3">Calls by Day of Week</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cr.byDayOfWeek}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="repeat" name="Repeat Calls" fill="#2563EB" stackId="a" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="firstTime" name="First-Time Calls" fill="#16A34A" stackId="a" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 3: Source Breakdown Pie + Call Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Source Pie */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-card-foreground mb-3">Calls by Source (Distribution)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={cr.bySource?.slice(0, 8).map((s: any, i: number) => ({ name: s.source, value: s.total, fill: COLORS[i % COLORS.length] }))} // eslint-disable-line @typescript-eslint/no-explicit-any
                      cx="50%" cy="50%" innerRadius="35%" outerRadius="65%" paddingAngle={2} dataKey="value"
                    >
                      {cr.bySource?.slice(0, 8).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {cr.bySource?.slice(0, 8).map((s: any, i: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                  <div key={s.source} className="flex items-center gap-1 text-[10px]">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span>{s.source}: {s.total}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Calls by Hour */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-card-foreground mb-3">Calls by Hour of Day</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cr.byHour}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip labelFormatter={(h) => `${h}:00 - ${h}:59`} />
                    <Area type="monotone" dataKey="count" stroke="#BE1E23" fill="#BE1E23" fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 4: Source Attribution Table */}
          <div className="rounded-lg border border-border bg-card overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <h3 className="text-sm font-semibold text-card-foreground">Lead Source Attribution</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Source</th>
                    <th className="px-4 py-2 text-right font-medium text-muted-foreground">Total</th>
                    <th className="px-4 py-2 text-right font-medium text-muted-foreground">Answered</th>
                    <th className="px-4 py-2 text-right font-medium text-muted-foreground">Qualified (30s+)</th>
                    <th className="px-4 py-2 text-right font-medium text-muted-foreground">Missed</th>
                    <th className="px-4 py-2 text-right font-medium text-muted-foreground">Answer Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {cr.bySource?.map((s: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <tr key={s.source} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-medium text-card-foreground">{s.source}</td>
                      <td className="px-4 py-2.5 text-right">{s.total}</td>
                      <td className="px-4 py-2.5 text-right text-green-600">{s.answered}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-primary">{s.qualified}</td>
                      <td className="px-4 py-2.5 text-right text-red-500">{s.missed}</td>
                      <td className="px-4 py-2.5 text-right">
                        {s.total > 0 ? Math.round((s.answered / s.total) * 100) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Calls removed per user request */}
        </>
      )}

      {!isLoading && !isLive && (
        <div className="text-center py-12 text-muted-foreground">
          <Phone className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No call data available. Check your CallRail and RingCentral API credentials.</p>
        </div>
      )}
    </div>
  );
}
