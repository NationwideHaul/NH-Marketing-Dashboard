"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Pencil, MailOpen, MousePointerClick, Reply, AlertTriangle } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { format, eachMonthOfInterval } from "date-fns";
import { useAccount } from "@/context/account-context";
import { useDateRange } from "@/context/date-range-context";

/* ------------------------------------------------------------------ */
/*  Types & storage helpers                                           */
/* ------------------------------------------------------------------ */

// All metrics are rates stored as a percentage number (e.g. 42.5 = 42.5%).
interface EmailMonthLog {
  openRate: number;
  clickRate: number;
  replyRate: number;
  bounceRate: number;
}

const EMPTY_LOG: EmailMonthLog = { openRate: 0, clickRate: 0, replyRate: 0, bounceRate: 0 };

type MetricKey = keyof EmailMonthLog;

const METRIC_META: { key: MetricKey; label: string; color: string; icon: typeof MailOpen }[] = [
  { key: "openRate",   label: "Open Rate",   color: "var(--primary)",        icon: MailOpen },
  { key: "clickRate",  label: "Click Rate",  color: "var(--chart-accent-2)", icon: MousePointerClick },
  { key: "replyRate",  label: "Reply Rate",  color: "var(--chart-accent-3)", icon: Reply },
  { key: "bounceRate", label: "Bounce Rate", color: "var(--chart-accent-4)", icon: AlertTriangle },
];

const fmtPct = (v: number) => `${(v ?? 0).toFixed(1)}%`;

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
/*  Stat card (editable when a single month is selected)              */
/* ------------------------------------------------------------------ */

function StatCard({
  label, value, icon: Icon, editable, onChange,
}: {
  label: string; value: number; icon: typeof MailOpen; editable: boolean; onChange: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  return (
    <div className="bg-card border border-border rounded-lg px-4 py-3 flex flex-col gap-1 group relative">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      {editable && editing ? (
        <div className="flex items-center gap-1 mt-0.5">
          <input
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { const n = Number(input); if (!isNaN(n) && n >= 0) onChange(n); setEditing(false); }
              if (e.key === "Escape") setEditing(false);
            }}
            onBlur={() => { const n = Number(input); if (!isNaN(n) && n >= 0) onChange(n); setEditing(false); }}
            autoFocus
            className="w-20 text-xl font-bold text-foreground bg-muted/50 border border-primary rounded px-2 py-0.5 outline-none"
          />
          <span className="text-lg font-bold text-muted-foreground">%</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold text-foreground">{fmtPct(value)}</p>
          {editable && (
            <button
              onClick={() => { setInput(String(value)); setEditing(true); }}
              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
              title="Edit value"
            >
              <Pencil className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
      )}
    </div>
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
          if (Object.keys(remote).length > 0) {
            setLogs(remote);
            saveLogsLocal(accountId, remote);
          } else if (Object.keys(local).length > 0) {
            setLogs(local);
            persist(local, accountId);
          } else {
            setLogs({});
          }
        } else {
          setLogs(local);
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

  // Months inside the selected date range.
  const months = useMemo(() => {
    try {
      return eachMonthOfInterval({ start: dateRange.from, end: dateRange.to })
        .map((d) => ({ key: format(d, "yyyy-MM"), label: monthLabel(format(d, "yyyy-MM")) }));
    } catch {
      return [];
    }
  }, [dateRange.from, dateRange.to]);

  const singleMonth = months.length === 1;

  // Rates can't be summed — a single month shows that month's rates; a multi-month
  // range shows the AVERAGE across the months that have data.
  const stats = useMemo(() => {
    if (singleMonth) return logs[months[0].key] ?? EMPTY_LOG;
    const out = { ...EMPTY_LOG };
    for (const meta of METRIC_META) {
      const vals = months.map((m) => logs[m.key]).filter(Boolean).map((l) => l![meta.key]);
      out[meta.key] = vals.length ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : 0;
    }
    return out;
  }, [singleMonth, months, logs]);

  const chartData = useMemo(
    () => months.map((m) => ({ month: m.label, ...(logs[m.key] ?? EMPTY_LOG) })),
    [months, logs],
  );

  if (!loaded) return <div className="h-32" />;

  return (
    <div className="space-y-6 mb-6">
      {/* Rate cards — show the selected range; editable when it's a single month */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">
          {singleMonth
            ? `Rates for ${months[0].label} — click a number to edit`
            : `Average rates for the selected range (${months.length} months) — pick a single month to edit`}
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {METRIC_META.map((m) => (
            <StatCard
              key={m.key}
              label={m.label}
              value={stats[m.key]}
              icon={m.icon}
              editable={singleMonth}
              onChange={(v) => handleChange(months[0].key, m.key, v)}
            />
          ))}
        </div>
      </div>

      {/* Trend chart */}
      {chartData.length > 1 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="text-sm font-semibold text-foreground mb-4">Email Rates Over Time</h4>
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
                {METRIC_META.map((m) => (
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
