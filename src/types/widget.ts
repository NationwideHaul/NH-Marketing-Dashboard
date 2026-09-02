export type WidgetType =
  | "stat"
  | "interactive-stat"
  | "info-submit-total"
  | "manual-stat"
  | "line-chart"
  | "bar-chart"
  | "area-chart"
  | "pie-chart"
  | "table"
  | "goal-tracker"
  | "section-header"
  | "top-content"
  | "recent-content"
  | "active-ads";

export type DataSource =
  | "google-analytics"
  | "google-ads"
  | "meta-ads"
  | "facebook"
  | "instagram"
  | "youtube"
  | "callrail"
  | "email-marketing"
  | "ringcentral"
  | "gmb"
  | "linkedin"
  | "overview"
  | "nationwide-haul-crm"
  | "info-submits";

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  dataSource: DataSource;
  metric: string;
  format: "number" | "currency" | "percent";
  comparisonEnabled?: boolean;
  goalValue?: number;
  dimension?: string; // GA4 dimension override (e.g. "deviceCategory", "sessionDefaultChannelGroup", "sessionSource")
  dimensionValue?: string; // With `dimension`: filter a stat to one row (e.g. "Paid Search") instead of summing all rows
  manualValue?: number; // For manual-stat widgets: default value (editable by user, persisted in localStorage)
  sectionTitle?: string; // For section-header widgets: display title
  trendMonths?: number; // For chart widgets: override date range to show N months of data
  yearToDate?: boolean; // For chart widgets: ignore the global date selector and always show Jan 1 of the current year → today (month-by-month YTD comparison)
  excludeCurrentMonth?: boolean; // For chart widgets: drop the in-progress current month so a partial month doesn't read as a decline
  tracker?: string; // For callrail widgets: filter to a specific tracker name (e.g. "Truck Paper") from the company's trackerBreakdown
}

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export type Breakpoint = "lg" | "md" | "sm" | "xs";

export interface DashboardConfig {
  widgets: WidgetConfig[];
  layouts: Record<string, LayoutItem[]>;
}

export interface MetricOption {
  key: string;
  label: string;
  format: "number" | "currency" | "percent";
  category?: string;
}

export interface DataSourceOption {
  key: DataSource;
  label: string;
  icon: string;
  metrics: MetricOption[];
}
