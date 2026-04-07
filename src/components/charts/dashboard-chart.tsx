"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { ChartTypeSelector } from "./chart-type-selector";
import { formatNumber, formatCurrency, formatPercent } from "@/lib/utils";
import type { ChartType, ChartConfig } from "@/types/chart";
import type { TimeSeriesPoint } from "@/lib/mock-data";

const CHART_COLORS = [
  "#BE1E23", "#8C0F14", "#2563EB", "#16A34A", "#D97706", "#7C3AED", "#DB2777",
];

interface DashboardChartProps {
  config: ChartConfig;
  data: TimeSeriesPoint[];
  comparisonData?: TimeSeriesPoint[];
}

function formatValue(value: number, fmt: "number" | "currency" | "percent") {
  if (fmt === "currency") return formatCurrency(value);
  if (fmt === "percent") return formatPercent(value);
  return formatNumber(value);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatXAxis(dateStr: any) {
  try {
    if (dateStr.length === 7) return format(parseISO(dateStr + "-01"), "MMM yy");
    return format(parseISO(dateStr), "MMM d");
  } catch {
    return dateStr;
  }
}

export function DashboardChart({ config, data, comparisonData }: DashboardChartProps) {
  const [chartType, setChartType] = useState<ChartType>(config.defaultType);

  const mergedData = useMemo(() => {
    if (!comparisonData) return data.map((d) => ({ date: d.date, current: d.value }));
    return data.map((d, i) => ({
      date: d.date,
      current: d.value,
      comparison: comparisonData[i]?.value ?? 0,
    }));
  }, [data, comparisonData]);

  const pieData = useMemo(() => {
    if (chartType !== "pie" || data.length === 0) return [];
    // Aggregate into monthly buckets for pie
    const monthly: Record<string, number> = {};
    for (const p of data) {
      const month = p.date.substring(0, 7);
      monthly[month] = (monthly[month] || 0) + p.value;
    }
    return Object.entries(monthly)
      .slice(-6)
      .map(([month, value], i) => ({
        name: format(parseISO(month + "-01"), "MMM yyyy"),
        value: Math.round(value),
        fill: CHART_COLORS[i % CHART_COLORS.length],
      }));
  }, [data, chartType]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tooltipFormatter = (value: any) => formatValue(Number(value), config.format);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-card-foreground">{config.title}</h3>
        <ChartTypeSelector
          selected={chartType}
          supported={config.supportedTypes}
          onChange={setChartType}
        />
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <LineChart data={mergedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => formatValue(v, config.format)} tick={{ fontSize: 11 }} width={60} />
              <Tooltip formatter={tooltipFormatter} labelFormatter={formatXAxis} />
              {comparisonData && <Legend />}
              <Line type="monotone" dataKey="current" name="Current" stroke="#BE1E23" strokeWidth={2} dot={false} />
              {comparisonData && (
                <Line type="monotone" dataKey="comparison" name="Previous" stroke="#9CA3AF" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              )}
            </LineChart>
          ) : chartType === "bar" ? (
            <BarChart data={mergedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => formatValue(v, config.format)} tick={{ fontSize: 11 }} width={60} />
              <Tooltip formatter={tooltipFormatter} labelFormatter={formatXAxis} />
              {comparisonData && <Legend />}
              <Bar dataKey="current" name="Current" fill="#BE1E23" radius={[2, 2, 0, 0]} />
              {comparisonData && (
                <Bar dataKey="comparison" name="Previous" fill="#9CA3AF" radius={[2, 2, 0, 0]} />
              )}
            </BarChart>
          ) : chartType === "area" ? (
            <AreaChart data={mergedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => formatValue(v, config.format)} tick={{ fontSize: 11 }} width={60} />
              <Tooltip formatter={tooltipFormatter} labelFormatter={formatXAxis} />
              {comparisonData && <Legend />}
              <Area type="monotone" dataKey="current" name="Current" stroke="#BE1E23" fill="#BE1E23" fillOpacity={0.15} strokeWidth={2} />
              {comparisonData && (
                <Area type="monotone" dataKey="comparison" name="Previous" stroke="#9CA3AF" fill="#9CA3AF" fillOpacity={0.08} strokeWidth={2} strokeDasharray="5 5" />
              )}
            </AreaChart>
          ) : (
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${name}: ${formatValue(value, config.format)}`}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={tooltipFormatter} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
