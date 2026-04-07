"use client";

import { Settings, X, GripVertical } from "lucide-react";
import { useState } from "react";
import { useDashboard } from "@/context/dashboard-context";
import { StatWidget } from "./stat-widget";
import { ChartWidget } from "./chart-widget";
import { GoalWidget } from "./goal-widget";
import { TableWidget } from "./table-widget";
import { WidgetConfigPanel } from "./widget-config-panel";
import { getDataSource } from "@/lib/widget-registry";
import type { WidgetConfig } from "@/types/widget";

const widgetComponents: Record<string, React.ComponentType<{ config: WidgetConfig }>> = {
  "stat": StatWidget,
  "line-chart": ChartWidget,
  "bar-chart": ChartWidget,
  "area-chart": ChartWidget,
  "pie-chart": ChartWidget,
  "table": TableWidget,
  "goal-tracker": GoalWidget,
};

export function WidgetWrapper({ config }: { config: WidgetConfig }) {
  const { editMode, removeWidget } = useDashboard();
  const [showConfig, setShowConfig] = useState(false);
  const Component = widgetComponents[config.type];
  const ds = getDataSource(config.dataSource);

  return (
    <div className="flex flex-col h-full rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {editMode && <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-grab shrink-0 drag-handle" />}
          <span className="text-xs font-medium text-card-foreground truncate">{config.title}</span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {ds && <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded hidden sm:block">{ds.label}</span>}
          <button onClick={() => setShowConfig(true)} className="p-1 rounded hover:bg-muted transition-colors" title="Settings">
            <Settings className="h-3 w-3 text-muted-foreground" />
          </button>
          {editMode && (
            <button onClick={() => removeWidget(config.id)} className="p-1 rounded hover:bg-red-100 transition-colors" title="Remove">
              <X className="h-3 w-3 text-red-500" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {Component ? <Component config={config} /> : <div className="p-4 text-muted-foreground text-sm">Unknown widget</div>}
      </div>

      {/* Config Panel */}
      {showConfig && <WidgetConfigPanel config={config} onClose={() => setShowConfig(false)} />}
    </div>
  );
}
