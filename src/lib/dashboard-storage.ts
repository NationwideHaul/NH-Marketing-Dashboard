import type { DashboardConfig } from "@/types/widget";

const PREFIX = "nh-dash-v3-";

export function saveDashboard(pageKey: string, config: DashboardConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFIX + pageKey, JSON.stringify(config));
}

export function loadDashboard(pageKey: string): DashboardConfig | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(PREFIX + pageKey);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function clearDashboard(pageKey: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PREFIX + pageKey);
}

export function clearAllDashboards(): void {
  if (typeof window === "undefined") return;
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
  keys.forEach((k) => localStorage.removeItem(k));
}
