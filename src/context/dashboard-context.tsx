"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { WidgetConfig, LayoutItem, DashboardConfig } from "@/types/widget";
import { saveDashboard, loadDashboard, clearDashboard } from "@/lib/dashboard-storage";
import { defaultWidgetSizes, getNextPosition } from "@/lib/widget-registry";
import { defaultDashboard } from "@/lib/default-dashboard";

interface DashboardContextType {
  widgets: WidgetConfig[];
  layouts: Record<string, LayoutItem[]>;
  editMode: boolean;
  showPicker: boolean;
  addWidget: (widget: WidgetConfig) => void;
  removeWidget: (id: string) => void;
  updateWidget: (widget: WidgetConfig) => void;
  updateLayouts: (layouts: Record<string, LayoutItem[]>) => void;
  toggleEditMode: () => void;
  setShowPicker: (show: boolean) => void;
  resetDashboard: () => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [layouts, setLayouts] = useState<Record<string, LayoutItem[]>>({});
  const [editMode, setEditMode] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadDashboard();
    if (saved && saved.widgets.length > 0) {
      setWidgets(saved.widgets);
      setLayouts(saved.layouts);
    } else {
      // Use default dashboard
      setWidgets(defaultDashboard.widgets);
      setLayouts(defaultDashboard.layouts);
    }
    setLoaded(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (!loaded) return;
    saveDashboard({ widgets, layouts });
  }, [widgets, layouts, loaded]);

  const addWidget = useCallback((widget: WidgetConfig) => {
    setWidgets((prev) => [...prev, widget]);
    const size = defaultWidgetSizes[widget.type];
    setLayouts((prev) => {
      const newLayouts = { ...prev };
      const lgLayout = newLayouts.lg || [];
      const pos = getNextPosition(lgLayout);
      const newItem: LayoutItem = {
        i: widget.id,
        x: pos.x,
        y: pos.y,
        w: size.w,
        h: size.h,
        minW: size.minW,
        minH: size.minH,
      };
      newLayouts.lg = [...lgLayout, newItem];
      return newLayouts;
    });
  }, []);

  const removeWidget = useCallback((id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    setLayouts((prev) => {
      const newLayouts: Record<string, LayoutItem[]> = {};
      Object.entries(prev).forEach(([bp, items]) => {
        newLayouts[bp] = items.filter((item) => item.i !== id);
      });
      return newLayouts;
    });
  }, []);

  const updateWidget = useCallback((widget: WidgetConfig) => {
    setWidgets((prev) => prev.map((w) => (w.id === widget.id ? widget : w)));
  }, []);

  const updateLayouts = useCallback((newLayouts: Record<string, LayoutItem[]>) => {
    setLayouts(newLayouts);
  }, []);

  const toggleEditMode = useCallback(() => {
    setEditMode((prev) => !prev);
    if (editMode) setShowPicker(false);
  }, [editMode]);

  const resetDashboard = useCallback(() => {
    clearDashboard();
    setWidgets(defaultDashboard.widgets);
    setLayouts(defaultDashboard.layouts);
  }, []);

  if (!loaded) return null; // Prevent hydration mismatch

  return (
    <DashboardContext.Provider
      value={{
        widgets,
        layouts,
        editMode,
        showPicker,
        addWidget,
        removeWidget,
        updateWidget,
        updateLayouts,
        toggleEditMode,
        setShowPicker,
        resetDashboard,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error("useDashboard must be used within DashboardProvider");
  return context;
}
