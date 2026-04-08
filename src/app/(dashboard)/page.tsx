"use client";

import { useState } from "react";
import { Sparkles, RefreshCw, Truck } from "lucide-react";
import { WidgetPage } from "@/components/widgets/widget-page";

export default function OverviewPage() {
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary] = useState(
    "Lead generation is trending upward with 63 total leads this period (+5.0%). Meta Ads continues to be the strongest channel with a $0.22 average CPC — one of the lowest in the trucking industry.\n\nPhone calls are up to 146 (+5.0%), indicating strong buyer intent from current campaigns. Google Ads spend is at $9,407 (94% of monthly budget) — consider increasing budget allocation for top-performing campaigns.\n\nKey opportunities: Scale the VOLVO Sleepers campaign on Meta (highest CTR at 3.64%), optimize Google Ads keywords with declining CTR, and continue YouTube content strategy which is driving 32.9K views organically."
  );

  return (
    <div>
      {/* AI Summary */}
      <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-primary">AI Performance Summary</h3>
          <button
            onClick={() => { setSummaryLoading(true); setTimeout(() => setSummaryLoading(false), 800); }}
            className="ml-auto p-1 rounded hover:bg-primary/10 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-primary ${summaryLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
        {summaryLoading ? (
          <div className="space-y-2">
            <div className="h-3 w-3/4 rounded bg-primary/10 animate-pulse" />
            <div className="h-3 w-full rounded bg-primary/10 animate-pulse" />
            <div className="h-3 w-2/3 rounded bg-primary/10 animate-pulse" />
          </div>
        ) : (
          <p className="text-sm text-card-foreground leading-relaxed whitespace-pre-line">{summary}</p>
        )}
      </div>

      {/* Top 3 Trailers Requested */}
      <div className="mb-4 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-card-foreground">Top 3 Trailers Requested This Month</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md bg-muted/50 p-3 text-center">
            <p className="text-lg font-bold text-card-foreground">Reefer</p>
            <p className="text-xs text-muted-foreground">42 requests</p>
          </div>
          <div className="rounded-md bg-muted/50 p-3 text-center">
            <p className="text-lg font-bold text-card-foreground">Dry Van</p>
            <p className="text-xs text-muted-foreground">31 requests</p>
          </div>
          <div className="rounded-md bg-muted/50 p-3 text-center">
            <p className="text-lg font-bold text-card-foreground">Flatbed</p>
            <p className="text-xs text-muted-foreground">18 requests</p>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">Based on call transcripts, form submissions, and CRM tags. Connect live data to update automatically.</p>
      </div>

      {/* Widgets Grid */}
      <WidgetPage />
    </div>
  );
}
