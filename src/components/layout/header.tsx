"use client";

import { useState } from "react";
import { Calendar, ChevronDown, GitCompareArrows } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { useDateRange } from "@/context/date-range-context";
import { cn } from "@/lib/utils";

const presets = [
  { label: "Last 7 days", getDates: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: "Last 30 days", getDates: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: "This month", getDates: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  { label: "Last month", getDates: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: "Last 90 days", getDates: () => ({ from: subDays(new Date(), 90), to: new Date() }) },
  { label: "Last 6 months", getDates: () => ({ from: subMonths(new Date(), 6), to: new Date() }) },
];

const comparisonPresets = [
  { label: "Previous period", value: "previous-period" },
  { label: "Previous month", value: "previous-month" },
  { label: "Same period last year", value: "last-year" },
];

export function Header() {
  const { dateRange, setDateRange, comparison, setComparisonEnabled, setComparisonPreset } = useDateRange();
  const [showPresets, setShowPresets] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <h1 className="text-lg font-semibold text-foreground">
        Marketing Dashboard
      </h1>

      <div className="flex items-center gap-2">
        {/* Comparison Toggle */}
        <div className="relative">
          <button
            onClick={() => {
              if (comparison.enabled) {
                setComparisonEnabled(false);
                setShowCompare(false);
              } else {
                setShowCompare(!showCompare);
              }
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors",
              comparison.enabled
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            <GitCompareArrows className="h-4 w-4" />
            {comparison.enabled ? "Comparing" : "Compare"}
          </button>

          {showCompare && !comparison.enabled && (
            <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-md border border-border bg-card shadow-lg">
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                Compare with
              </div>
              {comparisonPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => {
                    setComparisonPreset(preset.value);
                    setShowCompare(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date Range Picker */}
        <div className="relative">
          <button
            onClick={() => { setShowPresets(!showPresets); setShowCompare(false); }}
            className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(dateRange.from, "MMM d, yyyy")} –{" "}
              {format(dateRange.to, "MMM d, yyyy")}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>

          {showPresets && (
            <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-md border border-border bg-card shadow-lg">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    setDateRange(preset.getDates());
                    setShowPresets(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors first:rounded-t-md last:rounded-b-md"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
