"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, Pencil, Check, Mail, MailOpen, MousePointerClick, Reply, AlertTriangle, UserMinus, ShieldAlert } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { useAccount } from "@/context/account-context";
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
  delivered: 0,
  opened: 0,
  clicked: 0,
  replied: 0,
  bounced: 0,
  unsubscribed: 0,
  spamComplaints: 0,
};

type MetricKey = keyof EmailMonthLog;

const METRIC_META: { key: MetricKey; label: string; color: string; icon: typeof Mail }[] = [
  { key: "delivered",       label: "Emails Delivered",  color: "var(--primary)",        icon: Mail },
  { key: "opened",          label: "Opened",            color: "var(--secondary)",      icon: MailOpen },
  { key: "clicked",         label: "Clicked",           color: "var(--chart-accent-2)", icon: MousePointerClick },
  { key: "replied",         label: "Replied",           color: "var(--chart-accent-3)", icon: Reply },
  { key: "bounced",         label: "Bounced",           color: "var(--chart-accent-4)", icon: AlertTriangle },
  { key: "unsubscribed",    label: "Unsubscribed",      color: "var(--chart-accent-5)", icon: UserMinus },
  { key: "spamComplaints",  label: "Spam Complaints",   color: "var(--chart-accent-6)", icon: ShieldAlert },
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

function saveLogs(accountId: string, logs: Record<string, EmailMonthLog>) {
  localStorage.setItem(storageKey(accountId), JSON.stringify(logs));
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1);
  return d.toLocaleString("default", { month: "short", year: "numeric" });
}

function monthLabelLong(date: Date) {
  return date.toLocaleString("default", { month: "long", year: "numeric" });
}

/* ------------------------------------------------------------------ */
/*  Editable stat card                                                */
/* ------------------------------------------------------------------ */

function StatCard({
  metricKey,
  label,
  value,
  icon: Icon,
  onChange,
}: {
  metricKey: MetricKey;
  label: string;
  value: number;
  icon: typeof Mail;
  onChange: (key: MetricKey, val: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");

  const handleStart = () => {
    setInputVal(String(value));
    setEditing(true);
  };

  const handleSave = () => {
    const num = Number(inputVal);
    if (!isNaN(num) && num >= 0) onChange(metricKey, num);
    setEditing(false);
  };

  return (
    <div className="bg-card border border-border rounded-lg px-4 py-3 flex flex-col gap-1 group relative">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      {editing ? (
        <div className="flex items-center gap-2 mt-0.5">
          <input
            type="number"
            min={0}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
            autoFocus
            className="w-28 text-xl font-bold text-foreground bg-muted/50 border border-border rounded px-2 py-0.5 outline-none focus:border-primary"
          />
          <button onClick={handleSave} className="p-1.5 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors">
            <Check className="h-4 w-4 text-primary" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold text-foreground">{formatNumber(value)}</p>
          <button
            onClick={handleStart}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
            title="Edit value"
          >
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
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

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth());
  });

  const [logs, setLogs] = useState<Record<string, EmailMonthLog>>({});

  // Load logs when account changes
  useEffect(() => {
    setLogs(loadLogs(apiAccountId));
  }, [apiAccountId]);

  const currentKey = monthKey(selectedMonth);
  const currentLog = logs[currentKey] ?? { ...EMPTY_LOG };

  const handleMetricChange = useCallback(
    (key: MetricKey, val: number) => {
      setLogs((prev) => {
        const updated = {
          ...prev,
          [currentKey]: { ...(prev[currentKey] ?? { ...EMPTY_LOG }), [key]: val },
        };
        saveLogs(apiAccountId, updated);
        return updated;
      });
    },
    [apiAccountId, currentKey],
  );

  const prevMonth = () => setSelectedMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1));
  const nextMonth = () => setSelectedMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1));

  // Chart data: all months sorted chronologically
  const chartData = useMemo(() => {
    return Object.entries(logs)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, log]) => ({
        month: monthLabel(key),
        ...log,
      }));
  }, [logs]);

  return (
    <div className="space-y-6 mb-6">
      {/* Month picker */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <h3 className="text-lg font-semibold text-foreground min-w-[180px] text-center">
            {monthLabelLong(selectedMonth)}
          </h3>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Click any number to edit</p>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {METRIC_META.map((m) => (
          <StatCard
            key={m.key}
            metricKey={m.key}
            label={m.label}
            value={currentLog[m.key]}
            icon={m.icon}
            onChange={handleMetricChange}
          />
        ))}
      </div>

      {/* Historical chart */}
      {chartData.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="text-sm font-semibold text-foreground mb-4">Monthly Email Performance</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => formatNumber(value)}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11 }}
                  iconType="circle"
                  iconSize={8}
                />
                {METRIC_META.map((m) => (
                  <Bar
                    key={m.key}
                    dataKey={m.key}
                    name={m.label}
                    fill={m.color}
                    radius={[2, 2, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
