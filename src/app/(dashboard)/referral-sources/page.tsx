"use client";

import { useState, useEffect, useMemo } from "react";
import { Link2, Pencil, Check, Plus, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { cn, formatNumber, formatCurrency } from "@/lib/utils";
import { useAccount } from "@/context/account-context";

const STORAGE_KEY_PREFIX = "nh-referral-sources-";

interface ReferralRow {
  source: string;
  type: "agent" | "broker" | "partner" | "website" | "direct" | "other";
  leadsThisMonth: number;
  leadsLastMonth: number;
  closedDeals: number;
  revenue: number;
}

// Default referral data for Road Ready Insurance
const defaultReferrals: ReferralRow[] = [
  { source: "Nationwide Haul Dealership", type: "partner", leadsThisMonth: 42, leadsLastMonth: 38, closedDeals: 18, revenue: 14400 },
  { source: "NFI Truck Sales", type: "partner", leadsThisMonth: 28, leadsLastMonth: 25, closedDeals: 12, revenue: 9600 },
  { source: "NHTTR Service & Repair", type: "partner", leadsThisMonth: 15, leadsLastMonth: 12, closedDeals: 6, revenue: 4800 },
  { source: "Road Ready Website (Organic)", type: "website", leadsThisMonth: 35, leadsLastMonth: 30, closedDeals: 8, revenue: 6400 },
  { source: "Google Ads Landing Page", type: "website", leadsThisMonth: 22, leadsLastMonth: 18, closedDeals: 5, revenue: 4000 },
  { source: "Meta Ads (Facebook/IG)", type: "website", leadsThisMonth: 18, leadsLastMonth: 14, closedDeals: 4, revenue: 3200 },
  { source: "Independent Agent Network", type: "agent", leadsThisMonth: 12, leadsLastMonth: 10, closedDeals: 5, revenue: 4000 },
  { source: "Commercial Fleet Brokers", type: "broker", leadsThisMonth: 8, leadsLastMonth: 6, closedDeals: 3, revenue: 2400 },
  { source: "Word of Mouth / Direct", type: "direct", leadsThisMonth: 10, leadsLastMonth: 8, closedDeals: 4, revenue: 3200 },
  { source: "Insurance Marketplace Listings", type: "other", leadsThisMonth: 6, leadsLastMonth: 5, closedDeals: 2, revenue: 1600 },
];

function loadReferrals(accountId: string): ReferralRow[] {
  if (typeof window === "undefined") return defaultReferrals;
  const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${accountId}`);
  if (saved) {
    try { return JSON.parse(saved); } catch { /* fall through */ }
  }
  return defaultReferrals;
}

function saveReferrals(accountId: string, data: ReferralRow[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${accountId}`, JSON.stringify(data));
}

const typeColors: Record<string, string> = {
  partner: "bg-blue-100 text-blue-700",
  agent: "bg-purple-100 text-purple-700",
  broker: "bg-amber-100 text-amber-700",
  website: "bg-green-100 text-green-700",
  direct: "bg-gray-100 text-gray-600",
  other: "bg-slate-100 text-slate-600",
};

