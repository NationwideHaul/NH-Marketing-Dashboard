"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { Calendar, ChevronDown, GitCompareArrows, LogOut, Pencil, Plus, RotateCcw } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { signOut } from "next-auth/react";
import { useDateRange } from "@/context/date-range-context";
import { useDashboard } from "@/context/dashboard-context";
import { useAccount } from "@/context/account-context";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import { SubServiceToggle } from "./sub-service-toggle";

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
  const { currentAccount } = useAccount();
  const primaryColor = currentAccount.colors.primary;
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
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-foreground">Marketing Dashboard</h1>
        <SubServiceToggle />
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
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white transition-colors"
              style={{ backgroundColor: primaryColor }}>
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

        {/* Sign Out */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Sign out"
          className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
        >
          <LogOut className="h-3 w-3" />
          <span>Sign out</span>
        </button>
      </div>

      {/* Calendar Popup */}
      {showDatePicker && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 flex items-start justify-end pt-14 pr-4" style={{ zIndex: 9999 }}>
          <div className="absolute inset-0" onClick={() => setShowDatePicker(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden w-auto">
            {/* Presets row */}
            <div className="flex gap-1 px-3 pt-3 pb-2">
              {presets.map((p) => (
                <button key={p.label} onClick={() => {
                  const dates = p.getDates();
                  setTempRange({ from: dates.from, to: dates.to });
                  setDateRange(dates);
                  setShowDatePicker(false);
                }}
                className="px-2 py-1 text-[11px] font-medium rounded-md border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors">
                  {p.label}
                </button>
              ))}
            </div>

            <div className="border-t border-gray-100" />

            {/* Date inputs + calendar */}
            <div className="px-3 pt-2 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 px-2.5 py-1 text-[11px] font-medium border border-gray-200 rounded-md bg-gray-50 text-center text-gray-700">
                  {tempRange.from ? format(tempRange.from, "MMM d, yyyy") : "Start"}
                </div>
                <span className="text-[10px] text-gray-300 font-medium">→</span>
                <div className="flex-1 px-2.5 py-1 text-[11px] font-medium border border-gray-200 rounded-md bg-gray-50 text-center text-gray-700">
                  {tempRange.to ? format(tempRange.to, "MMM d, yyyy") : "End"}
                </div>
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
                classNames={{
                  months: "flex gap-2",
                  month_caption: "text-xs font-semibold text-gray-800 pb-1",
                  weekday: "text-[10px] font-medium text-gray-400 w-7 h-6",
                  day_button: "w-7 h-7 text-[11px] rounded-md transition-colors",
                  day: "p-0",
                  today: "font-bold",
                  selected: "!bg-[var(--brand)] !text-white !rounded-md",
                  range_start: "!bg-[var(--brand)] !text-white !rounded-l-md !rounded-r-none",
                  range_end: "!bg-[var(--brand)] !text-white !rounded-r-md !rounded-l-none",
                  range_middle: "!bg-[var(--brand-light)] !text-[var(--brand)] !rounded-none",
                  chevron: "fill-gray-500 w-3.5 h-3.5",
                  nav: "gap-1",
                }}
                style={{
                  "--brand": primaryColor,
                  "--brand-light": primaryColor + "18",
                  fontSize: "11px",
                } as React.CSSProperties}
              />

              {/* Apply button */}
              <button onClick={handleSetRange}
                className="w-full mt-2 py-1.5 text-white text-xs font-semibold rounded-lg transition-colors hover:opacity-90"
                style={{ backgroundColor: primaryColor }}>
                Apply Range
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
