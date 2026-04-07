"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useDashboard } from "@/context/dashboard-context";
import { dataSources, getMetricOptions } from "@/lib/widget-registry";
import type { WidgetConfig, WidgetType } from "@/types/widget";

export function WidgetConfigPanel({ config, onClose }: { config: WidgetConfig; onClose: () => void }) {
  const { updateWidget } = useDashboard();
  const [form, setForm] = useState({ ...config });
  const metrics = getMetricOptions(form.dataSource);

  const handleSave = () => {
    const selectedMetric = metrics.find((m) => m.key === form.metric);
    updateWidget({
      ...form,
      format: selectedMetric?.format || form.format,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-card-foreground">Widget Settings</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
            />
          </div>

          {/* Widget Type */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Widget Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as WidgetType })}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
            >
              <option value="stat">Stat Card</option>
              <option value="line-chart">Line Chart</option>
              <option value="bar-chart">Bar Chart</option>
              <option value="area-chart">Area Chart</option>
              <option value="pie-chart">Pie Chart</option>
              <option value="table">Data Table</option>
              <option value="goal-tracker">Goal Tracker</option>
            </select>
          </div>

          {/* Data Source */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Data Source</label>
            <select
              value={form.dataSource}
              onChange={(e) => {
                const newDs = e.target.value;
                const newMetrics = getMetricOptions(newDs);
                setForm({ ...form, dataSource: newDs as any, metric: newMetrics[0]?.key || "" }); // eslint-disable-line @typescript-eslint/no-explicit-any
              }}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
            >
              {dataSources.map((ds) => (
                <option key={ds.key} value={ds.key}>{ds.label}</option>
              ))}
            </select>
          </div>

          {/* Metric */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Metric</label>
            <select
              value={form.metric}
              onChange={(e) => setForm({ ...form, metric: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
            >
              {metrics.map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Comparison toggle */}
          {form.type === "stat" && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.comparisonEnabled || false}
                onChange={(e) => setForm({ ...form, comparisonEnabled: e.target.checked })}
                className="rounded border-border"
              />
              <span className="text-sm text-card-foreground">Show comparison</span>
            </label>
          )}

          {/* Goal value */}
          {form.type === "goal-tracker" && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Goal Value</label>
              <input
                type="number"
                value={form.goalValue || 0}
                onChange={(e) => setForm({ ...form, goalValue: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border">
          <button onClick={onClose} className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted">Cancel</button>
          <button onClick={handleSave} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-secondary">Save</button>
        </div>
      </div>
    </div>
  );
}
