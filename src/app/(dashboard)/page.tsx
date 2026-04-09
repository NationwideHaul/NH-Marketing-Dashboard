"use client";

import { useState } from "react";
import { Sparkles, RefreshCw, Truck, Phone, FileText, Globe, MapPin, MousePointerClick, Layers } from "lucide-react";
import { WidgetPage } from "@/components/widgets/widget-page";
import { useAccount } from "@/context/account-context";

// ==================== NH / NFI OVERVIEW ====================
function NHOverviewHeader() {
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary] = useState(
    "Lead generation is trending upward with 63 total leads this period (+5.0%). Meta Ads continues to be the strongest channel with a $0.22 average CPC — one of the lowest in the trucking industry.\n\nPhone calls are up to 146 (+5.0%), indicating strong buyer intent from current campaigns. Google Ads spend is at $9,407 (94% of monthly budget) — consider increasing budget allocation for top-performing campaigns.\n\nKey opportunities: Scale the VOLVO Sleepers campaign on Meta (highest CTR at 3.64%), optimize Google Ads keywords with declining CTR, and continue YouTube content strategy which is driving 32.9K views organically."
  );

  return (
    <>
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
        <p className="text-[10px] text-muted-foreground mt-2">Based on call transcripts, form submissions, and CRM tags.</p>
      </div>
    </>
  );
}

// ==================== NHTTR OVERVIEW ====================
function NHTTROverviewHeader() {
  const { activeSubService, currentAccount } = useAccount();
  const activeSub = currentAccount.subServices?.find((s) => s.id === activeSubService);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Placeholder data -- will be replaced by real CallRail data from NH Repair Shops
  const totalCalls = 59;
  const totalInfoSubmits = 12;

  // Source breakdown for calls
  const callSources = [
    { name: "Google Ads", icon: MousePointerClick, calls: 22, color: "#4285F4" },
    { name: "Google My Business", icon: MapPin, calls: 14, color: "#34A853" },
    { name: "Websites", icon: Globe, calls: 8, color: "#BE1E23" },
    { name: "NTTS", icon: Layers, calls: 6, color: "#BE1E23" },
    { name: "Find Truck Service", icon: Layers, calls: 5, color: "#2563EB" },
    { name: "TruckDown", icon: Layers, calls: 4, color: "#16A34A" },
  ];

  // Per-website breakdown (calls + info submits)
  const websiteBreakdown = [
    { name: "RV & Bus Repair", website: "nhrvrepair.com", calls: 34, infoSubmits: 7, color: "#BE1E23" },
    { name: "Truck & Trailer Repair", website: "nhtrucktrailerrepair.com", calls: 25, infoSubmits: 5, color: "#8C0F14" },
  ];

  const inventoryPlatformCalls = callSources.filter((s) => ["NTTS", "Find Truck Service", "TruckDown"].includes(s.name));
  const inventoryTotal = inventoryPlatformCalls.reduce((sum, s) => sum + s.calls, 0);

  return (
    <>
      {/* AI Performance Summary */}
      <div className="mb-4 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-bold text-primary">Performance Summary</h3>
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-1">
            {activeSub?.name || "All Services"}
          </span>
          <button
            onClick={() => { setSummaryLoading(true); setTimeout(() => setSummaryLoading(false), 800); }}
            className="ml-auto p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-primary ${summaryLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
        {summaryLoading ? (
          <div className="space-y-2">
            <div className="h-3 w-3/4 rounded bg-primary/10 animate-pulse" />
            <div className="h-3 w-full rounded bg-primary/10 animate-pulse" />
          </div>
        ) : (
          <p className="text-sm text-card-foreground leading-relaxed">
            NH Repair Shops received <span className="font-bold">{totalCalls} calls</span> and <span className="font-bold">{totalInfoSubmits} info submits</span> this period.
            Google Ads is the top call driver with {callSources[0].calls} calls. Inventory platforms generated {inventoryTotal} calls combined, with Find Truck Service leading at {inventoryPlatformCalls.find((s) => s.name === "Find Truck Service")?.calls || 0} calls.
          </p>
        )}
      </div>

      {/* Total Calls & Info Submits */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <Phone className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Total Calls to Shop</span>
          </div>
          <p className="text-4xl font-bold text-foreground">{totalCalls}</p>
          <p className="text-xs text-muted-foreground mt-1">From CallRail (NH Repair Shops)</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Total Info Submits</span>
          </div>
          <p className="text-4xl font-bold text-foreground">{totalInfoSubmits}</p>
          <p className="text-xs text-muted-foreground mt-1">Website forms and platform inquiries</p>
        </div>
      </div>

      {/* Call Source Breakdown */}
      <div className="rounded-xl border border-border bg-card p-5 mb-4">
        <h3 className="text-sm font-bold text-card-foreground mb-4">Where Calls Came From</h3>
        <div className="space-y-3">
          {callSources.map((src) => {
            const Icon = src.icon;
            const pct = totalCalls > 0 ? Math.round((src.calls / totalCalls) * 100) : 0;
            return (
              <div key={src.name} className="flex items-center gap-3">
                <div className="w-5 flex justify-center">
                  <Icon className="h-4 w-4" style={{ color: src.color }} />
                </div>
                <span className="text-xs font-medium text-card-foreground w-36">{src.name}</span>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: src.color }} />
                </div>
                <span className="text-xs font-bold text-card-foreground w-12 text-right">{src.calls}</span>
                <span className="text-[10px] text-muted-foreground w-10 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-Website Breakdown */}
      <div className="rounded-xl border border-border bg-card p-5 mb-4">
        <h3 className="text-sm font-bold text-card-foreground mb-4">Breakdown by Website</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {websiteBreakdown.map((site) => (
            <div key={site.name} className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: site.color }} />
                <div>
                  <p className="text-sm font-bold text-card-foreground">{site.name}</p>
                  <p className="text-[10px] text-muted-foreground">{site.website}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-muted/50 p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Calls</span>
                  </div>
                  <p className="text-2xl font-bold text-card-foreground">{site.calls}</p>
                </div>
                <div className="rounded-md bg-muted/50 p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Info Submits</span>
                  </div>
                  <p className="text-2xl font-bold text-card-foreground">{site.infoSubmits}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inventory Platforms Quick Summary */}
      <div className="rounded-xl border border-border bg-card p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-bold text-card-foreground">Inventory Platform Calls</h3>
          <span className="text-xs text-muted-foreground">({inventoryTotal} total)</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {inventoryPlatformCalls.map((src) => (
            <div key={src.name} className="rounded-lg border border-border p-3 text-center">
              <div className="w-2 h-2 rounded-full mx-auto mb-2" style={{ backgroundColor: src.color }} />
              <p className="text-2xl font-bold text-card-foreground">{src.calls}</p>
              <p className="text-[10px] text-muted-foreground">{src.name}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function OverviewPage() {
  const { currentAccount } = useAccount();
  const isNHTTR = currentAccount.id === "nhttr";

  const header = isNHTTR ? <NHTTROverviewHeader /> : <NHOverviewHeader />;

  return <WidgetPage headerContent={header} />;
}
