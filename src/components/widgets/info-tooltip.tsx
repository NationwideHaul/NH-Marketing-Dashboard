"use client";

import { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { getMetricDefinition } from "@/lib/metric-definitions";

type InfoTooltipProps = {
  metric?: string;
  dataSource?: string;
  /** Override the auto-looked-up title/definition/formula. */
  title?: string;
  definition?: string;
  formula?: string;
  className?: string;
};

// Reusable "?" help icon that opens a modal explaining what a KPI means
// and how it is calculated. Looks up definitions from lib/metric-definitions.
export function InfoTooltip({
  metric,
  dataSource,
  title,
  definition,
  formula,
  className = "",
}: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const looked = getMetricDefinition(metric, dataSource);
  const resolvedTitle = title ?? looked?.title;
  const resolvedDefinition = definition ?? looked?.definition;
  const resolvedFormula = formula ?? looked?.formula;

  if (!resolvedTitle || !resolvedDefinition) return null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(true);
        }}
        className={`p-0.5 rounded-full hover:bg-muted/70 transition-colors inline-flex items-center justify-center ${className}`}
        title={`What is ${resolvedTitle}?`}
        aria-label={`What is ${resolvedTitle}?`}
      >
        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-xl shadow-2xl w-[90vw] max-w-[420px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">{resolvedTitle}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">{resolvedDefinition}</p>
              {resolvedFormula && (
                <div className="rounded-lg bg-muted/30 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-1">
                    How it&apos;s measured
                  </p>
                  <p className="text-xs font-mono text-foreground/80">{resolvedFormula}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
