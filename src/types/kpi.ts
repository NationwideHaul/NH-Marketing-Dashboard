export interface KPIMetric {
  id: string;
  label: string;
  value: number;
  previousValue?: number;
  format: "number" | "currency" | "percent";
  trend?: "up" | "down" | "flat";
  changePercent?: number;
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
