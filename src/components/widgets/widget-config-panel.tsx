"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useDashboard } from "@/context/dashboard-context";
import { dataSources, getMetricOptions } from "@/lib/widget-registry";
import type { WidgetConfig, WidgetType } from "@/types/widget";

export function WidgetConfigPanel({ config, onClose }: { config: WidgetConfig; onClose: () => void }) {
  const { updateWidget } = useDashboard();
  const [form, setForm] = useState({ ...config });
  const [mounted, setMounted] = useState(false);
  const metrics = getMetricOptions(form.dataSource);

  useEffect(() => { setMounted(true); }, []);

  const handleSave = () => {
    const selectedMetric = metrics.find((m) => m.key === form.metric);
    updateWidget({
      ...form,
      format: selectedMetric?.format || form.format,
    });
    onClose();
  };

  const modal = (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center" style={{ zIndex: 9999 }} onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Widget Settings</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Widget Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as WidgetType })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
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

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Data Source</label>
            <select
              value={form.dataSource}
              onChange={(e) => {
                const newDs = e.target.value;
                const newMetrics = getMetricOptions(newDs);
                setForm({ ...form, dataSource: newDs as any, metric: newMetrics[0]?.key || "" }); // eslint-disable-line @typescript-eslint/no-explicit-any
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {dataSources.map((ds) => (
                <option key={ds.key} value={ds.key}>{ds.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Metric</label>
            <select
              value={form.metric}
              onChange={(e) => setForm({ ...form, metric: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {metrics.map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>

          {form.type === "stat" && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.comparisonEnabled || false}
                onChange={(e) => setForm({ ...form, comparisonEnabled: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-900">Show comparison</span>
            </label>
          )}

          {form.type === "goal-tracker" && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Goal Value</label>
              <input
                type="number"
                value={form.goalValue || 0}
                onChange={(e) => setForm({ ...form, goalValue: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700">Save</button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}
