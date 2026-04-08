"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip,
} from "recharts";
import { format, parseISO } from "date-fns";
import { useWidgetTimeSeries, useWidgetMetric } from "@/hooks/use-widget-data";
import { formatNumber, formatCurrency, formatPercent } from "@/lib/utils";
import { getDataSource } from "@/lib/widget-registry";
import { aggregateWeekly } from "@/lib/mock-data/generator";
import type { WidgetConfig } from "@/types/widget";

const COLORS = ["#BE1E23", "#8C0F14", "#2563EB", "#16A34A", "#D97706", "#7C3AED", "#DB2777"];

function fmtVal(v: number, f: string) {
  if (f === "currency") return formatCurrency(v);
  if (f === "percent") return formatPercent(v);
  return formatNumber(v);
}

function fmtDate(d: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    const s = String(d);
    if (s.length === 8) return format(parseISO(s.slice(0,4)+"-"+s.slice(4,6)+"-"+s.slice(6,8)), "MMM d");
    return format(parseISO(s), "MMM d");
  } catch { return String(d); }
}

export function ChartWidget({ config }: { config: WidgetConfig }) {
  const rawData = useWidgetTimeSeries(config);
  const metric = useWidgetMetric(config);
  const ds = getDataSource(config.dataSource);

  const data = useMemo(() => {
    if (rawData.length > 14) return aggregateWeekly(rawData).map((p) => ({ date: p.date, value: p.value }));
    return rawData.map((p) => ({ date: p.date, value: p.value }));
  }, [rawData]);

  if (data.length === 0) {
    return <div className="flex items-center justify-center h-full text-sm text-gray-400">No data</div>;
  }

  const total = metric?.value ?? data.reduce((s, d) => s + d.value, 0);
  const chartType = config.type.replace("-chart", "") as "line" | "bar" | "area" | "pie";
  const tooltipFmt = (value: any) => fmtVal(Number(value), config.format); // eslint-disable-line @typescript-eslint/no-explicit-any

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header with total */}
      <div className="flex items-center justify-between px-3 pt-1">
        <span className="text-xs text-gray-400">{ds?.icon}</span>
        <span className="text-sm font-bold text-gray-900">{fmtVal(total, config.format)}</span>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0 px-1 pb-1">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 9 }} />
              <YAxis tickFormatter={(v) => fmtVal(v, config.format)} tick={{ fontSize: 9 }} width={45} />
              <Tooltip formatter={tooltipFmt} labelFormatter={fmtDate} />
              <Line type="monotone" dataKey="value" stroke="#BE1E23" strokeWidth={2} dot={false} />
            </LineChart>
          ) : chartType === "bar" ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 9 }} />
              <YAxis tickFormatter={(v) => fmtVal(v, config.format)} tick={{ fontSize: 9 }} width={45} />
              <Tooltip formatter={tooltipFmt} labelFormatter={fmtDate} />
              <Bar dataKey="value" fill="#BE1E23" radius={[3, 3, 0, 0]} />
            </BarChart>
          ) : chartType === "area" ? (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 9 }} />
              <YAxis tickFormatter={(v) => fmtVal(v, config.format)} tick={{ fontSize: 9 }} width={45} />
              <Tooltip formatter={tooltipFmt} labelFormatter={fmtDate} />
              <Area type="monotone" dataKey="value" stroke="#BE1E23" fill="#BE1E23" fillOpacity={0.12} strokeWidth={2} />
            </AreaChart>
          ) : (
            <PieChart>
              <Pie data={data.slice(-6).map((d, i) => ({ name: fmtDate(d.date), value: d.value, fill: COLORS[i % COLORS.length] }))}
                cx="50%" cy="50%" innerRadius="35%" outerRadius="65%" paddingAngle={2} dataKey="value">
                {data.slice(-6).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={tooltipFmt} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
