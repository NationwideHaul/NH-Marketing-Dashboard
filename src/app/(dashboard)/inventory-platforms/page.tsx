"use client";

import { useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { Layers, TrendingUp, TrendingDown, Award, AlertTriangle } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { DataSourceBadge } from "@/components/layout/data-source-badge";
import { externalLinks } from "@/lib/external-links";

// ===== PLATFORM DATA (from Google Sheet — will be replaced by CRM + CallRail) =====
const platforms = [
  {
    name: "NH Website",
    fullName: "Nationwide Haul Website",
    color: "#BE1E23",
    pricePerMonth: 195,
    monthlyData: [
      { month: "Sep 25", calls: 72, infoSubmits: 23, leads: 95, price: 195 },
      { month: "Oct 25", calls: 93, infoSubmits: 23, leads: 116, price: 195 },
      { month: "Nov 25", calls: 68, infoSubmits: 25, leads: 93, price: 195 },
      { month: "Dec 25", calls: 43, infoSubmits: 32, leads: 75, price: 195 },
      { month: "Jan 26", calls: 67, infoSubmits: 38, leads: 105, price: 195 },
      { month: "Feb 26", calls: 83, infoSubmits: 46, leads: 129, price: 195 },
      { month: "Mar 26", calls: 113, infoSubmits: 19, leads: 132, price: 195 },
    ],
  },
  {
    name: "TruckPaper",
    fullName: "Truck Paper General Ad",
    color: "#8C0F14",
    pricePerMonth: 6800,
    monthlyData: [
      { month: "Sep 25", calls: 74, infoSubmits: 52, leads: 126, price: 6800 },
      { month: "Oct 25", calls: 109, infoSubmits: 36, leads: 145, price: 6800 },
      { month: "Nov 25", calls: 60, infoSubmits: 30, leads: 90, price: 6800 },
      { month: "Dec 25", calls: 78, infoSubmits: 45, leads: 123, price: 6800 },
      { month: "Jan 26", calls: 91, infoSubmits: 59, leads: 150, price: 6800 },
      { month: "Feb 26", calls: 81, infoSubmits: 53, leads: 134, price: 6800 },
      { month: "Mar 26", calls: 107, infoSubmits: 60, leads: 167, price: 6800 },
    ],
  },
  {
    name: "My Little Salesman",
    fullName: "My Little Salesman",
    color: "#2563EB",
    pricePerMonth: 895,
    monthlyData: [
      { month: "Sep 25", calls: 4, infoSubmits: 4, leads: 8, price: 895 },
      { month: "Oct 25", calls: 10, infoSubmits: 4, leads: 14, price: 895 },
      { month: "Nov 25", calls: 8, infoSubmits: 2, leads: 10, price: 895 },
      { month: "Dec 25", calls: 7, infoSubmits: 5, leads: 12, price: 895 },
      { month: "Jan 26", calls: 8, infoSubmits: 11, leads: 19, price: 895 },
      { month: "Feb 26", calls: 7, infoSubmits: 6, leads: 13, price: 895 },
      { month: "Mar 26", calls: 11, infoSubmits: 8, leads: 19, price: 895 },
    ],
  },
  {
    name: "Commercial Truck Trader",
    fullName: "Commercial Truck Trader",
    color: "#16A34A",
    pricePerMonth: 1200,
    monthlyData: [
      { month: "Sep 25", calls: 12, infoSubmits: 8, leads: 20, price: 1200 },
      { month: "Oct 25", calls: 15, infoSubmits: 10, leads: 25, price: 1200 },
      { month: "Nov 25", calls: 9, infoSubmits: 6, leads: 15, price: 1200 },
      { month: "Dec 25", calls: 11, infoSubmits: 7, leads: 18, price: 1200 },
      { month: "Jan 26", calls: 14, infoSubmits: 9, leads: 23, price: 1200 },
      { month: "Feb 26", calls: 13, infoSubmits: 8, leads: 21, price: 1200 },
      { month: "Mar 26", calls: 16, infoSubmits: 11, leads: 27, price: 1200 },
    ],
  },
  {
    name: "Cherry Trader",
    fullName: "Cherry Trader",
    color: "#D97706",
    pricePerMonth: 500,
    monthlyData: [
      { month: "Sep 25", calls: 3, infoSubmits: 2, leads: 5, price: 500 },
      { month: "Oct 25", calls: 5, infoSubmits: 3, leads: 8, price: 500 },
      { month: "Nov 25", calls: 4, infoSubmits: 2, leads: 6, price: 500 },
      { month: "Dec 25", calls: 3, infoSubmits: 1, leads: 4, price: 500 },
      { month: "Jan 26", calls: 6, infoSubmits: 3, leads: 9, price: 500 },
      { month: "Feb 26", calls: 4, infoSubmits: 2, leads: 6, price: 500 },
      { month: "Mar 26", calls: 7, infoSubmits: 4, leads: 11, price: 500 },
    ],
  },
];

// Compute current month (last entry) stats
function getCurrentStats(p: typeof platforms[0]) {
  const current = p.monthlyData[p.monthlyData.length - 1];
  const prev = p.monthlyData[p.monthlyData.length - 2];
  const cpl = current.leads > 0 ? current.price / current.leads : 0;
  const prevCpl = prev && prev.leads > 0 ? prev.price / prev.leads : 0;
  const leadChange = prev ? Math.round(((current.leads - prev.leads) / prev.leads) * 100) : 0;
  return { ...current, cpl, prevCpl, leadChange };
}

// ROI Score: lower CPL = better, normalized 0-100
function getROIScores() {
  const stats = platforms.map((p) => ({ name: p.name, ...getCurrentStats(p) }));
  const maxCpl = Math.max(...stats.map((s) => s.cpl));
  return stats.map((s) => ({
    ...s,
    roiScore: maxCpl > 0 ? Math.round((1 - s.cpl / maxCpl) * 100) : 0,
  })).sort((a, b) => b.roiScore - a.roiScore);
}

export default function InventoryPlatformsPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const roiRanking = getROIScores();
  const bestPerformer = roiRanking[0];
  const worstPerformer = roiRanking[roiRanking.length - 1];

  // Comparison data for all platforms
  const comparisonData = platforms[0].monthlyData.map((_, i) => {
    const entry: any = { month: platforms[0].monthlyData[i].month }; // eslint-disable-line @typescript-eslint/no-explicit-any
    platforms.forEach((p) => { entry[p.name] = p.monthlyData[i]?.leads || 0; });
    return entry;
  });

  const cplComparisonData = platforms[0].monthlyData.map((_, i) => {
    const entry: any = { month: platforms[0].monthlyData[i].month }; // eslint-disable-line @typescript-eslint/no-explicit-any
    platforms.forEach((p) => {
      const d = p.monthlyData[i];
      entry[p.name] = d && d.leads > 0 ? Math.round((d.price / d.leads) * 100) / 100 : 0;
    });
    return entry;
  });

  const detail = selectedPlatform ? platforms.find((p) => p.name === selectedPlatform) : null;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-foreground">Inventory Platforms</h2>
        <p className="text-sm text-muted-foreground">ROI analysis per listing platform — calls, info submits, cost per lead</p>
        <DataSourceBadge sources={externalLinks["/inventory-platforms"] || []} />
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-center gap-3">
          <Award className="h-8 w-8 text-green-600" />
          <div>
            <p className="text-xs text-green-600 font-medium">Best ROI This Month</p>
            <p className="text-lg font-bold text-green-800">{bestPerformer.name}</p>
            <p className="text-xs text-green-600">{formatCurrency(bestPerformer.cpl)} per lead · {bestPerformer.leads} leads · ROI Score: {bestPerformer.roiScore}/100</p>
          </div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <div>
            <p className="text-xs text-red-500 font-medium">Highest Cost Per Lead</p>
            <p className="text-lg font-bold text-red-800">{worstPerformer.name}</p>
            <p className="text-xs text-red-500">{formatCurrency(worstPerformer.cpl)} per lead · {worstPerformer.leads} leads · ROI Score: {worstPerformer.roiScore}/100</p>
          </div>
        </div>
      </div>

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

      {/* Platform Detail (when clicked) */}
      {detail && (
        <div className="rounded-lg border border-primary/20 bg-card p-4 mb-4">
          <h3 className="text-sm font-bold text-card-foreground mb-3">{detail.fullName} — Monthly Trend</h3>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Leads by Platform Over Time */}
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

        {/* Cost Per Lead Trend */}
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

      {/* Full Platform Comparison Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <h3 className="text-sm font-semibold text-card-foreground">Platform Comparison — March 2026</h3>
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

      <p className="text-[10px] text-muted-foreground text-center">Data source: Google Sheet (Fleet Sales List). Will be connected to CRM + CallRail for live data.</p>
    </div>
  );
}
