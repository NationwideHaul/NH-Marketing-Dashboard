"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { Layers, TrendingUp, TrendingDown, Award, AlertTriangle, Calendar, DollarSign, Phone, RefreshCw, Pencil } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { DataSourceBadge } from "@/components/layout/data-source-badge";
import { externalLinks } from "@/lib/external-links";
import { useAccount } from "@/context/account-context";
import { useBudget } from "@/context/budget-context";
import { useDateRange } from "@/context/date-range-context";
import { getPlatformsForAccount, type PlatformData } from "@/lib/inventory-platforms-data";
import { format as fmtDate, differenceInDays, parseISO } from "date-fns";

/* ------------------------------------------------------------------ */
/*  Hook: fetch live CRM info-submit data per platform per month      */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  CallRail tracker_name → platform mapping                          */
/* ------------------------------------------------------------------ */

const TRACKER_TO_PLATFORM: [string, string][] = [
  ["Truck Paper", "TruckPaper"],
  ["Commercial Truck Trader", "Commercial Truck Trader"],
  ["My Little Salesman", "My Little Salesman"],
  ["Cherry Trader", "Cherry Trader"],
  ["Sleeper Trader", "Sleeper Trader"],
  ["NH Website", "NH Website"],
  ["Main Nationwide Haul Website", "NH Website"],
  ["Nationwide Haul.com", "NH Website"],
  ["NH Listing Details", "NH Website"],
  ["Nationwide Haul Inventory", "NH Website"],
  ["Ritchie List", "RitchieList"],
  ["Next Truck Online", "Next Truck Online"],
  ["Machinio", "Machinio"],
  ["Trucker to Trucker", "Trucker to Trucker"],
];

