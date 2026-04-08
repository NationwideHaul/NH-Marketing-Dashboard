"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { Calendar, ChevronDown, GitCompareArrows, Pencil, Plus, RotateCcw } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { useDateRange } from "@/context/date-range-context";
import { useDashboard } from "@/context/dashboard-context";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

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
  const { editMode, toggleEditMode, setShowPicker, resetDashboard } = useDashboard();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [tempRange, setTempRange] = useState<{ from?: Date; to?: Date }>({ from: dateRange.from, to: dateRange.to });

  const handleSetRange = () => {
    if (tempRange.from && tempRange.to) {
      setDateRange({ from: tempRange.from, to: tempRange.to });
    }
    setShowDatePicker(false);
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-2">
        <h1 className="text-base font-semibold text-foreground">Marketing Dashboard</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Edit Mode */}
        <button
          onClick={toggleEditMode}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            editMode ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted"
          )}
        >
          <Pencil className="h-3 w-3" />
          {editMode ? "Done" : "Edit"}
        </button>

        {editMode && (
          <>
            <button onClick={() => setShowPicker(true)}
              className="flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors">
              <Plus className="h-3 w-3" /> Add Widget
            </button>
            <button onClick={resetDashboard}
              className="flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors" title="Reset to default">
              <RotateCcw className="h-3 w-3" />
            </button>
          </>
        )}

        {/* Comparison Toggle */}
        <div className="relative">
          <button
            onClick={() => {
              if (comparison.enabled) { setComparisonEnabled(false); setShowCompare(false); }
              else setShowCompare(!showCompare);
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
              comparison.enabled ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            <GitCompareArrows className="h-3 w-3" />
            {comparison.enabled ? "Comparing" : "Compare"}
          </button>
          {showCompare && !comparison.enabled && (
            <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-md border border-border bg-card shadow-lg">
              {comparisonPresets.map((p) => (
                <button key={p.value} onClick={() => { setComparisonPreset(p.value); setShowCompare(false); }}
                  className="block w-full px-3 py-2 text-left text-xs hover:bg-muted transition-colors">{p.label}</button>
              ))}
            </div>
          )}
        </div>

        {/* Date Range Picker */}
        <button
          onClick={() => { setShowDatePicker(!showDatePicker); setTempRange({ from: dateRange.from, to: dateRange.to }); }}
          className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs hover:bg-muted transition-colors"
        >
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span>{format(dateRange.from, "MMM d")} – {format(dateRange.to, "MMM d, yyyy")}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>

      {/* Calendar Popup */}
      {showDatePicker && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 flex items-start justify-end pt-14 pr-4" style={{ zIndex: 9999 }}>
          <div className="absolute inset-0" onClick={() => setShowDatePicker(false)} />
          <div className="relative bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-[640px]">
            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 mb-3 pb-3 border-b border-gray-200">
              {presets.map((p) => (
                <button key={p.label} onClick={() => {
                  const dates = p.getDates();
                  setTempRange({ from: dates.from, to: dates.to });
                  setDateRange(dates);
                  setShowDatePicker(false);
                }}
                className="px-2.5 py-1 text-xs border border-gray-200 rounded-md hover:bg-red-50 hover:border-red-300 transition-colors">
                  {p.label}
                </button>
              ))}
            </div>

            {/* Date inputs */}
            <div className="flex items-center gap-2 mb-3">
              <input type="text" readOnly value={tempRange.from ? format(tempRange.from, "MMM d, yyyy") : ""}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-md bg-gray-50 w-32 text-center" />
              <span className="text-xs text-gray-400">–</span>
              <input type="text" readOnly value={tempRange.to ? format(tempRange.to, "MMM d, yyyy") : ""}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-md bg-gray-50 w-32 text-center" />
            </div>

            {/* Calendar */}
            <DayPicker
              mode="range"
              selected={{ from: tempRange.from, to: tempRange.to }}
              onSelect={(range) => {
                if (range) setTempRange({ from: range.from, to: range.to });
              }}
              numberOfMonths={2}
              defaultMonth={subMonths(new Date(), 1)}
              style={{ fontSize: "13px" }}
            />

            {/* Set Range Button */}
            <button onClick={handleSetRange}
              className="w-full mt-2 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Set Range
            </button>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
