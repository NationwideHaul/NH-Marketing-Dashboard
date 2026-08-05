export interface KPIMetric {
  id: string;
  label: string;
  value: number;
  previousValue?: number;
  format: "number" | "currency" | "percent";
  trend?: "up" | "down" | "flat";
  changePercent?: number;
  // For percent-format metrics the change is expressed in percentage POINTS
  // (current − previous), not a percent-of-a-percent; "pts" tells the UI to
  // label it accordingly. Defaults to "%".
  changeUnit?: "%" | "pts";
}

export interface PlatformData {
  platform: string;
  metrics: KPIMetric[];
  dateRange: { start: string; end: string };
}

export interface DateRange {
  from: Date;
  to: Date;
}

export type Platform =
  | "overview"
  | "google-analytics"
  | "google-ads"
  | "gmb"
  | "social-media"
  | "facebook"
  | "instagram"
  | "youtube"
  | "meta-ads"
  | "ringcentral"
  | "go-high-level"
  | "linkedin"
  | "budget";
