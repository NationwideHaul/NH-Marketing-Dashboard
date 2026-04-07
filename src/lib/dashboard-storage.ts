import type { WidgetConfig, LayoutItem, DashboardConfig } from "@/types/widget";

const STORAGE_KEY = "nh-dashboard-config";

export function saveDashboard(config: DashboardConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function loadDashboard(): DashboardConfig | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function clearDashboard(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
