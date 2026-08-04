"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Mail, MailOpen, MousePointerClick, Reply, AlertTriangle, Pencil } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { format, eachMonthOfInterval } from "date-fns";
import { useAccount } from "@/context/account-context";
import { useDateRange } from "@/context/date-range-context";
import { formatNumber } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types & metric definitions                                        */
/* ------------------------------------------------------------------ */

// `delivered` and `replied` are counts (volume); the rest are rates stored as a
// percentage number (e.g. 42.5 = 42.5%).
interface EmailMonthLog {
  delivered: number;
  openRate: number;
  clickRate: number;
  replied: number;
  bounced: number;
}

const EMPTY_LOG: EmailMonthLog = { delivered: 0, openRate: 0, clickRate: 0, replied: 0, bounced: 0 };

type MetricKey = keyof EmailMonthLog;

// isRate: true → shown as % and AVERAGED over a range; false → a count, shown as
// a plain number and SUMMED over a range.
const METRIC_META: { key: MetricKey; label: string; isRate: boolean; color: string; icon: typeof Mail }[] = [
  { key: "delivered",  label: "Emails Delivered", isRate: false, color: "var(--secondary)",      icon: Mail },
  { key: "openRate",   label: "Open Rate",        isRate: true,  color: "var(--primary)",        icon: MailOpen },
  { key: "clickRate",  label: "Click Rate",       isRate: true,  color: "var(--chart-accent-2)", icon: MousePointerClick },
  { key: "replied",    label: "Replies",          isRate: false, color: "var(--chart-accent-3)", icon: Reply },
  { key: "bounced",    label: "Bounced",          isRate: false, color: "var(--chart-accent-4)", icon: AlertTriangle },
];
const RATE_META = METRIC_META.filter((m) => m.isRate);

const fmtVal = (v: number, isRate: boolean) => (isRate ? `${(v ?? 0).toFixed(1)}%` : formatNumber(v ?? 0));

/* ------------------------------------------------------------------ */
/*  Storage helpers                                                   */
/* ------------------------------------------------------------------ */

function storageKey(accountId: string) { return `nh-email-logs-${accountId}`; }
function loadLogs(accountId: string): Record<string, EmailMonthLog> {
  try { const raw = localStorage.getItem(storageKey(accountId)); return raw ? JSON.parse(raw) : {}; }
  catch { return {}; }
}
function saveLogsLocal(accountId: string, logs: Record<string, EmailMonthLog>) {
  try { localStorage.setItem(storageKey(accountId), JSON.stringify(logs)); } catch { /* ignore */ }
}
function monthShort(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("default", { month: "short", year: "2-digit" });
}

/* ------------------------------------------------------------------ */
/*  Entry input (one field in the "enter data" row)                   */
/* ------------------------------------------------------------------ */

function EditableCell({ value, isRate, onSave }: { value: number; isRate: boolean; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  if (editing) {
    return (
      <input
        type="number"
        min={0}
        max={isRate ? 100 : undefined}
        step={isRate ? "0.1" : "1"}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { const n = Number(input); if (!isNaN(n) && n >= 0) onSave(n); setEditing(false); }
          if (e.key === "Escape") setEditing(false);
        }}
        onBlur={() => { const n = Number(input); if (!isNaN(n) && n >= 0) onSave(n); setEditing(false); }}
        autoFocus
        className="w-20 text-right text-sm bg-muted/50 border border-primary rounded px-1 py-0.5 outline-none"
      />
    );
  }
  return (
    <button
      onClick={() => { setInput(String(value)); setEditing(true); }}
      className="w-full text-right px-2 py-0.5 rounded hover:bg-muted transition-colors group inline-flex items-center justify-end gap-1"
      title="Click to edit"
    >
      {isRate ? `${(value ?? 0).toFixed(1)}%` : formatNumber(value ?? 0)}
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

  const persist = useCallback((next: Record<string, EmailMonthLog>, accountId: string) => {
    saveLogsLocal(accountId, next);
    fetch(`/api/email-logs?accountId=${encodeURIComponent(accountId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logs: next }),
    }).catch(() => { /* localStorage mirror still holds the latest */ });
  }, []);

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
          if (Object.keys(remote).length > 0) { setLogs(remote); saveLogsLocal(accountId, remote); }
          else if (Object.keys(local).length > 0) { setLogs(local); persist(local, accountId); }
          else setLogs({});
        } else setLogs(local);
      } catch {
        if (!cancelled) setLogs(local);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [apiAccountId, persist]);

  const handleChange = useCallback((mKey: string, metric: MetricKey, val: number) => {
    setLogs((prev) => {
      const next = { ...prev, [mKey]: { ...(prev[mKey] ?? { ...EMPTY_LOG }), [metric]: val } };
      persist(next, apiAccountId);
      return next;
    });
  }, [apiAccountId, persist]);

  // Months in the selected date range (drive the summary cards + chart).
  const months = useMemo(() => {
    try {
      return eachMonthOfInterval({ start: dateRange.from, end: dateRange.to }).map((d) => format(d, "yyyy-MM"));
    } catch { return []; }
  }, [dateRange.from, dateRange.to]);

  // Summary: counts are summed, rates are averaged over months with data.
  const stats = useMemo(() => {
    const out = { ...EMPTY_LOG };
    for (const meta of METRIC_META) {
      const vals = months.map((k) => logs[k]).filter(Boolean).map((l) => l![meta.key]);
      if (meta.isRate) out[meta.key] = vals.length ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : 0;
      else out[meta.key] = vals.reduce((s, v) => s + v, 0);
    }
    return out;
  }, [months, logs]);

  const chartData = useMemo(
    () => months.map((k) => ({ month: monthShort(k), ...(logs[k] ?? EMPTY_LOG) })),
    [months, logs],
  );

  if (!loaded) return <div className="h-32" />;

  return (
    <div className="space-y-6 mb-6">
      {/* Summary cards for the selected range (read-only) */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">
          {months.length === 1 ? `Stats for ${monthShort(months[0])}` : `Selected range · ${months.length} months (counts summed, rates averaged)`}
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {METRIC_META.map((m) => (
            <div key={m.key} className="bg-card border border-border rounded-lg px-4 py-3 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <m.icon className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{m.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{fmtVal(stats[m.key], m.isRate)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* One editable row per month in the selected range — this is where you type */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">Enter / edit by month</h4>
          <p className="text-xs text-muted-foreground">Click any number to edit — saves automatically</p>
        </div>
        {months.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Month</th>
                  {METRIC_META.map((m) => (
                    <th key={m.key} className="px-3 py-2 text-right font-medium text-muted-foreground whitespace-nowrap">
                      {m.label}{m.isRate ? " (%)" : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {months.map((k) => {
                  const log = logs[k] ?? EMPTY_LOG;
                  return (
                    <tr key={k} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 font-medium text-card-foreground whitespace-nowrap">{monthShort(k)}</td>
                      {METRIC_META.map((m) => (
                        <td key={m.key} className="px-3 py-1.5 text-right">
                          <EditableCell value={log[m.key]} isRate={m.isRate} onSave={(v) => handleChange(k, m.key, v)} />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-sm text-muted-foreground">Pick a date range above to see and enter months.</div>
        )}
      </div>

      {/* Rate trends */}
      {chartData.length > 1 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="text-sm font-semibold text-foreground mb-4">Rate Trends Over Time</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number) => `${Number(value).toFixed(1)}%`}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                {RATE_META.map((m) => (
                  <Line key={m.key} type="monotone" dataKey={m.key} name={m.label} stroke={m.color} strokeWidth={2} dot={{ r: 3 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
