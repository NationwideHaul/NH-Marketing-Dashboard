export type WidgetType =
  | "stat"
  | "interactive-stat"
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
  | "nationwide-haul-crm";

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
  manualValue?: number; // For manual-stat widgets: default value (editable by user, persisted in localStorage)
  sectionTitle?: string; // For section-header widgets: display title
  trendMonths?: number; // For chart widgets: override date range to show N months of data
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
