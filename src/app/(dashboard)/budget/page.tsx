"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Wallet, Pencil, Check, Plus, Trash2, Zap } from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { DataSourceBadge } from "@/components/layout/data-source-badge";
import { externalLinks } from "@/lib/external-links";
import { useAccount } from "@/context/account-context";
import { useDateRange } from "@/context/date-range-context";
import { useBudget } from "@/context/budget-context";

// Fetches live ad-spend totals for the selected date range so the budget table
// can override its stored `spent` value on advertising rows with real numbers
// from Google Ads and Meta Ads.
//
// Returns a map keyed by normalized platform label:
//   "google ads"              -> total for the primary account
//   "google ads (rv repair)"  -> NHTTR sub-account nhttr-rv
//   "google ads (ttr)"        -> NHTTR sub-account nhttr-ttr
//   "meta ads"                -> Meta ads account insights
function useLiveAdSpend(accountId: string, startDate: string, endDate: string) {
  const [spend, setSpend] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchGoogle = async (acct: string): Promise<number> => {
      try {
        const r = await fetch(`/api/google-ads?startDate=${startDate}&endDate=${endDate}&accountId=${acct}`);
        const res = await r.json();
        if (res.status !== "live") return 0;
        const rows = Array.isArray(res.data)
          ? res.data.flatMap((r: { results?: unknown[] }) => r.results ?? [])
          : res.data?.results ?? [];
        let micros = 0;
        for (const row of rows as { metrics?: { costMicros?: string } }[]) {
          micros += parseInt(row.metrics?.costMicros ?? "0", 10);
        }
        return micros / 1_000_000;
      } catch { return 0; }
    };

    const fetchMeta = async (acct: string): Promise<number> => {
      try {
        const r = await fetch(`/api/meta-ads?type=ads&startDate=${startDate}&endDate=${endDate}&accountId=${acct}`);
        const res = await r.json();
        if (res.status !== "live") return 0;
        const rows: Array<{ spend?: string }> = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
        return rows.reduce((sum, row) => sum + parseFloat(row.spend ?? "0"), 0);
      } catch { return 0; }
    };

    const tasks: Promise<[string, number]>[] = [];

    if (accountId === "nhttr") {
      tasks.push(fetchGoogle("nhttr-rv").then((v) => ["google ads (rv repair)", v] as [string, number]));
      tasks.push(fetchGoogle("nhttr-ttr").then((v) => ["google ads (ttr)", v] as [string, number]));
    } else {
      tasks.push(fetchGoogle(accountId).then((v) => ["google ads", v] as [string, number]));
    }

    // Only accounts that actually run Meta ads — skip NFI and NHTTR.
    if (accountId === "nationwide-haul" || accountId === "road-ready") {
      tasks.push(fetchMeta(accountId).then((v) => ["meta ads", v] as [string, number]));
    }

    Promise.all(tasks).then((pairs) => {
      if (cancelled) return;
      const next: Record<string, number> = {};
      for (const [k, v] of pairs) next[k] = v;
      setSpend(next);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [accountId, startDate, endDate]);

  return { spend, loading };
}

export default function BudgetPage() {
  const { currentAccount } = useAccount();
  const { dateRange } = useDateRange();
  const startStr = format(dateRange.from, "yyyy-MM-dd");
  const endStr = format(dateRange.to, "yyyy-MM-dd");
  const { spend: liveSpend, loading: liveLoading } = useLiveAdSpend(currentAccount.id, startStr, endStr);
  const COLORS = currentAccount.chartPalette;
  const positiveColor = currentAccount.positiveColor;
  const primary = currentAccount.colors.primary;
  // Budgets live in the shared BudgetProvider so edits here propagate to other
  // tabs (e.g. Inventory Platforms cost-per-lead) in the same window.
  const { budgets, setBudgets, resetToDefaults, loaded } = useBudget();
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editBudget, setEditBudget] = useState<string>("");
  const [editSpent, setEditSpent] = useState<string>("");

  // Adding new row
  const [showAdd, setShowAdd] = useState(false);
  const [newPlatform, setNewPlatform] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [newSpent, setNewSpent] = useState("");
  const [newCategory, setNewCategory] = useState<"advertising" | "platform" | "tools">("advertising");

  // Reset transient edit UI when the account changes (budgets themselves are
  // loaded + persisted by the BudgetProvider).
  useEffect(() => {
    setEditingIdx(null);
    setShowAdd(false);
  }, [currentAccount.id]);

  // Merge live ad-spend into the stored rows: advertising rows matching a
  // tracked platform (Google Ads, Meta Ads, NHTTR splits) get their `spent`
  // replaced with the live value for the selected date range. Everything else
  // keeps the manually edited value from localStorage.
  const displayBudgets = useMemo(() => {
    return budgets.map((b) => {
      if (b.category !== "advertising") return b;
      const liveKey = b.platform.toLowerCase().trim();
      if (liveKey in liveSpend) {
        return { ...b, spent: liveSpend[liveKey], _live: true as const };
      }
      return b;
    });
  }, [budgets, liveSpend]);

  const totalBudget = displayBudgets.reduce((s, b) => s + b.budget, 0);
  const totalSpent = displayBudgets.reduce((s, b) => s + b.spent, 0);

  const adSpend = displayBudgets.filter((b) => b.category === "advertising").reduce((s, b) => s + b.spent, 0);
  const platformSpend = displayBudgets.filter((b) => b.category === "platform").reduce((s, b) => s + b.spent, 0);
  const toolsSpend = displayBudgets.filter((b) => b.category === "tools").reduce((s, b) => s + b.spent, 0);

  const pieData = displayBudgets.filter((b) => b.spent > 0).map((b, i) => ({
    name: b.platform, value: b.spent, fill: COLORS[i % COLORS.length],
  }));

  const barData = displayBudgets.map((b) => ({
    platform: b.platform, budget: b.budget, spent: b.spent,
  }));

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditBudget(String(budgets[idx].budget));
    setEditSpent(String(budgets[idx].spent));
  };

  const saveEdit = () => {
    if (editingIdx === null) return;
    const updated = [...budgets];
    updated[editingIdx] = {
      ...updated[editingIdx],
      budget: parseFloat(editBudget) || 0,
      spent: parseFloat(editSpent) || 0,
    };
    setBudgets(updated);
    setEditingIdx(null);
  };

  const deleteRow = (idx: number) => {
    setBudgets((prev) => prev.filter((_, i) => i !== idx));
  };

  const addRow = () => {
    if (!newPlatform.trim()) return;
    setBudgets((prev) => [
      ...prev,
      {
        platform: newPlatform.trim(),
        budget: parseFloat(newBudget) || 0,
        spent: parseFloat(newSpent) || 0,
        category: newCategory,
      },
    ]);
    setNewPlatform("");
    setNewBudget("");
    setNewSpent("");
    setNewCategory("advertising");
    setShowAdd(false);
  };

  if (!loaded) return null;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Wallet className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-lg font-bold text-foreground">Budget Overview</h2>
          <p className="text-sm text-muted-foreground">Monthly advertising spend tracking &mdash; {currentAccount.name}</p>
          <DataSourceBadge sources={externalLinks["/budget"] || []} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Spent</p>
          <p className="text-xl font-bold text-primary">{formatCurrency(totalSpent)}</p>
          <p className="text-[10px] text-muted-foreground">{totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% of budget</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Advertising</p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(adSpend)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Platforms & Tools</p>
          <p className="text-xl font-bold" style={{ color: COLORS[2] }}>{formatCurrency(platformSpend + toolsSpend)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">Spend Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius="40%" outerRadius="70%" paddingAngle={2} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1 text-[10px]">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">Spend by Platform</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="platform" width={120} tick={{ fontSize: 9 }} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Legend />
                <Bar dataKey="budget" name="Budget" fill="#E5E5E5" radius={[0, 2, 2, 0]} />
                <Bar dataKey="spent" name="Spent" fill={primary} radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Editable Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-card-foreground">Advertising Budget Breakdown</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={resetToDefaults}
              className="text-[10px] px-2 py-1 rounded border border-border text-muted-foreground hover:bg-muted transition-colors"
            >
              Reset to defaults
            </button>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded text-white transition-colors"
              style={{ backgroundColor: primary }}
            >
              <Plus className="h-3 w-3" />
              Add Row
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Platform</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Budget</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Spent</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Remaining</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Pacing</th>
                <th className="px-4 py-2 text-center font-medium text-muted-foreground w-16"></th>
              </tr>
            </thead>
            <tbody>
              {/* Add new row form */}
              {showAdd && (
                <tr className="border-b border-border bg-primary/5">
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={newPlatform}
                      onChange={(e) => setNewPlatform(e.target.value)}
                      placeholder="Platform name"
                      className="w-full px-2 py-1 text-xs border border-primary/30 rounded"
                      autoFocus
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as "advertising" | "platform" | "tools")}
                      className="text-[10px] px-1.5 py-1 border border-primary/30 rounded"
                    >
                      <option value="advertising">advertising</option>
                      <option value="platform">platform</option>
                      <option value="tools">tools</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <input
                      type="number"
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                      placeholder="0"
                      className="w-20 px-2 py-1 text-xs border border-primary/30 rounded text-right"
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <input
                      type="number"
                      value={newSpent}
                      onChange={(e) => setNewSpent(e.target.value)}
                      placeholder="0"
                      className="w-20 px-2 py-1 text-xs border border-primary/30 rounded text-right"
                    />
                  </td>
                  <td className="px-4 py-2 text-right text-muted-foreground text-xs">—</td>
                  <td className="px-4 py-2 text-right text-muted-foreground text-xs">—</td>
                  <td className="px-4 py-2 text-center">
                    <button onClick={addRow} className="p-1 rounded hover:bg-muted">
                      <Check className="h-3.5 w-3.5 text-primary" />
                    </button>
                  </td>
                </tr>
              )}
              {displayBudgets.map((b, i) => {
                const remaining = b.budget - b.spent;
                const pacing = b.budget > 0 ? Math.round((b.spent / b.budget) * 100) : 0;
                const isEditing = editingIdx === i;
                const isLive = (b as { _live?: boolean })._live === true;

                return (
                  <tr key={`${b.platform}-${i}`} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="font-medium text-card-foreground">{b.platform}</span>
                        {isLive && (
                          <span title="Live from API for the selected date range" className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                            <Zap className="h-2.5 w-2.5" /> Live
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        b.category === "advertising" ? "bg-red-100 text-red-700" :
                        b.category === "platform" ? "bg-orange-100 text-orange-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>{b.category}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {isEditing ? (
                        <input type="number" value={editBudget} onChange={(e) => setEditBudget(e.target.value)}
                          className="w-24 px-2 py-1 text-xs border border-primary rounded text-right" autoFocus />
                      ) : formatCurrency(b.budget)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-primary">
                      {isEditing && !isLive ? (
                        <input type="number" value={editSpent} onChange={(e) => setEditSpent(e.target.value)}
                          className="w-24 px-2 py-1 text-xs border border-primary rounded text-right" />
                      ) : (
                        <span className={isLive && liveLoading ? "opacity-50" : undefined}>
                          {formatCurrency(b.spent)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right" style={{ color: remaining >= 0 ? positiveColor : "#EF4444" }}>
                      {formatCurrency(remaining)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-14 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{
                            width: `${Math.min(100, pacing)}%`,
                            backgroundColor: pacing > 100 ? "#EF4444" : pacing > 90 ? "#D97706" : positiveColor,
                          }} />
                        </div>
                        <span className="text-xs w-8 text-right">{pacing}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {isEditing ? (
                          <button onClick={saveEdit} className="p-1 rounded hover:bg-muted">
                            <Check className="h-3.5 w-3.5 text-primary" />
                          </button>
                        ) : (
                          <>
                            <button onClick={() => startEdit(i)} className="p-1 rounded hover:bg-muted">
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                            <button onClick={() => deleteRow(i)} className="p-1 rounded hover:bg-red-50">
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
                            </button>
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
