"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Pencil, Check, Mail, MailOpen, MousePointerClick, Reply, AlertTriangle, UserMinus, ShieldAlert } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { format, eachMonthOfInterval } from "date-fns";
import { useAccount } from "@/context/account-context";
import { useDateRange } from "@/context/date-range-context";
import { formatNumber } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types & storage helpers                                           */
/* ------------------------------------------------------------------ */

interface EmailMonthLog {
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  unsubscribed: number;
  spamComplaints: number;
}

const EMPTY_LOG: EmailMonthLog = {
  delivered: 0, opened: 0, clicked: 0, replied: 0, bounced: 0, unsubscribed: 0, spamComplaints: 0,
};

type MetricKey = keyof EmailMonthLog;

const METRIC_META: { key: MetricKey; label: string; short: string; color: string; icon: typeof Mail }[] = [
  { key: "delivered",       label: "Emails Delivered",  short: "Delivered",    color: "var(--primary)",        icon: Mail },
  { key: "opened",          label: "Opened",            short: "Opened",       color: "var(--secondary)",      icon: MailOpen },
  { key: "clicked",         label: "Clicked",           short: "Clicked",      color: "var(--chart-accent-2)", icon: MousePointerClick },
  { key: "replied",         label: "Replied",           short: "Replied",      color: "var(--chart-accent-3)", icon: Reply },
  { key: "bounced",         label: "Bounced",           short: "Bounced",      color: "var(--chart-accent-4)", icon: AlertTriangle },
  { key: "unsubscribed",    label: "Unsubscribed",      short: "Unsub",        color: "var(--chart-accent-5)", icon: UserMinus },
  { key: "spamComplaints",  label: "Spam Complaints",   short: "Spam",         color: "var(--chart-accent-6)", icon: ShieldAlert },
];

