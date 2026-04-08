"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { WidgetConfig, LayoutItem, DashboardConfig } from "@/types/widget";
import { saveDashboard, loadDashboard, clearDashboard } from "@/lib/dashboard-storage";
import { defaultWidgetSizes, getNextPosition } from "@/lib/widget-registry";
import { pageDefaults } from "@/lib/page-defaults";
import { overviewDefaults } from "@/lib/page-defaults";
import { useAccount } from "@/context/account-context";

// Map dataSource to the tab it belongs to
const dataSourceToTab: Record<string, string> = {
  "google-analytics": "google-analytics",
  "google-ads": "google-ads",
  "meta-ads": "meta-ads",
  "facebook": "social-media",
  "instagram": "social-media",
  "youtube": "social-media",
  "callrail": "call-logs",
  "email-marketing": "email-marketing",
  "ringcentral": "call-logs",
  "gmb": "gmb",
  "linkedin": "social-media",
  "overview": "overview",
};

// Filter widgets to only include data sources available for this account
function filterWidgetsForAccount(widgets: WidgetConfig[], accountTabs: string[]): WidgetConfig[] {
  return widgets.filter((w) => {
    const tab = dataSourceToTab[w.dataSource];
    if (!tab) return true;
    if (tab === "overview") return true; // overview is always available
    return accountTabs.includes(tab);
  });
}

// Filter layouts to match filtered widgets
function filterLayouts(layouts: Record<string, LayoutItem[]>, widgetIds: Set<string>): Record<string, LayoutItem[]> {
  const filtered: Record<string, LayoutItem[]> = {};
  Object.entries(layouts).forEach(([bp, items]) => {
    filtered[bp] = (items as LayoutItem[]).filter((item) => widgetIds.has(item.i));
  });
  return filtered;
}

interface DashboardContextType {
  widgets: WidgetConfig[];
  layouts: Record<string, LayoutItem[]>;
  editMode: boolean;
  showPicker: boolean;
  pageKey: string;
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
  const pathname = usePathname();
  const pageKey = pathname || "/";
  const { currentAccount } = useAccount();

  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [layouts, setLayouts] = useState<Record<string, LayoutItem[]>>({});
  const [editMode, setEditMode] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [loadedPage, setLoadedPage] = useState<string>("");

  // Load per-page config when page or account changes
  useEffect(() => {
    const storageKey = `${currentAccount.id}:${pageKey}`;
    const saved = loadDashboard(storageKey);
    if (saved && saved.widgets.length > 0) {
      setWidgets(saved.widgets);
      setLayouts(saved.layouts);
    } else {
      // Use page defaults, filtered by account capabilities
      const defaults = pageDefaults[pageKey] || overviewDefaults;
      const filteredWidgets = filterWidgetsForAccount(defaults.widgets, currentAccount.tabs);
      const widgetIds = new Set(filteredWidgets.map((w) => w.id));
      const filteredLayouts = filterLayouts(defaults.layouts, widgetIds);
      setWidgets(filteredWidgets);
      setLayouts(filteredLayouts);
    }
    setLoadedPage(pageKey);
    setEditMode(false);
    setShowPicker(false);
  }, [pageKey, currentAccount.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist to localStorage on change (account-scoped)
  useEffect(() => {
    if (loadedPage !== pageKey) return; // Don't save during page transition
    if (widgets.length === 0) return;
    saveDashboard(`${currentAccount.id}:${pageKey}`, { widgets, layouts });
  }, [widgets, layouts, pageKey, loadedPage, currentAccount.id]);

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
        newLayouts[bp] = (items as LayoutItem[]).filter((item) => item.i !== id);
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
    clearDashboard(`${currentAccount.id}:${pageKey}`);
    const defaults = pageDefaults[pageKey] || overviewDefaults;
    const filteredWidgets = filterWidgetsForAccount(defaults.widgets, currentAccount.tabs);
    const widgetIds = new Set(filteredWidgets.map((w) => w.id));
    const filteredLayouts = filterLayouts(defaults.layouts, widgetIds);
    setWidgets(filteredWidgets);
    setLayouts(filteredLayouts);
  }, [pageKey, currentAccount]);

  if (loadedPage !== pageKey) return null; // Prevent flash during page transition

  return (
    <DashboardContext.Provider
      value={{
        widgets, layouts, editMode, showPicker, pageKey,
        addWidget, removeWidget, updateWidget, updateLayouts,
        toggleEditMode, setShowPicker, resetDashboard,
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
