"use client";

import { useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { Layers, TrendingUp, TrendingDown, Award, AlertTriangle, Calendar, DollarSign, Phone } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { DataSourceBadge } from "@/components/layout/data-source-badge";
import { externalLinks } from "@/lib/external-links";
import { useAccount } from "@/context/account-context";
import { getPlatformsForAccount, type PlatformData } from "@/lib/inventory-platforms-data";
import { format, differenceInDays, parseISO } from "date-fns";

// Compute current month stats
function getCurrentStats(p: PlatformData) {
  if (p.monthlyData.length === 0) return { calls: 0, infoSubmits: 0, leads: 0, price: p.pricePerMonth, cpl: 0, prevCpl: 0, leadChange: 0 };
  const current = p.monthlyData[p.monthlyData.length - 1];
  const prev = p.monthlyData.length > 1 ? p.monthlyData[p.monthlyData.length - 2] : null;
  const cpl = current.leads > 0 ? current.price / current.leads : 0;
  const prevCpl = prev && prev.leads > 0 ? prev.price / prev.leads : 0;
  const leadChange = prev ? Math.round(((current.leads - prev.leads) / prev.leads) * 100) : 0;
  return { ...current, cpl, prevCpl, leadChange };
}

// ROI ranking
function getROIScores(platforms: PlatformData[]) {
  const stats = platforms.map((p) => ({ name: p.name, ...getCurrentStats(p) }));
  const maxCpl = Math.max(...stats.map((s) => s.cpl));
  return stats.map((s) => ({
    ...s,
    roiScore: maxCpl > 0 ? Math.round((1 - s.cpl / maxCpl) * 100) : 0,
  })).sort((a, b) => b.roiScore - a.roiScore);
}

// Days until renewal
function daysUntilRenewal(renewalDate?: string): number | null {
  if (!renewalDate) return null;
  return differenceInDays(parseISO(renewalDate), new Date());
}

// NHTTR-style view: calls per platform, expandable chart, editable budget, comparison table
function NHTTRPlatformView({ platforms }: { platforms: PlatformData[] }) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, { cost: string; date: string }>>({});

  const totalAnnual = platforms.reduce((sum, p) => sum + (p.annualCost || 0), 0);

  // Get current month calls for each platform
  function getCurrentCalls(p: PlatformData) {
    if (!p.monthlyData.length) return 0;
    return p.monthlyData[p.monthlyData.length - 1].calls;
  }
  function getPrevCalls(p: PlatformData) {
    if (p.monthlyData.length < 2) return 0;
    return p.monthlyData[p.monthlyData.length - 2].calls;
  }

  // Comparison data for all platforms
  const comparisonData = platforms[0]?.monthlyData.length
    ? platforms[0].monthlyData.map((_, i) => {
        const entry: any = { month: platforms[0].monthlyData[i].month }; // eslint-disable-line @typescript-eslint/no-explicit-any
        platforms.forEach((p) => { entry[p.name] = p.monthlyData[i]?.calls || 0; });
        return entry;
      })
    : [];

  const detail = selectedPlatform ? platforms.find((p) => p.name === selectedPlatform) : null;

  return (
    <div>
      {/* Total Budget Banner */}
      <div className="rounded-lg border border-border bg-card p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Annual Budget</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalAnnual)}<span className="text-sm font-normal text-muted-foreground">/year</span></p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-medium">Calls This Month</p>
            <p className="text-2xl font-bold text-foreground">{platforms.reduce((sum, p) => sum + getCurrentCalls(p), 0)}</p>
          </div>
        </div>
      </div>

      {/* Platform Cards -- show calls this month */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {platforms.map((p) => {
          const calls = getCurrentCalls(p);
          const prevCalls = getPrevCalls(p);
          const change = prevCalls > 0 ? Math.round(((calls - prevCalls) / prevCalls) * 100) : 0;
          const daysLeft = daysUntilRenewal(p.renewalDate);
          const isUrgent = daysLeft !== null && daysLeft <= 30;
          const isPast = daysLeft !== null && daysLeft < 0;
          const isSelected = selectedPlatform === p.name;
          const isEditing = editingPlatform === p.name;

          return (
            <div key={p.name} className="flex flex-col">
              <button
                onClick={() => setSelectedPlatform(isSelected ? null : p.name)}
                className={`rounded-lg border p-4 text-left transition-all flex-1 ${
                  isSelected ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border bg-card hover:border-primary/30"
                }`}
              >
                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-sm font-bold text-card-foreground">{p.fullName}</span>
                </div>

                {/* Calls this month -- big number */}
                <div className="flex items-end gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-3xl font-bold text-card-foreground">{calls}</span>
                  </div>
                  <span className="text-xs text-muted-foreground mb-1">calls this month</span>
                </div>
                {prevCalls > 0 && (
                  <div className="flex items-center gap-1 mb-3">
                    {change > 0 ? <TrendingUp className="h-3 w-3 text-green-600" /> : change < 0 ? <TrendingDown className="h-3 w-3 text-red-500" /> : null}
                    <span className={`text-xs ${change > 0 ? "text-green-600" : change < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                      {change > 0 ? "+" : ""}{change}% vs last month
                    </span>
                  </div>
                )}

                {/* Budget & Renewal */}
                <div className="pt-3 border-t border-border space-y-2">
                  {isEditing ? (
                    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Annual Cost</label>
                        <input
                          type="number"
                          value={editValues[p.name]?.cost ?? String(p.annualCost || 0)}
                          onChange={(e) => setEditValues((prev) => ({ ...prev, [p.name]: { ...prev[p.name], cost: e.target.value, date: prev[p.name]?.date ?? p.renewalDate ?? "" } }))}
                          className="w-full px-2 py-1 text-xs border border-border rounded-md bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Renewal Date</label>
                        <input
                          type="date"
                          value={editValues[p.name]?.date ?? p.renewalDate ?? ""}
                          onChange={(e) => setEditValues((prev) => ({ ...prev, [p.name]: { ...prev[p.name], date: e.target.value, cost: prev[p.name]?.cost ?? String(p.annualCost || 0) } }))}
                          className="w-full px-2 py-1 text-xs border border-border rounded-md bg-background"
                        />
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingPlatform(null); }}
                        className="w-full py-1 text-xs bg-primary text-white rounded-md hover:bg-primary/90"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Annual Cost</span>
                        <span className="font-bold">{formatCurrency(p.annualCost || 0)}/yr</span>
                      </div>
                      {p.renewalDate && (
                        <div className={`rounded-md p-2 ${isUrgent || isPast ? (isPast ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200") : "bg-gray-50 border border-gray-200"}`}>
                          <div className="flex items-center gap-1.5">
                            <Calendar className={`h-3 w-3 ${isPast ? "text-red-600" : isUrgent ? "text-amber-600" : "text-gray-500"}`} />
                            <span className={`text-xs font-medium ${isPast ? "text-red-700" : isUrgent ? "text-amber-700" : "text-gray-600"}`}>
                              Renewal: {format(parseISO(p.renewalDate), "MMM d, yyyy")}
                            </span>
                          </div>
                          <p className={`text-[10px] mt-0.5 ${isPast ? "text-red-600" : isUrgent ? "text-amber-600" : "text-gray-500"}`}>
                            {isPast ? "Overdue" : daysLeft !== null ? `${daysLeft} days remaining` : ""}
                          </p>
                        </div>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingPlatform(p.name); }}
                        className="w-full py-1 text-[10px] text-muted-foreground border border-border rounded-md hover:bg-muted transition-colors"
                      >
                        Edit Budget / Renewal
                      </button>
                    </>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Expanded Chart -- shows when a platform is selected */}
      {detail && detail.monthlyData.length > 0 && (
        <div className="rounded-lg border border-primary/20 bg-card p-4 mb-4">
          <h3 className="text-sm font-bold text-card-foreground mb-3">{detail.fullName} -- Calls Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={detail.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="calls" name="Calls" fill={detail.color} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Platform Comparison */}
      {comparisonData.length > 0 && (
        <>
          <div className="rounded-lg border border-border bg-card p-4 mb-4">
            <h3 className="text-sm font-semibold text-card-foreground mb-3">Platform Comparison -- Calls Over Time</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  {platforms.map((p) => (
                    <Line key={p.name} type="monotone" dataKey={p.name} stroke={p.color} strokeWidth={2} dot={{ r: 3 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="rounded-lg border border-border bg-card overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <h3 className="text-sm font-semibold text-card-foreground">Platform Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Platform</th>
                    <th className="px-4 py-2 text-right font-medium text-muted-foreground">Annual Cost</th>
                    <th className="px-4 py-2 text-right font-medium text-muted-foreground">Calls This Month</th>
                    <th className="px-4 py-2 text-right font-medium text-muted-foreground">vs Last Month</th>
                    <th className="px-4 py-2 text-right font-medium text-muted-foreground">Cost Per Call (Annual)</th>
                    <th className="px-4 py-2 text-right font-medium text-muted-foreground">Renewal</th>
                  </tr>
                </thead>
                <tbody>
                  {platforms.map((p) => {
                    const calls = getCurrentCalls(p);
                    const prevCalls = getPrevCalls(p);
                    const change = prevCalls > 0 ? Math.round(((calls - prevCalls) / prevCalls) * 100) : 0;
                    const totalCalls = p.monthlyData.reduce((sum, m) => sum + m.calls, 0);
                    const costPerCall = totalCalls > 0 ? (p.annualCost || 0) / totalCalls : 0;

                    return (
                      <tr key={p.name} className="border-b border-border last:border-0">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="font-medium text-card-foreground">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right">{formatCurrency(p.annualCost || 0)}</td>
                        <td className="px-4 py-2.5 text-right font-bold">{calls}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={change > 0 ? "text-green-600" : change < 0 ? "text-red-500" : "text-muted-foreground"}>
                            {change > 0 ? "+" : ""}{change}%
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-primary">{formatCurrency(costPerCall)}</td>
                        <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                          {p.renewalDate ? format(parseISO(p.renewalDate), "MMM d, yyyy") : "--"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <p className="text-[10px] text-muted-foreground text-center">Call data from CallRail (company: &quot;NH Repair Shops&quot;). Budget and renewal dates are editable.</p>
    </div>
  );
}

// Full platform view with charts and comparison (for NH/NFI)
function FullPlatformView({ platforms }: { platforms: PlatformData[] }) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const hasData = platforms.some((p) => p.monthlyData.length > 0);
  const roiRanking = hasData ? getROIScores(platforms) : [];
  const bestPerformer = roiRanking[0];
  const worstPerformer = roiRanking[roiRanking.length - 1];

  const comparisonData = hasData && platforms[0].monthlyData.length > 0
    ? platforms[0].monthlyData.map((_, i) => {
        const entry: any = { month: platforms[0].monthlyData[i].month }; // eslint-disable-line @typescript-eslint/no-explicit-any
        platforms.forEach((p) => { entry[p.name] = p.monthlyData[i]?.leads || 0; });
        return entry;
      })
    : [];

  const cplComparisonData = hasData && platforms[0].monthlyData.length > 0
    ? platforms[0].monthlyData.map((_, i) => {
        const entry: any = { month: platforms[0].monthlyData[i].month }; // eslint-disable-line @typescript-eslint/no-explicit-any
        platforms.forEach((p) => {
          const d = p.monthlyData[i];
          entry[p.name] = d && d.leads > 0 ? Math.round((d.price / d.leads) * 100) / 100 : 0;
        });
        return entry;
      })
    : [];

  const detail = selectedPlatform ? platforms.find((p) => p.name === selectedPlatform) : null;

  if (!hasData) {
    return (
      <div className="text-center py-12">
        <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Platform data not yet configured for this account.</p>
        <p className="text-xs text-muted-foreground mt-1">Data will appear here once connected to CallRail and CRM.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Top Performers */}
      {bestPerformer && worstPerformer && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-center gap-3">
            <Award className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-xs text-green-600 font-medium">Best ROI This Month</p>
              <p className="text-lg font-bold text-green-800">{bestPerformer.name}</p>
              <p className="text-xs text-green-600">{formatCurrency(bestPerformer.cpl)} per lead -- {bestPerformer.leads} leads -- ROI Score: {bestPerformer.roiScore}/100</p>
            </div>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-xs text-red-500 font-medium">Highest Cost Per Lead</p>
              <p className="text-lg font-bold text-red-800">{worstPerformer.name}</p>
              <p className="text-xs text-red-500">{formatCurrency(worstPerformer.cpl)} per lead -- {worstPerformer.leads} leads -- ROI Score: {worstPerformer.roiScore}/100</p>
            </div>
          </div>
        </div>
      )}

      {/* Platform Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-4">
        {platforms.map((p) => {
          const stats = getCurrentStats(p);
          const isSelected = selectedPlatform === p.name;
          return (
            <button
              key={p.name}
              onClick={() => setSelectedPlatform(isSelected ? null : p.name)}
              className={`rounded-lg border p-4 text-left transition-all ${
                isSelected ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-xs font-medium text-card-foreground truncate">{p.name}</span>
              </div>
              <p className="text-xl font-bold text-card-foreground">{stats.leads} <span className="text-xs font-normal text-muted-foreground">leads</span></p>
              <div className="flex items-center gap-1 mt-1">
                {stats.leadChange > 0 ? <TrendingUp className="h-3 w-3 text-green-600" /> : stats.leadChange < 0 ? <TrendingDown className="h-3 w-3 text-red-500" /> : null}
                <span className={`text-xs ${stats.leadChange > 0 ? "text-green-600" : stats.leadChange < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                  {stats.leadChange > 0 ? "+" : ""}{stats.leadChange}% vs prev
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-border space-y-1">
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Calls</span><span className="font-medium">{stats.calls}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Info Submits</span><span className="font-medium">{stats.infoSubmits}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Cost/Month</span><span className="font-medium">{formatCurrency(stats.price)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Cost/Lead</span><span className="font-bold text-primary">{formatCurrency(stats.cpl)}</span></div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Platform Detail */}
      {detail && detail.monthlyData.length > 0 && (
        <div className="rounded-lg border border-primary/20 bg-card p-4 mb-4">
          <h3 className="text-sm font-bold text-card-foreground mb-3">{detail.fullName} -- Monthly Trend</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-64">
              <p className="text-xs text-muted-foreground mb-2">Leads Over Time</p>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={detail.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="leads" stroke={detail.color} fill={detail.color} fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="h-64">
              <p className="text-xs text-muted-foreground mb-2">Calls vs Info Submits</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={detail.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="calls" name="Calls" fill={detail.color} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="infoSubmits" name="Info Submits" fill={detail.color + "80"} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Charts */}
      {comparisonData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-card-foreground mb-3">Leads by Platform (Monthly)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  {platforms.map((p) => (
                    <Line key={p.name} type="monotone" dataKey={p.name} stroke={p.color} strokeWidth={2} dot={{ r: 3 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-card-foreground mb-3">Cost Per Lead Trend (Monthly)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cplComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: any) => formatCurrency(Number(v))} /> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                  <Legend />
                  {platforms.map((p) => (
                    <Line key={p.name} type="monotone" dataKey={p.name} stroke={p.color} strokeWidth={2} dot={{ r: 3 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Full Platform Comparison Table */}
      {roiRanking.length > 0 && (
        <div className="rounded-lg border border-border bg-card overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <h3 className="text-sm font-semibold text-card-foreground">Platform Comparison</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Platform</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Price/Mo</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Calls</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Info Submits</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Total Leads</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Cost/Lead</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">vs Prev Month</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">ROI Score</th>
                </tr>
              </thead>
              <tbody>
                {roiRanking.map((s, i) => (
                  <tr key={s.name} className={`border-b border-border last:border-0 ${i === 0 ? "bg-green-50" : ""}`}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: platforms.find((p) => p.name === s.name)?.color }} />
                        <span className="font-medium text-card-foreground">{s.name}</span>
                        {i === 0 && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Best</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">{formatCurrency(s.price)}</td>
                    <td className="px-4 py-2.5 text-right">{s.calls}</td>
                    <td className="px-4 py-2.5 text-right">{s.infoSubmits}</td>
                    <td className="px-4 py-2.5 text-right font-bold">{s.leads}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-primary">{formatCurrency(s.cpl)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={s.leadChange > 0 ? "text-green-600" : s.leadChange < 0 ? "text-red-500" : "text-muted-foreground"}>
                        {s.leadChange > 0 ? "+" : ""}{s.leadChange}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${s.roiScore}%` }} />
                        </div>
                        <span className="text-xs font-medium">{s.roiScore}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground text-center">Data source: Google Sheet (Fleet Sales List). Will be connected to CRM + CallRail for live data.</p>
    </div>
  );
}

export default function InventoryPlatformsPage() {
  const { currentAccount } = useAccount();
  const platforms = getPlatformsForAccount(currentAccount.id);
  const isNHTTR = currentAccount.id === "nhttr";

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-foreground">Inventory Platforms</h2>
        <p className="text-sm text-muted-foreground">
          {isNHTTR
            ? "Breakdown service listings -- budget tracking and call performance"
            : "ROI analysis per listing platform -- calls, info submits, cost per lead"
          }
        </p>
        <DataSourceBadge sources={externalLinks["/inventory-platforms"] || []} />
      </div>

      {isNHTTR ? (
        <NHTTRPlatformView platforms={platforms} />
      ) : (
        <FullPlatformView platforms={platforms} />
      )}
    </div>
  );
}
