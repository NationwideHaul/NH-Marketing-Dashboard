"use client";

import { useState, useEffect } from "react";
import { Wallet, Pencil, Check } from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { DataSourceBadge } from "@/components/layout/data-source-badge";
import { externalLinks } from "@/lib/external-links";

const COLORS = ["#BE1E23", "#8C0F14", "#2563EB", "#16A34A", "#D97706", "#7C3AED", "#DB2777", "#0891B2"];

const STORAGE_KEY = "nh-budget-allocations-v1";

interface BudgetRow {
  platform: string;
  budget: number;
  spent: number; // Real spend from APIs or manual
  category: "advertising" | "platform" | "tools";
}

// Default budgets — user can edit these
const defaultBudgets: BudgetRow[] = [
  { platform: "Google Ads", budget: 5000, spent: 0, category: "advertising" },
  { platform: "Meta Ads", budget: 7500, spent: 0, category: "advertising" },
  { platform: "TruckPaper", budget: 6800, spent: 6800, category: "platform" },
  { platform: "My Little Salesman", budget: 895, spent: 895, category: "platform" },
  { platform: "Commercial Truck Trader", budget: 1200, spent: 1200, category: "platform" },
  { platform: "Cherry Trader", budget: 500, spent: 500, category: "platform" },
  { platform: "NH Website", budget: 195, spent: 195, category: "platform" },
  { platform: "Go High Level", budget: 297, spent: 297, category: "tools" },
  { platform: "RingCentral", budget: 450, spent: 450, category: "tools" },
  { platform: "CallRail", budget: 145, spent: 145, category: "tools" },
];

function loadBudgets(): BudgetRow[] {
  if (typeof window === "undefined") return defaultBudgets;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch { return defaultBudgets; }
  }
  return defaultBudgets;
}

function saveBudgets(budgets: BudgetRow[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
}

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<BudgetRow[]>(defaultBudgets);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editBudget, setEditBudget] = useState<string>("");
  const [editSpent, setEditSpent] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setBudgets(loadBudgets());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveBudgets(budgets);
  }, [budgets, loaded]);

  const totalBudget = budgets.reduce((s, b) => s + b.budget, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  const adSpend = budgets.filter((b) => b.category === "advertising").reduce((s, b) => s + b.spent, 0);
  const platformSpend = budgets.filter((b) => b.category === "platform").reduce((s, b) => s + b.spent, 0);
  const toolsSpend = budgets.filter((b) => b.category === "tools").reduce((s, b) => s + b.spent, 0);

  const pieData = budgets.filter((b) => b.spent > 0).map((b, i) => ({
    name: b.platform, value: b.spent, fill: COLORS[i % COLORS.length],
  }));

  const barData = budgets.map((b) => ({
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

  if (!loaded) return null;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Wallet className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-lg font-bold text-foreground">Budget Overview</h2>
          <p className="text-sm text-muted-foreground">Monthly spend tracking — click the pencil to edit any row</p>
          <DataSourceBadge sources={externalLinks["/budget"] || []} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Budget</p>
          <p className="text-xl font-bold text-card-foreground">{formatCurrency(totalBudget)}</p>
        </div>
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
          <p className="text-xs text-muted-foreground">Platforms</p>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(platformSpend)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Remaining</p>
          <p className={`text-xl font-bold ${totalRemaining >= 0 ? "text-green-600" : "text-red-500"}`}>{formatCurrency(totalRemaining)}</p>
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
          <h3 className="text-sm font-semibold text-card-foreground mb-3">Budget vs Spent</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="platform" width={120} tick={{ fontSize: 9 }} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Legend />
                <Bar dataKey="budget" name="Budget" fill="#E5E5E5" radius={[0, 2, 2, 0]} />
                <Bar dataKey="spent" name="Spent" fill="#BE1E23" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Editable Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <h3 className="text-sm font-semibold text-card-foreground">Budget Breakdown — click ✏️ to edit</h3>
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
                <th className="px-4 py-2 text-center font-medium text-muted-foreground w-10"></th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((b, i) => {
                const remaining = b.budget - b.spent;
                const pacing = b.budget > 0 ? Math.round((b.spent / b.budget) * 100) : 0;
                const isEditing = editingIdx === i;

                return (
                  <tr key={b.platform} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="font-medium text-card-foreground">{b.platform}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        b.category === "advertising" ? "bg-red-100 text-red-700" :
                        b.category === "platform" ? "bg-blue-100 text-blue-700" :
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
                      {isEditing ? (
                        <input type="number" value={editSpent} onChange={(e) => setEditSpent(e.target.value)}
                          className="w-24 px-2 py-1 text-xs border border-primary rounded text-right" />
                      ) : formatCurrency(b.spent)}
                    </td>
                    <td className={`px-4 py-2.5 text-right ${remaining >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {formatCurrency(remaining)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-14 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{
                            width: `${Math.min(100, pacing)}%`,
                            backgroundColor: pacing > 100 ? "#EF4444" : pacing > 90 ? "#D97706" : "#16A34A",
                          }} />
                        </div>
                        <span className="text-xs w-8 text-right">{pacing}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {isEditing ? (
                        <button onClick={saveEdit} className="p-1 rounded hover:bg-green-100">
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        </button>
                      ) : (
                        <button onClick={() => startEdit(i)} className="p-1 rounded hover:bg-muted">
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      )}
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