function trackerToPlatform(trackerName: string): string | null {
  for (const [pattern, platform] of TRACKER_TO_PLATFORM) {
    if (trackerName.includes(pattern)) return platform;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Hooks: fetch CRM info submits + CallRail calls                    */
/* ------------------------------------------------------------------ */

interface MonthBucket {
  monthKey: string; // "YYYY-MM"
  monthLabel: string; // "MMM yy"
  byPlatform: Record<string, { calls: number; infoSubmits: number }>;
}

interface LivePlatformData {
  infoSubmits: Record<string, number>; // range totals per platform
  calls: Record<string, number>;       // range totals per platform
  monthly: MonthBucket[];              // per-month, per-platform calls + info submits
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function monthLabelFromKey(key: string): string {
  const [y, m] = key.split("-");
  return `${MONTH_NAMES[parseInt(m, 10) - 1] || m} ${(y || "").slice(2)}`;
}

function useLivePlatformData(
  accountId: string,
  startDate: string,
  endDate: string,
  platforms: PlatformData[],
) {
  const [data, setData] = useState<LivePlatformData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // NH/NFI pull info submits from the Sales CRM (channel=info-submit, by lead
    // source) + calls from CallRail. NHTTR pulls ONLY calls from CallRail.
    const supported =
      accountId === "nationwide-haul" ||
      accountId === "nhttr" ||
      accountId === "nfi-truck-sales";
    if (!supported) return;

    let cancelled = false;
    setLoading(true);

    const crmPromise = accountId === "nationwide-haul" || accountId === "nfi-truck-sales"
      ? fetch(`/api/inventory-platform-leads?startDate=${startDate}&endDate=${endDate}&accountId=${accountId}`)
          .then((r) => r.json())
          .catch(() => null)
      : Promise.resolve(null);
    // Raw calls (not the summary) so we can bucket by month + tracker.
    const callPromise = fetch(`/api/callrail?type=calls&startDate=${startDate}&endDate=${endDate}&accountId=${accountId}`)
      .then((r) => r.json())
      .catch(() => null);

    Promise.all([crmPromise, callPromise]).then(([crmRes, callRes]) => {
      if (cancelled) return;

      const months = new Map<string, MonthBucket>();
      const ensureMonth = (key: string, label: string) => {
        let b = months.get(key);
        if (!b) { b = { monthKey: key, monthLabel: label, byPlatform: {} }; months.set(key, b); }
        return b;
      };
      const ensurePlat = (b: MonthBucket, plat: string) => {
        if (!b.byPlatform[plat]) b.byPlatform[plat] = { calls: 0, infoSubmits: 0 };
        return b.byPlatform[plat];
      };

      // Info submits per month per platform (CRM returns one entry per month).
      const infoSubmits: Record<string, number> = {};
      if (crmRes?.status === "live" && Array.isArray(crmRes.data)) {
        for (const entry of crmRes.data) {
          const key = entry.monthKey || (entry.month ?? "");
          const bucket = ensureMonth(key, entry.month || monthLabelFromKey(key));
          const byPlatform = entry.byPlatform || entry.infoSubmitsByPlatform || {};
          for (const [platform, count] of Object.entries(byPlatform)) {
            infoSubmits[platform] = (infoSubmits[platform] || 0) + (count as number);
            ensurePlat(bucket, platform).infoSubmits += count as number;
          }
        }
      }

      // Calls per month per platform, from raw CallRail calls (source_name +
      // start_time). Match each call's source to a platform the same way the
      // tracker breakdown does.
      const calls: Record<string, number> = {};
      const rawCalls = callRes?.status === "live" ? (callRes.data?.calls ?? []) : [];
      for (const call of rawCalls) {
        const src: string = call.source_name || "";
        const direct = platforms.find((p) => p.trackerName && src.includes(p.trackerName));
        const platformName = direct?.name ?? trackerToPlatform(src);
        if (!platformName) continue;
        calls[platformName] = (calls[platformName] || 0) + 1;
        const key = String(call.start_time || call.created_at || "").slice(0, 7);
        if (!/^\d{4}-\d{2}$/.test(key)) continue;
        ensurePlat(ensureMonth(key, monthLabelFromKey(key)), platformName).calls += 1;
      }

      const monthly = Array.from(months.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
      setData({ infoSubmits, calls, monthly });
    }).finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [accountId, startDate, endDate, platforms]);

  return { data, loading };
}

/** Merge live data into platform cards */
function mergePlatformsWithLive(
  platforms: PlatformData[],
  liveData: LivePlatformData | null,
): PlatformData[] {
  if (!liveData) return platforms;

  return platforms.map((p) => {
    const infoSubmits = liveData.infoSubmits[p.name] || 0;
    const calls = liveData.calls[p.name] || 0;
    const leads = calls + infoSubmits;
    const price = p.pricePerMonth;

    // Keep existing monthly data for charts, update latest month with live totals
    const monthlyData = p.monthlyData.length > 0 ? [...p.monthlyData] : [];
    // Replace or add a "Current" entry as the latest month
    const currentEntry = { month: "Current", calls, infoSubmits, leads, price };
    if (monthlyData.length > 0) {
      monthlyData[monthlyData.length - 1] = currentEntry;
    } else {
      monthlyData.push(currentEntry);
    }

    return { ...p, monthlyData };
  });
}

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

// ROI ranking — platforms with 0 leads get worst score (they cost money but produce nothing)
function getROIScores(platforms: PlatformData[]) {
  const stats = platforms.map((p) => ({ name: p.name, ...getCurrentStats(p) }));
  // For CPL comparison, platforms with 0 leads get a very high CPL (worst case)
  const effectiveCpl = stats.map((s) => s.leads > 0 ? s.cpl : Infinity);
  const finiteCpls = effectiveCpl.filter((c) => isFinite(c));
  const maxCpl = finiteCpls.length > 0 ? Math.max(...finiteCpls) : 1;
  return stats.map((s) => ({
    ...s,
    roiScore: s.leads === 0 ? 0 : (maxCpl > 0 ? Math.round((1 - s.cpl / maxCpl) * 100) : 0),
  })).sort((a, b) => b.roiScore - a.roiScore);
}

// Days until renewal
function daysUntilRenewal(renewalDate?: string): number | null {
  if (!renewalDate) return null;
  return differenceInDays(parseISO(renewalDate), new Date());
}

// NHTTR-style view: calls per platform, expandable chart, editable budget, comparison table
function NHTTRPlatformView({ platforms: rawPlatforms, monthly }: { platforms: PlatformData[]; monthly: MonthBucket[] }) {
  const { currentAccount } = useAccount();

  // Load persistent annual cost + renewal date overrides from localStorage
  const overrideStorageKey = `nh-platform-overrides-${currentAccount.id}`;
  const [overrides, setOverrides] = useState<Record<string, { annualCost?: number; renewalDate?: string }>>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(overrideStorageKey);
      if (raw) setOverrides(JSON.parse(raw));
    } catch {}
  }, [overrideStorageKey]);

  // Apply overrides to platforms
  const platforms = useMemo(
    () => rawPlatforms.map((p) => ({
      ...p,
      annualCost: overrides[p.name]?.annualCost ?? p.annualCost,
      renewalDate: overrides[p.name]?.renewalDate ?? p.renewalDate,
    })),
    [rawPlatforms, overrides],
  );

  const updateAnnualCost = (platformName: string, newCost: number) => {
    const updated = { ...overrides, [platformName]: { ...overrides[platformName], annualCost: newCost } };
    setOverrides(updated);
    localStorage.setItem(overrideStorageKey, JSON.stringify(updated));
  };

  const updatePlatform = (platformName: string, fields: { annualCost?: number; renewalDate?: string }) => {
    const updated = { ...overrides, [platformName]: { ...overrides[platformName], ...fields } };
    setOverrides(updated);
    localStorage.setItem(overrideStorageKey, JSON.stringify(updated));
  };

  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [editingCostFor, setEditingCostFor] = useState<string | null>(null);
  const [costInput, setCostInput] = useState("");
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

  // Month-over-month calls per platform from real CallRail data.
  const comparisonData = monthly.map((m) => {
    const entry: any = { month: m.monthLabel }; // eslint-disable-line @typescript-eslint/no-explicit-any
    platforms.forEach((p) => { entry[p.name] = m.byPlatform[p.name]?.calls || 0; });
    return entry;
  });

  const detail = selectedPlatform ? platforms.find((p) => p.name === selectedPlatform) : null;
  const detailMonthly = detail
    ? monthly.map((m) => ({ month: m.monthLabel, calls: m.byPlatform[detail.name]?.calls || 0 }))
    : [];

  return (
    <div>
      {/* Top Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground font-medium">Total Annual Budget</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(totalAnnual)}<span className="text-sm font-normal text-muted-foreground">/year</span></p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground font-medium">Calls This Month</p>
          <p className="text-2xl font-bold text-foreground">{platforms.reduce((sum, p) => sum + getCurrentCalls(p), 0)}</p>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          const v = editValues[p.name];
                          const fields: { annualCost?: number; renewalDate?: string } = {};
                          if (v?.cost !== undefined) {
                            const num = Number(v.cost);
                            if (!isNaN(num) && num >= 0) fields.annualCost = num;
                          }
                          if (v?.date !== undefined) {
                            fields.renewalDate = v.date || undefined;
                          }
                          if (Object.keys(fields).length > 0) updatePlatform(p.name, fields);
                          setEditingPlatform(null);
                        }}
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
                              Renewal: {fmtDate(parseISO(p.renewalDate), "MMM d, yyyy")}
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
      {detail && detailMonthly.length > 0 && (
        <div className="rounded-lg border border-primary/20 bg-card p-4 mb-4">
          <h3 className="text-sm font-bold text-card-foreground mb-3">{detail.fullName} -- Calls Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={detailMonthly}>
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
                        <td className="px-4 py-2.5 text-right">
                          {editingCostFor === p.name ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                min={0}
                                value={costInput}
                                onChange={(e) => setCostInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    const num = Number(costInput);
                                    if (!isNaN(num) && num >= 0) updateAnnualCost(p.name, num);
                                    setEditingCostFor(null);
                                  }
                                  if (e.key === "Escape") setEditingCostFor(null);
                                }}
                                onBlur={() => {
                                  const num = Number(costInput);
                                  if (!isNaN(num) && num >= 0) updateAnnualCost(p.name, num);
                                  setEditingCostFor(null);
                                }}
                                autoFocus
                                className="w-24 text-right text-sm bg-muted/50 border border-primary rounded px-1 py-0.5 outline-none"
                              />
                            </div>
                          ) : (
                            <button
                              onClick={() => { setCostInput(String(p.annualCost || 0)); setEditingCostFor(p.name); }}
                              className="hover:bg-muted rounded px-2 py-0.5 transition-colors group inline-flex items-center gap-1"
                              title="Click to edit annual cost"
                            >
                              {formatCurrency(p.annualCost || 0)}
                              <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold">{calls}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={change > 0 ? "text-green-600" : change < 0 ? "text-red-500" : "text-muted-foreground"}>
                            {change > 0 ? "+" : ""}{change}%
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-primary">{formatCurrency(costPerCall)}</td>
                        <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                          {p.renewalDate ? fmtDate(parseISO(p.renewalDate), "MMM d, yyyy") : "--"}
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
function FullPlatformView({ platforms, monthly }: { platforms: PlatformData[]; monthly: MonthBucket[] }) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const hasData = platforms.some((p) => p.monthlyData.length > 0);
  const roiRanking = hasData ? getROIScores(platforms) : [];
  const bestPerformer = roiRanking[0];
  const worstPerformer = roiRanking[roiRanking.length - 1];

  // Month-over-month trends from real CRM (info submits) + CallRail (calls) data.
  // Leads = calls + info submits per platform per month.
  const comparisonData = monthly.map((m) => {
    const entry: any = { month: m.monthLabel }; // eslint-disable-line @typescript-eslint/no-explicit-any
    platforms.forEach((p) => {
      const d = m.byPlatform[p.name];
      entry[p.name] = d ? d.calls + d.infoSubmits : 0;
    });
    return entry;
  });

  const cplComparisonData = monthly.map((m) => {
    const entry: any = { month: m.monthLabel }; // eslint-disable-line @typescript-eslint/no-explicit-any
    platforms.forEach((p) => {
      const d = m.byPlatform[p.name];
      const leads = d ? d.calls + d.infoSubmits : 0;
      entry[p.name] = leads > 0 ? Math.round((p.pricePerMonth / leads) * 100) / 100 : 0;
    });
    return entry;
  });

  const detail = selectedPlatform ? platforms.find((p) => p.name === selectedPlatform) : null;
  const detailMonthly = detail
    ? monthly.map((m) => {
        const d = m.byPlatform[detail.name];
        const calls = d?.calls || 0;
        const infoSubmits = d?.infoSubmits || 0;
        return { month: m.monthLabel, calls, infoSubmits, leads: calls + infoSubmits };
      })
    : [];

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
          <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
            <Award className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-primary font-medium">Best ROI This Month</p>
              <p className="text-lg font-bold text-foreground">{bestPerformer.name}</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(bestPerformer.cpl)} per lead -- {bestPerformer.leads} leads -- ROI Score: {bestPerformer.roiScore}/100</p>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-xs text-red-500 font-medium">Highest Cost Per Lead</p>
              <p className="text-lg font-bold text-foreground">{worstPerformer.name}</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(worstPerformer.cpl)} per lead -- {worstPerformer.leads} leads -- ROI Score: {worstPerformer.roiScore}/100</p>
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
      {detail && detailMonthly.length > 0 && (
        <div className="rounded-lg border border-primary/20 bg-card p-4 mb-4">
          <h3 className="text-sm font-bold text-card-foreground mb-3">{detail.fullName} -- Monthly Trend</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-64">
              <p className="text-xs text-muted-foreground mb-2">Leads Over Time</p>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={detailMonthly}>
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
                <BarChart data={detailMonthly}>
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
                  <tr key={s.name} className={`border-b border-border last:border-0 ${i === 0 ? "bg-primary/5" : ""}`}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: platforms.find((p) => p.name === s.name)?.color }} />
                        <span className="font-medium text-card-foreground">{s.name}</span>
                        {i === 0 && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Best</span>}
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

      <p className="text-[10px] text-muted-foreground text-center">Info submits from CRM lead routing. Calls from CallRail.</p>
    </div>
  );
}

export default function InventoryPlatformsPage() {
  const { currentAccount } = useAccount();
  const { platformCost } = useBudget();
  const { dateRange } = useDateRange();
  const staticPlatforms = getPlatformsForAccount(currentAccount.id);
  const isNHTTR = currentAccount.id === "nhttr";
  // Per-platform info-submits/calls follow the global date selector, like the
  // CRM Leads and Overview tabs — the totals reflect whatever range is picked.
  const startStr = fmtDate(dateRange.from, "yyyy-MM-dd");
  const endStr = fmtDate(dateRange.to, "yyyy-MM-dd");
  const { data: liveData, loading } = useLivePlatformData(currentAccount.id, startStr, endStr, staticPlatforms);

  // Merge live CRM + CallRail data into platform cards. Each platform's monthly
  // cost comes from the shared Budget tab (when a matching row exists), so the
  // cost-per-lead here reflects whatever budget the user maintains — edits on
  // the Budget tab update these numbers live.
  const platforms = useMemo(
    () => {
      const costed = staticPlatforms.map((p) => {
        const cost = platformCost(p.name);
        return cost !== undefined ? { ...p, pricePerMonth: cost } : p;
      });
      return mergePlatformsWithLive(costed, liveData);
    },
    [staticPlatforms, liveData, platformCost],
  );

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-foreground">Inventory Platforms</h2>
          {loading && <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />}
          {liveData && !loading && (
            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
              {isNHTTR ? "Live" : "CRM Live"}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {isNHTTR
            ? "Breakdown service listings -- budget tracking and call performance"
            : "ROI analysis per listing platform -- calls, info submits, cost per lead"
          }
        </p>
        <DataSourceBadge sources={externalLinks["/inventory-platforms"] || []} />
      </div>

      {isNHTTR ? (
        <NHTTRPlatformView platforms={platforms} monthly={liveData?.monthly ?? []} />
      ) : (
        <FullPlatformView platforms={platforms} monthly={liveData?.monthly ?? []} />
      )}
    </div>
  );
}
