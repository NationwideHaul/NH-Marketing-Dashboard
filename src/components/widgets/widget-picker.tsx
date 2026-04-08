"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useDashboard } from "@/context/dashboard-context";
import { dataSources, widgetTypeLabels, getMetricOptions } from "@/lib/widget-registry";
import type { WidgetType, DataSource } from "@/types/widget";

const categories = [
  { label: "Analytics", sources: ["google-analytics", "gmb"] },
  { label: "Advertising", sources: ["google-ads", "meta-ads"] },
  { label: "Social Media", sources: ["facebook", "instagram", "youtube", "linkedin"] },
  { label: "Calls", sources: ["callrail", "ringcentral"] },
  { label: "Email Marketing", sources: ["email-marketing"] },
];

const widgetTypes: WidgetType[] = ["stat", "line-chart", "bar-chart", "area-chart", "pie-chart", "table", "goal-tracker"];

export function WidgetPicker() {
  const { addWidget, setShowPicker } = useDashboard();

  const handleAdd = (type: WidgetType, dataSource: DataSource) => {
    const metrics = getMetricOptions(dataSource);
    const firstMetric = metrics[0];
    const ds = dataSources.find((d) => d.key === dataSource);

    addWidget({
      id: `w-${Date.now()}`,
      type,
      title: `${ds?.label || dataSource} — ${firstMetric?.label || "Metric"}`,
      dataSource,
      metric: firstMetric?.key || "",
      format: firstMetric?.format || "number",
      comparisonEnabled: type === "stat",
      goalValue: type === "goal-tracker" ? 10000 : undefined,
    });
    setShowPicker(false);
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const panel = (
    <div className="fixed inset-0 bg-black/40 flex justify-end" style={{ zIndex: 9999 }} onClick={() => setShowPicker(false)}>
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-sm font-bold text-card-foreground">Add Widget</h2>
          <button onClick={() => setShowPicker(false)} className="p-1 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        {/* Widget Type Selection */}
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">Quick Add — Pick a type and data source</p>
        </div>

        {categories.map((cat) => (
          <div key={cat.label} className="px-4 py-3 border-b border-border">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{cat.label}</h3>
            {cat.sources.map((sourceKey) => {
              const ds = dataSources.find((d) => d.key === sourceKey);
              if (!ds) return null;
              return (
                <div key={sourceKey} className="mb-3">
                  <p className="text-sm font-medium text-card-foreground mb-1.5">{ds.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {widgetTypes.slice(0, 5).map((type) => {
                      const wt = widgetTypeLabels[type];
                      return (
                        <button
                          key={type}
                          onClick={() => handleAdd(type, sourceKey as DataSource)}
                          className="px-2.5 py-1 text-xs border border-border rounded-md hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          {wt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(panel, document.body);
}