function storageKey(accountId: string) {
  return `nh-email-logs-${accountId}`;
}
function loadLogs(accountId: string): Record<string, EmailMonthLog> {
  try {
    const raw = localStorage.getItem(storageKey(accountId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveLogsLocal(accountId: string, logs: Record<string, EmailMonthLog>) {
  try { localStorage.setItem(storageKey(accountId), JSON.stringify(logs)); } catch { /* ignore */ }
}
function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("default", { month: "short", year: "2-digit" });
}

/* ------------------------------------------------------------------ */
/*  Editable numeric cell                                             */
/* ------------------------------------------------------------------ */

function EditableCell({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  if (editing) {
    return (
      <div className="flex items-center justify-end gap-1">
        <input
          type="number"
          min={0}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { const n = Number(input); if (!isNaN(n) && n >= 0) onChange(n); setEditing(false); }
            if (e.key === "Escape") setEditing(false);
          }}
          onBlur={() => { const n = Number(input); if (!isNaN(n) && n >= 0) onChange(n); setEditing(false); }}
          autoFocus
          className="w-20 text-right text-sm bg-muted/50 border border-primary rounded px-1 py-0.5 outline-none"
        />
      </div>
    );
  }
  return (
    <button
      onClick={() => { setInput(String(value)); setEditing(true); }}
      className="w-full text-right px-2 py-0.5 rounded hover:bg-muted transition-colors group inline-flex items-center justify-end gap-1"
      title="Click to edit"
    >
      {formatNumber(value)}
      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

export function EmailStatsHeader() {
  const { apiAccountId } = useAccount();
  const { dateRange } = useDateRange();
  const [logs, setLogs] = useState<Record<string, EmailMonthLog>>({});
  const [loaded, setLoaded] = useState(false);

  // Persist: mirror to localStorage (so Overview widgets that read
  // nh-email-logs-* keep working) AND fire-and-forget to Supabase.
  const persist = useCallback((next: Record<string, EmailMonthLog>, accountId: string) => {
    saveLogsLocal(accountId, next);
    fetch(`/api/email-logs?accountId=${encodeURIComponent(accountId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logs: next }),
    }).catch(() => { /* localStorage mirror still holds the latest */ });
  }, []);

  // Load: prefer Supabase; fall back to localStorage; migrate local → Supabase
  // when remote is empty. Always mirror the result to localStorage.
  useEffect(() => {
    const accountId = apiAccountId;
    let cancelled = false;
    setLoaded(false);
    (async () => {
      const local = loadLogs(accountId);
      try {
        const res = await fetch(`/api/email-logs?accountId=${encodeURIComponent(accountId)}`);
        const json = await res.json();
        if (cancelled) return;
        if (json.status === "ok" && json.logs && typeof json.logs === "object") {
          const remote = json.logs as Record<string, EmailMonthLog>;
          if (Object.keys(remote).length > 0) {
            setLogs(remote);
            saveLogsLocal(accountId, remote);
          } else if (Object.keys(local).length > 0) {
            // Migrate existing local data up to Supabase.
            setLogs(local);
            persist(local, accountId);
          } else {
            setLogs({});
          }
        } else {
          setLogs(local); // unconfigured/error → local fallback
        }
      } catch {
        if (!cancelled) setLogs(local);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [apiAccountId, persist]);

  const handleChange = useCallback(
    (mKey: string, metric: MetricKey, val: number) => {
      setLogs((prev) => {
        const next = { ...prev, [mKey]: { ...(prev[mKey] ?? { ...EMPTY_LOG }), [metric]: val } };
        persist(next, apiAccountId);
        return next;
      });
    },
    [apiAccountId, persist],
  );

  // Months inside the selected date range (these drive the table + chart).
  const months = useMemo(() => {
    try {
      return eachMonthOfInterval({ start: dateRange.from, end: dateRange.to })
        .map((d) => ({ key: format(d, "yyyy-MM"), label: monthLabel(format(d, "yyyy-MM")) }));
    } catch {
      return [];
    }
  }, [dateRange.from, dateRange.to]);

  // Totals across the range for the summary cards.
  const totals = useMemo(() => {
    const t = { ...EMPTY_LOG };
    for (const m of months) {
      const log = logs[m.key];
      if (!log) continue;
      for (const meta of METRIC_META) t[meta.key] += log[meta.key] || 0;
    }
    return t;
  }, [months, logs]);

  const chartData = useMemo(
    () => months.map((m) => ({ month: m.label, ...(logs[m.key] ?? EMPTY_LOG) })),
    [months, logs],
  );

  if (!loaded) return <div className="h-32" />;

  return (
    <div className="space-y-6 mb-6">
      {/* Range totals */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">
          Totals for the selected date range ({months.length} {months.length === 1 ? "month" : "months"})
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {METRIC_META.map((m) => (
            <div key={m.key} className="bg-card border border-border rounded-lg px-4 py-3 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <m.icon className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{m.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatNumber(totals[m.key])}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Editable monthly table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">Monthly Entries</h4>
          <p className="text-xs text-muted-foreground">Click any number to edit</p>
        </div>
        {months.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Month</th>
                  {METRIC_META.map((m) => (
                    <th key={m.key} className="px-3 py-2 text-right font-medium text-muted-foreground whitespace-nowrap">{m.short}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {months.map((mo) => {
                  const log = logs[mo.key] ?? EMPTY_LOG;
                  return (
                    <tr key={mo.key} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 font-medium text-card-foreground whitespace-nowrap">{mo.label}</td>
                      {METRIC_META.map((m) => (
                        <td key={m.key} className="px-3 py-1.5 text-right">
                          <EditableCell value={log[m.key]} onChange={(v) => handleChange(mo.key, m.key, v)} />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-sm text-muted-foreground">Pick a date range to enter monthly stats.</div>
        )}
      </div>

      {/* Trend chart */}
      {chartData.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="text-sm font-semibold text-foreground mb-4">Email Performance Over Time</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number) => formatNumber(value)}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                {METRIC_META.map((m) => (
                  <Bar key={m.key} dataKey={m.key} name={m.label} fill={m.color} radius={[2, 2, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