export default function ReferralSourcesPage() {
  const { currentAccount } = useAccount();
  const COLORS = currentAccount.chartPalette;
  const primary = currentAccount.colors.primary;
  const positiveColor = currentAccount.positiveColor;

  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editFields, setEditFields] = useState({ leadsThisMonth: "", leadsLastMonth: "", closedDeals: "", revenue: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [newRow, setNewRow] = useState<ReferralRow>({
    source: "", type: "partner", leadsThisMonth: 0, leadsLastMonth: 0, closedDeals: 0, revenue: 0,
  });

  useEffect(() => {
    setReferrals(loadReferrals(currentAccount.id));
    setLoaded(true);
    setEditingIdx(null);
    setShowAdd(false);
  }, [currentAccount.id]);

  useEffect(() => {
    if (loaded) saveReferrals(currentAccount.id, referrals);
  }, [referrals, loaded, currentAccount.id]);

  const totals = useMemo(() => {
    const leadsThis = referrals.reduce((s, r) => s + r.leadsThisMonth, 0);
    const leadsLast = referrals.reduce((s, r) => s + r.leadsLastMonth, 0);
    const closed = referrals.reduce((s, r) => s + r.closedDeals, 0);
    const revenue = referrals.reduce((s, r) => s + r.revenue, 0);
    const changeLeads = leadsLast > 0 ? ((leadsThis - leadsLast) / leadsLast) * 100 : 0;
    const closeRate = leadsThis > 0 ? (closed / leadsThis) * 100 : 0;
    return { leadsThis, leadsLast, closed, revenue, changeLeads, closeRate };
  }, [referrals]);

  const pieData = referrals.filter((r) => r.leadsThisMonth > 0).map((r, i) => ({
    name: r.source, value: r.leadsThisMonth, fill: COLORS[i % COLORS.length],
  }));

  const barData = referrals.map((r) => ({
    source: r.source.length > 20 ? r.source.slice(0, 18) + "..." : r.source,
    leads: r.leadsThisMonth,
    closed: r.closedDeals,
  }));

  // Group by type for summary
  const byType = useMemo(() => {
    const map: Record<string, { leads: number; closed: number; revenue: number }> = {};
    for (const r of referrals) {
      if (!map[r.type]) map[r.type] = { leads: 0, closed: 0, revenue: 0 };
      map[r.type].leads += r.leadsThisMonth;
      map[r.type].closed += r.closedDeals;
      map[r.type].revenue += r.revenue;
    }
    return Object.entries(map).sort((a, b) => b[1].leads - a[1].leads);
  }, [referrals]);

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditFields({
      leadsThisMonth: String(referrals[idx].leadsThisMonth),
      leadsLastMonth: String(referrals[idx].leadsLastMonth),
      closedDeals: String(referrals[idx].closedDeals),
      revenue: String(referrals[idx].revenue),
    });
  };

  const saveEdit = () => {
    if (editingIdx === null) return;
    const updated = [...referrals];
    updated[editingIdx] = {
      ...updated[editingIdx],
      leadsThisMonth: parseInt(editFields.leadsThisMonth) || 0,
      leadsLastMonth: parseInt(editFields.leadsLastMonth) || 0,
      closedDeals: parseInt(editFields.closedDeals) || 0,
      revenue: parseFloat(editFields.revenue) || 0,
    };
    setReferrals(updated);
    setEditingIdx(null);
  };

  const deleteRow = (idx: number) => setReferrals((prev) => prev.filter((_, i) => i !== idx));

  const addRow = () => {
    if (!newRow.source.trim()) return;
    setReferrals((prev) => [...prev, { ...newRow, source: newRow.source.trim() }]);
    setNewRow({ source: "", type: "partner", leadsThisMonth: 0, leadsLastMonth: 0, closedDeals: 0, revenue: 0 });
    setShowAdd(false);
  };

  const resetToDefaults = () => {
    setReferrals(defaultReferrals);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${currentAccount.id}`);
  };

  if (!loaded) return null;

  const leadsChangeTrend = totals.changeLeads > 0.5 ? "up" : totals.changeLeads < -0.5 ? "down" : "flat";
  const TrendIcon = leadsChangeTrend === "up" ? TrendingUp : leadsChangeTrend === "down" ? TrendingDown : Minus;

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-center gap-4">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <Link2 className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Referral Sources</h2>
          <p className="text-sm text-muted-foreground">Track where your insurance leads come from</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Leads (This Month)</p>
          <p className="text-2xl font-bold" style={{ color: primary }}>{formatNumber(totals.leadsThis)}</p>
          <div className="flex items-center gap-1 mt-1">
            <TrendIcon className={cn("h-3 w-3",
              leadsChangeTrend === "up" && "text-emerald-500",
              leadsChangeTrend === "down" && "text-red-500",
              leadsChangeTrend === "flat" && "text-muted-foreground"
            )} />
            <span className={cn("text-[11px] font-medium",
              leadsChangeTrend === "up" && "text-emerald-500",
              leadsChangeTrend === "down" && "text-red-500",
            )}>
              {totals.changeLeads > 0 ? "+" : ""}{totals.changeLeads.toFixed(1)}% vs last month
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Closed Deals</p>
          <p className="text-2xl font-bold" style={{ color: positiveColor }}>{formatNumber(totals.closed)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Close Rate</p>
          <p className="text-2xl font-bold text-foreground">{totals.closeRate.toFixed(1)}%</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold" style={{ color: primary }}>{formatCurrency(totals.revenue)}</p>
        </div>
      </div>

      {/* By Type Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {byType.map(([type, data]) => (
          <div key={type} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize ${typeColors[type] || typeColors.other}`}>{type}</span>
            </div>
            <p className="text-lg font-bold text-foreground">{formatNumber(data.leads)} <span className="text-xs font-normal text-muted-foreground">leads</span></p>
            <p className="text-[11px] text-muted-foreground">{data.closed} closed &middot; {formatCurrency(data.revenue)}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">Leads by Source</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius="40%" outerRadius="70%" paddingAngle={2} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [formatNumber(Number(v)), "Leads"]} contentStyle={{ fontFamily: "var(--font-geist-sans), sans-serif", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1 text-[10px]">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {d.name.length > 22 ? d.name.slice(0, 20) + "..." : d.name}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">Leads vs Closed Deals</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10, fontFamily: "var(--font-geist-sans), sans-serif" }} />
                <YAxis type="category" dataKey="source" width={130} tick={{ fontSize: 9, fontFamily: "var(--font-geist-sans), sans-serif" }} />
                <Tooltip contentStyle={{ fontFamily: "var(--font-geist-sans), sans-serif", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontFamily: "var(--font-geist-sans), sans-serif", fontSize: 12 }} />
                <Bar dataKey="leads" name="Leads" fill={primary} radius={[0, 4, 4, 0]} />
                <Bar dataKey="closed" name="Closed" fill={positiveColor} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Editable Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-card-foreground">Referral Source Breakdown</h3>
          <div className="flex items-center gap-2">
            <button onClick={resetToDefaults} className="text-[10px] px-2 py-1 rounded border border-border text-muted-foreground hover:bg-muted transition-colors">
              Reset to defaults
            </button>
            <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded text-white transition-colors" style={{ backgroundColor: primary }}>
              <Plus className="h-3 w-3" /> Add Source
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Source</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Leads (This Mo.)</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Leads (Last Mo.)</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Change</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Closed</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Revenue</th>
                <th className="px-4 py-2 text-center font-medium text-muted-foreground w-16"></th>
              </tr>
            </thead>
            <tbody>
              {showAdd && (
                <tr className="border-b border-border bg-primary/5">
                  <td className="px-4 py-2">
                    <input type="text" value={newRow.source} onChange={(e) => setNewRow({ ...newRow, source: e.target.value })}
                      placeholder="Source name" className="w-full px-2 py-1 text-xs border border-primary/30 rounded" autoFocus />
                  </td>
                  <td className="px-4 py-2">
                    <select value={newRow.type} onChange={(e) => setNewRow({ ...newRow, type: e.target.value as ReferralRow["type"] })}
                      className="text-[10px] px-1.5 py-1 border border-primary/30 rounded">
                      <option value="partner">partner</option>
                      <option value="agent">agent</option>
                      <option value="broker">broker</option>
                      <option value="website">website</option>
                      <option value="direct">direct</option>
                      <option value="other">other</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <input type="number" value={newRow.leadsThisMonth || ""} onChange={(e) => setNewRow({ ...newRow, leadsThisMonth: parseInt(e.target.value) || 0 })}
                      className="w-16 px-2 py-1 text-xs border border-primary/30 rounded text-right" />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <input type="number" value={newRow.leadsLastMonth || ""} onChange={(e) => setNewRow({ ...newRow, leadsLastMonth: parseInt(e.target.value) || 0 })}
                      className="w-16 px-2 py-1 text-xs border border-primary/30 rounded text-right" />
                  </td>
                  <td className="px-4 py-2 text-right text-muted-foreground text-xs">--</td>
                  <td className="px-4 py-2 text-right">
                    <input type="number" value={newRow.closedDeals || ""} onChange={(e) => setNewRow({ ...newRow, closedDeals: parseInt(e.target.value) || 0 })}
                      className="w-16 px-2 py-1 text-xs border border-primary/30 rounded text-right" />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <input type="number" value={newRow.revenue || ""} onChange={(e) => setNewRow({ ...newRow, revenue: parseFloat(e.target.value) || 0 })}
                      className="w-20 px-2 py-1 text-xs border border-primary/30 rounded text-right" />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button onClick={addRow} className="p-1 rounded hover:bg-muted"><Check className="h-3.5 w-3.5 text-primary" /></button>
                  </td>
                </tr>
              )}
              {referrals.map((r, i) => {
                const change = r.leadsLastMonth > 0 ? ((r.leadsThisMonth - r.leadsLastMonth) / r.leadsLastMonth) * 100 : 0;
                const isEditing = editingIdx === i;
                return (
                  <tr key={`${r.source}-${i}`} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="font-medium text-card-foreground">{r.source}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${typeColors[r.type] || typeColors.other}`}>{r.type}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium" style={{ color: primary }}>
                      {isEditing ? (
                        <input type="number" value={editFields.leadsThisMonth} onChange={(e) => setEditFields({ ...editFields, leadsThisMonth: e.target.value })}
                          className="w-16 px-2 py-1 text-xs border border-primary rounded text-right" autoFocus />
                      ) : r.leadsThisMonth}
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">
                      {isEditing ? (
                        <input type="number" value={editFields.leadsLastMonth} onChange={(e) => setEditFields({ ...editFields, leadsLastMonth: e.target.value })}
                          className="w-16 px-2 py-1 text-xs border border-primary rounded text-right" />
                      ) : r.leadsLastMonth}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={cn("text-xs font-medium",
                        change > 0 && "text-emerald-500",
                        change < 0 && "text-red-500",
                        change === 0 && "text-muted-foreground"
                      )}>
                        {change > 0 ? "+" : ""}{change.toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {isEditing ? (
                        <input type="number" value={editFields.closedDeals} onChange={(e) => setEditFields({ ...editFields, closedDeals: e.target.value })}
                          className="w-16 px-2 py-1 text-xs border border-primary rounded text-right" />
                      ) : <span style={{ color: positiveColor }}>{r.closedDeals}</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium">
                      {isEditing ? (
                        <input type="number" value={editFields.revenue} onChange={(e) => setEditFields({ ...editFields, revenue: e.target.value })}
                          className="w-20 px-2 py-1 text-xs border border-primary rounded text-right" />
                      ) : formatCurrency(r.revenue)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {isEditing ? (
                          <button onClick={saveEdit} className="p-1 rounded hover:bg-muted"><Check className="h-3.5 w-3.5 text-primary" /></button>
                        ) : (
                          <>
                            <button onClick={() => startEdit(i)} className="p-1 rounded hover:bg-muted"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
                            <button onClick={() => deleteRow(i)} className="p-1 rounded hover:bg-red-50"><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
