export type ChartType = "line" | "bar" | "area" | "pie";

export interface TimeSeriesPoint {
  date: string;
  value: number;
  comparisonValue?: number;
}

export interface ChartConfig {
  title: string;
  metricKey: string;
  defaultType: ChartType;
  supportedTypes: ChartType[];
  format: "number" | "currency" | "percent";
}

export interface MultiSeriesPoint {
  date: string;
  [key: string]: string | number;
}

export interface PieDataPoint {
  name: string;
  value: number;
  fill?: string;
}

export interface BudgetItem {
  platform: string;
  budget: number;
  spent: number;
  remaining: number;
  pacing: number; // percentage through budget
}
