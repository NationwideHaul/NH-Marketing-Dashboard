"use client";

import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip,
} from "recharts";
import { format, parseISO } from "date-fns";
import { useWidgetTimeSeries } from "@/hooks/use-widget-data";
import { formatNumber, formatCurrency, formatPercent } from "@/lib/utils";
import { aggregateWeekly } from "@/lib/mock-data/generator";
import type { WidgetConfig } from "@/types/widget";

const COLORS = ["#BE1E23", "#8C0F14", "#2563EB", "#16A34A", "#D97706", "#7C3AED", "#DB2777"];

function fmtVal(v: number, f: string) {
  if (f === "currency") return formatCurrency(v);
  if (f === "percent") return formatPercent(v);
  return formatNumber(v);
}

function fmtDate(d: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  try { return format(parseISO(String(d)), "MMM d"); } catch { return String(d); }
}

export function ChartWidget({ config }: { config: WidgetConfig }) {
  const rawData = useWidgetTimeSeries(config);
  const data = aggregateWeekly(rawData).map((p) => ({ date: p.date, value: p.value }));

  if (data.length === 0) {
    return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No data</div>;
  }

  const chartType = config.type.replace("-chart", "") as "line" | "bar" | "area" | "pie";
  const tooltipFmt = (value: any) => fmtVal(Number(value), config.format); // eslint-disable-line @typescript-eslint/no-explicit-any

  return (
    <div className="h-full w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        {chartType === "line" ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10 }} />
            <YAxis tickFormatter={(v) => fmtVal(v, config.format)} tick={{ fontSize: 10 }} width={50} />
            <Tooltip formatter={tooltipFmt} labelFormatter={fmtDate} />
            <Line type="monotone" dataKey="value" stroke="#BE1E23" strokeWidth={2} dot={false} />
          </LineChart>
        ) : chartType === "bar" ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10 }} />
            <YAxis tickFormatter={(v) => fmtVal(v, config.format)} tick={{ fontSize: 10 }} width={50} />
            <Tooltip formatter={tooltipFmt} labelFormatter={fmtDate} />
            <Bar dataKey="value" fill="#BE1E23" radius={[2, 2, 0, 0]} />
          </BarChart>
        ) : chartType === "area" ? (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10 }} />
            <YAxis tickFormatter={(v) => fmtVal(v, config.format)} tick={{ fontSize: 10 }} width={50} />
            <Tooltip formatter={tooltipFmt} labelFormatter={fmtDate} />
            <Area type="monotone" dataKey="value" stroke="#BE1E23" fill="#BE1E23" fillOpacity={0.15} strokeWidth={2} />
          </AreaChart>
        ) : (
          <PieChart>
            <Pie data={data.slice(-6).map((d, i) => ({ name: fmtDate(d.date), value: d.value, fill: COLORS[i % COLORS.length] }))}
              cx="50%" cy="50%" innerRadius="40%" outerRadius="70%" paddingAngle={2} dataKey="value">
              {data.slice(-6).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={tooltipFmt} />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
