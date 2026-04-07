"use client";

import { useMemo } from "react";
import { Wallet } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useDateRange } from "@/context/date-range-context";
import { getKPIMetrics } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

const COLORS = ["#BE1E23", "#8C0F14", "#2563EB", "#16A34A", "#D97706", "#7C3AED", "#DB2777"];

const budgetAllocations = [
  { platform: "Google Ads", budget: 10000, key: "google-ads", metricKey: "spend" },
  { platform: "Meta Ads", budget: 7500, key: "meta-ads", metricKey: "spend" },
  { platform: "LinkedIn Ads", budget: 5000, key: "linkedin", metricKey: "adSpend" },
  { platform: "RingCentral", budget: 500, key: "ringcentral", metricKey: null },
  { platform: "Go High Level", budget: 300, key: "go-high-level", metricKey: null },
];

export default function BudgetPage() {
  const { dateRange } = useDateRange();

  const budgetData = useMemo(() => {
    return budgetAllocations.map((b, i) => {
      let spent = 0;
      if (b.metricKey) {
        const metrics = getKPIMetrics(b.key, dateRange);
        const metric = metrics.find((m) => m.id === b.metricKey);
        spent = metric?.value ?? 0;
      } else {
        spent = b.budget * 0.7; // estimate for non-ad platforms
      }
      return {
        ...b,
        spent: Math.round(spent),
        remaining: Math.max(0, b.budget - Math.round(spent)),
        pacing: Math.round((spent / b.budget) * 100),
        fill: COLORS[i % COLORS.length],
      };
    });
  }, [dateRange]);

  const totalBudget = budgetData.reduce((sum, b) => sum + b.budget, 0);
  const totalSpent = budgetData.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  const pieData = budgetData.map((b) => ({
    name: b.platform,
    value: b.spent,
    fill: b.fill,
  }));

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Wallet className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Budget Overview</h2>
          <p className="text-sm text-muted-foreground">Spend tracking and budget pacing per platform</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total Budget</p>
          <p className="mt-1 text-2xl font-bold text-card-foreground">{formatCurrency(totalBudget)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total Spent</p>
          <p className="mt-1 text-2xl font-bold text-primary">{formatCurrency(totalSpent)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{Math.round((totalSpent / totalBudget) * 100)}% of budget</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Remaining</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{formatCurrency(totalRemaining)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Spend by Platform Pie */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-card-foreground mb-4">Spend by Platform</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>

        {/* Budget vs Spent Bar */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-card-foreground mb-4">Budget vs Spent</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="platform" width={100} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="budget" name="Budget" fill="#E5E5E5" radius={[0, 2, 2, 0]} />
                <Bar dataKey="spent" name="Spent" fill="#BE1E23" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/50">
          <h3 className="text-sm font-medium text-card-foreground">Budget Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Platform</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Budget</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Spent</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Remaining</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Pacing</th>
              </tr>
            </thead>
            <tbody>
              {budgetData.map((b) => (
                <tr key={b.platform} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: b.fill }} />
                      <span className="font-medium text-card-foreground">{b.platform}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">{formatCurrency(b.budget)}</td>
                  <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(b.spent)}</td>
                  <td className="px-4 py-2.5 text-right text-green-600">{formatCurrency(b.remaining)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, b.pacing)}%`,
                            backgroundColor: b.pacing > 90 ? "#EF4444" : b.pacing > 70 ? "#D97706" : "#16A34A",
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8">{b.pacing}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
