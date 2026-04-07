"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface DateRange {
  from: Date;
  to: Date;
}

interface ComparisonState {
  enabled: boolean;
  range: DateRange | null;
  label: string;
}

interface DateRangeContextType {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  comparison: ComparisonState;
  setComparisonEnabled: (enabled: boolean) => void;
  setComparisonPreset: (preset: string) => void;
}

const DateRangeContext = createContext<DateRangeContextType | null>(null);

function getComparisonRange(primary: DateRange, preset: string): DateRange {
  const duration = primary.to.getTime() - primary.from.getTime();
  switch (preset) {
    case "previous-period":
      return {
        from: new Date(primary.from.getTime() - duration),
        to: new Date(primary.from.getTime() - 1),
      };
    case "previous-month":
      return {
        from: startOfMonth(subMonths(primary.from, 1)),
        to: endOfMonth(subMonths(primary.from, 1)),
      };
    case "last-year":
      return {
        from: new Date(primary.from.getFullYear() - 1, primary.from.getMonth(), primary.from.getDate()),
        to: new Date(primary.to.getFullYear() - 1, primary.to.getMonth(), primary.to.getDate()),
      };
    default:
      return {
        from: new Date(primary.from.getTime() - duration),
        to: new Date(primary.from.getTime() - 1),
      };
  }
}

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [comparison, setComparison] = useState<ComparisonState>({
    enabled: false,
    range: null,
    label: "previous-period",
  });

  const setComparisonEnabled = (enabled: boolean) => {
    setComparison((prev) => ({
      ...prev,
      enabled,
      range: enabled ? getComparisonRange(dateRange, prev.label) : null,
    }));
  };

  const setComparisonPreset = (preset: string) => {
    setComparison({
      enabled: true,
      range: getComparisonRange(dateRange, preset),
      label: preset,
    });
  };

  const handleSetDateRange = (range: DateRange) => {
    setDateRange(range);
    if (comparison.enabled) {
      setComparison((prev) => ({
        ...prev,
        range: getComparisonRange(range, prev.label),
      }));
    }
  };

  return (
    <DateRangeContext.Provider
      value={{
        dateRange,
        setDateRange: handleSetDateRange,
        comparison,
        setComparisonEnabled,
        setComparisonPreset,
      }}
    >
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error("useDateRange must be used within DateRangeProvider");
  }
  return context;
}
