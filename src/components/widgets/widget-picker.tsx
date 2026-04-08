"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Search } from "lucide-react";
import { useDashboard } from "@/context/dashboard-context";
import { dataSources, chartTypes } from "@/lib/widget-registry";
import type { WidgetType, DataSource, MetricOption } from "@/types/widget";

export function WidgetPicker() {
  const { addWidget, setShowPicker } = useDashboard();
  const [mounted, setMounted] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string>(dataSources[0].key);
  const [selectedChartType, setSelectedChartType] = useState<WidgetType>("stat");
  const [search, setSearch] = useState("");

  useEffect(() => { setMounted(true); }, []);

  const currentSource = dataSources.find((ds) => ds.key === selectedSource);
  const filteredMetrics = currentSource?.metrics.filter((m) =>
    m.label.toLowerCase().includes(search.toLowerCase()) ||
    (m.category || "").toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleAddMetric = (metric: MetricOption) => {
    addWidget({
      id: `w-${Date.now()}`,
      type: selectedChartType,
      title: metric.label,
      dataSource: selectedSource as DataSource,
      metric: metric.key,
      format: metric.format,
      comparisonEnabled: selectedChartType === "stat",
      goalValue: selectedChartType === "goal-tracker" ? 10000 : undefined,
    });
  };

  const panel = (
    <div className="fixed inset-0 flex justify-end" style={{ zIndex: 9999 }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={() => setShowPicker(false)} />

      {/* Panel */}
      <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-900">Add Widget</h2>
          <button onClick={() => setShowPicker(false)} className="p-1 rounded hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Data Source Dropdown */}
        <div className="px-4 py-3 border-b border-gray-200">
          <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Data Source</label>
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {dataSources.map((ds) => (
              <option key={ds.key} value={ds.key}>{ds.icon} {ds.label}</option>
            ))}
          </select>
        </div>

        {/* Chart Type Selector */}
        <div className="px-4 py-3 border-b border-gray-200">
          <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Widget Type</label>
          <div className="flex gap-1">
            {chartTypes.map((ct) => (
              <button
                key={ct.key}
                onClick={() => setSelectedChartType(ct.key)}
                className={`flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                  selectedChartType === ct.key
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
                title={ct.label}
              >
                {ct.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search metrics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Metrics List */}
        <div className="flex-1 overflow-y-auto">
          {filteredMetrics.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">No metrics found</div>
          ) : (
            filteredMetrics.map((metric) => (
              <button
                key={metric.key}
                onClick={() => handleAddMetric(metric)}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-red-50 border-b border-gray-100 transition-colors group"
              >
                <span className="text-lg">{currentSource?.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-red-700">{metric.label}</p>
                  {metric.category && (
                    <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded">
                      {metric.category}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  + Add
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <p className="text-[10px] text-gray-400 text-center">
            Click a metric to add it as a {chartTypes.find((c) => c.key === selectedChartType)?.label || "widget"}
          </p>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(panel, document.body);
}
