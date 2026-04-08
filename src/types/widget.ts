export type WidgetType =
  | "stat"
  | "line-chart"
  | "bar-chart"
  | "area-chart"
  | "pie-chart"
  | "table"
  | "goal-tracker";

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
  | "overview";

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  dataSource: DataSource;
  metric: string;
  format: "number" | "currency" | "percent";
  comparisonEnabled?: boolean;
  goalValue?: number;
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
