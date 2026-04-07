"use client";

import { BarChart3, LineChart, AreaChart, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChartType } from "@/types/chart";

const chartIcons: Record<ChartType, typeof LineChart> = {
  line: LineChart,
  bar: BarChart3,
  area: AreaChart,
  pie: PieChart,
};

const chartLabels: Record<ChartType, string> = {
  line: "Line",
  bar: "Bar",
  area: "Area",
  pie: "Pie",
};

interface ChartTypeSelectorProps {
  selected: ChartType;
  supported: ChartType[];
  onChange: (type: ChartType) => void;
}

export function ChartTypeSelector({ selected, supported, onChange }: ChartTypeSelectorProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-md border border-border bg-muted p-0.5">
      {supported.map((type) => {
        const Icon = chartIcons[type];
        return (
          <button
            key={type}
            onClick={() => onChange(type)}
            title={chartLabels[type]}
            className={cn(
              "rounded p-1.5 transition-colors",
              selected === type
                ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
