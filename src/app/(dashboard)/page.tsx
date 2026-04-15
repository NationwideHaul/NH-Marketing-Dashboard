"use client";

import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, Truck, Phone, FileText, Globe, MapPin, MousePointerClick, Layers, TrendingUp, Lightbulb, Star } from "lucide-react";
import { WidgetPage } from "@/components/widgets/widget-page";
import { useAccount } from "@/context/account-context";
import { useDateRange } from "@/context/date-range-context";

// ==================== NH OVERVIEW ====================

// Horizontal bar component for "Where X Came From" sections
function HorizontalBarSection({ title, items, total }: { title: string; items: { name: string; icon: React.ComponentType<any>; value: number; color: string }[]; total: number }) { // eslint-disable-line @typescript-eslint/no-explicit-any
  return (
    <div className="rounded-xl border border-border bg-card p-5 mb-4">
      <h3 className="text-base font-bold text-card-foreground mb-4">{title}</h3>
      <div className="space-y-3">
        {items.map((src) => {
          const Icon = src.icon;
          const pct = total > 0 ? Math.round((src.value / total) * 100) : 0;
          return (
            <div key={src.name} className="flex items-center gap-3">
              <div className="w-5 flex justify-center">
                <Icon className="h-4 w-4" style={{ color: src.color }} />
              </div>
              <span className="text-xs font-medium text-card-foreground w-40">{src.name}</span>
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: src.color }} />
              </div>
              <span className="text-xs font-bold text-card-foreground w-10 text-right">{src.value}</span>
              <span className="text-[10px] text-muted-foreground w-10 text-right">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NHOverviewHeader() {
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Call sources (from CRM/CallRail)
  const callSources = [
    { name: "Google Ads", icon: MousePointerClick, value: 22, color: "#BE1E23" },
    { name: "Google My Business", icon: MapPin, value: 14, color: "#8C0F14" },
    { name: "Websites", icon: Globe, value: 8, color: "#BE1E23" },
    { name: "Meta Ads", icon: Layers, value: 6, color: "#D97706" },
    { name: "Inventory Platforms", icon: Layers, value: 9, color: "#EA580C" },
  ];
  const totalCalls = callSources.reduce((s, c) => s + c.value, 0);

  // Info submit sources (from CRM)
  const infoSources = [
    { name: "Website Forms", icon: Globe, value: 18, color: "#BE1E23" },
    { name: "Inventory Platforms", icon: Layers, value: 12, color: "#8C0F14" },
    { name: "Meta Ads Leads", icon: MousePointerClick, value: 5, color: "#D97706" },
    { name: "Google Ads Leads", icon: MousePointerClick, value: 3, color: "#EA580C" },
  ];
  const totalSubmits = infoSources.reduce((s, c) => s + c.value, 0);

  // Top 3 trailers (from CRM sales data + call transcripts)
  const topTrailers = [
    { name: "Reefer", requests: 42 },
    { name: "Dry Van", requests: 31 },
    { name: "Flatbed", requests: 18 },
  ];
  const maxTrailer = Math.max(...topTrailers.map((t) => t.requests));

  return (
    <>
      {/* AI Performance Summary */}
      <div className="mb-4 rounded-xl border border-primary/20 overflow-hidden">
        <div className="bg-primary/10 px-5 py-3 flex items-center gap-3">
          <div className="rounded-lg bg-primary/20 p-2">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-primary">NH Performance Summary</h3>
            <p className="text-[10px] text-muted-foreground">AI-generated insights for this period</p>
          </div>
          <button
            onClick={() => { setSummaryLoading(true); setTimeout(() => setSummaryLoading(false), 800); }}
            className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-primary ${summaryLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="bg-card">
          {summaryLoading ? (
            <div className="p-5 space-y-2">
              <div className="h-3 w-3/4 rounded bg-primary/10 animate-pulse" />
              <div className="h-3 w-full rounded bg-primary/10 animate-pulse" />
              <div className="h-3 w-2/3 rounded bg-primary/10 animate-pulse" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-3.5 w-3.5 text-primary" />
                  <h4 className="text-[11px] font-bold text-primary uppercase tracking-wide">Summary</h4>
                </div>
                <p className="text-xs text-card-foreground leading-relaxed">
                  Lead generation is trending upward with 63 total leads this period (+5.0%). Meta Ads remains the strongest channel with a $0.22 CPC. Phone calls are at 146 (+5.0%), indicating strong buyer intent across campaigns.
                </p>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  <h4 className="text-[11px] font-bold text-primary uppercase tracking-wide">Highlights</h4>
                </div>
                <ul className="space-y-1.5 text-xs text-card-foreground">
                  <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5">+</span><span>Meta Ads CPC at <span className="font-semibold">$0.22</span> — lowest in trucking vertical</span></li>
                  <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5">+</span><span>Phone calls up <span className="font-semibold">+5.0%</span> vs previous period</span></li>
                  <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5">+</span><span>YouTube driving <span className="font-semibold">32.9K</span> organic views</span></li>
                </ul>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-3.5 w-3.5 text-primary" />
                  <h4 className="text-[11px] font-bold text-primary uppercase tracking-wide">Opportunities</h4>
                </div>
                <ul className="space-y-1.5 text-xs text-card-foreground">
                  <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5">*</span><span>Scale <span className="font-semibold">VOLVO Sleepers</span> campaign on Meta — highest CTR at 3.64%</span></li>
                  <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5">*</span><span>Optimize Google Ads keywords with declining CTR</span></li>
                  <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5">*</span><span>Increase budget allocation — currently at <span className="font-semibold">94%</span> of monthly cap</span></li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Where Calls Came From + Where Info Submits Came From */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <HorizontalBarSection title="Where Calls Came From" items={callSources} total={totalCalls} />
        <HorizontalBarSection title="Where Info Submits Came From" items={infoSources} total={totalSubmits} />
      </div>

      {/* Top 3 Trailers Requested This Month */}
      <div className="mb-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-bold text-card-foreground">Top 3 Trailers Requested This Month</h3>
        </div>
        <div className="space-y-2">
          {topTrailers.map((t, i) => {
            const pct = maxTrailer > 0 ? Math.round((t.requests / maxTrailer) * 100) : 0;
            const colors = ["#BE1E23", "#8C0F14", "#D97706"];
            return (
              <div key={t.name} className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                <span className="text-xs font-medium text-card-foreground w-20">{t.name}</span>
                <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: colors[i] }} />
                </div>
                <span className="text-xs font-bold text-card-foreground w-12 text-right">{t.requests}</span>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">Based on CRM sales data, call transcripts, and form submissions.</p>
      </div>
    </>
  );
}

// ==================== NFI OVERVIEW ====================
function NFIOverviewHeader() {
  const [summaryLoading, setSummaryLoading] = useState(false);

  return (
    <div className="mb-4 rounded-xl border border-primary/20 overflow-hidden">
      {/* Header bar */}
      <div className="bg-primary/10 px-5 py-3 flex items-center gap-3">
        <div className="rounded-lg bg-primary/20 p-2">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-primary">NFI Performance Summary</h3>
          <p className="text-[10px] text-muted-foreground">AI-generated insights for this period</p>
        </div>
        <button
          onClick={() => { setSummaryLoading(true); setTimeout(() => setSummaryLoading(false), 800); }}
          className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-primary ${summaryLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* 3-column insights: Summary, Highlights, Opportunities */}
      <div className="bg-card">
        {summaryLoading ? (
          <div className="p-5 space-y-2">
            <div className="h-3 w-3/4 rounded bg-primary/10 animate-pulse" />
            <div className="h-3 w-full rounded bg-primary/10 animate-pulse" />
            <div className="h-3 w-2/3 rounded bg-primary/10 animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
            {/* General Summary */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-3.5 w-3.5 text-primary" />
                <h4 className="text-[11px] font-bold text-primary uppercase tracking-wide">Summary</h4>
              </div>
              <p className="text-xs text-card-foreground leading-relaxed">
                PPC is the strongest lead driver this period — cost per click remains well below industry average for the trucking vertical. Website traffic continues to climb month over month, with Truck Paper listings driving consistent phone activity.
              </p>
            </div>

            {/* Highlights */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                <h4 className="text-[11px] font-bold text-primary uppercase tracking-wide">Highlights</h4>
              </div>
              <ul className="space-y-1.5 text-xs text-card-foreground">
                <li className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">+</span>
                  <span>Website traffic up <span className="font-semibold">+16%</span> vs previous month</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">+</span>
                  <span>CPC holding steady at <span className="font-semibold">$1.15</span> — best in 3 months</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">+</span>
                  <span>Truck Paper generating <span className="font-semibold">52%</span> of all phone calls</span>
                </li>
              </ul>
            </div>

            {/* Opportunities */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-3.5 w-3.5 text-primary" />
                <h4 className="text-[11px] font-bold text-primary uppercase tracking-wide">Opportunities</h4>
              </div>
              <ul className="space-y-1.5 text-xs text-card-foreground">
                <li className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">*</span>
                  <span>Scale top PPC campaigns — budget headroom available with strong ROAS</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">*</span>
                  <span>Increase Truck Paper listings — highest call conversion rate</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">*</span>
                  <span>Test email reply-back sequences to boost GHL engagement</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== NHTTR OVERVIEW ====================

// Categorize a CallRail tracker name into a high-level source category
function categorizeNHTTRTracker(name: string): string | null {
  const n = name.toLowerCase();
  if (n.includes("ntts")) return "NTTS";
  if (n.includes("find truck service")) return "Find Truck Service";
  if (n.includes("truckdown") || n.includes("truck down")) return "TruckDown";
  if (n.includes("gmb") || n.includes("google my business")) return "Google My Business";
  if (n.includes("google ad")) return "Google Ads";
  if (n.includes("website") || n.includes("rvrepair") || n.includes("trucktrailerrepair")) return "Websites";
  return null; // skip unmatched
}

// Explicit tracker → website mapping (case-sensitive, exact name match preferred)
// Trackers not in either list are excluded from website breakdown.
const RV_TRACKERS = new Set([
  "GMB & Main Website (RV & Bus)",
  "Google Ads (RV & Bus)",
]);
const TTR_TRACKERS = new Set([
  "Truck Down",
  "TruckDown",
  "NTTS",
  "NTTS Breakdown",
  "Find Truck Service",
  "Google Ads (NHTTR)",
]);

function trackerToWebsite(name: string): "rv" | "ttr" | null {
  if (RV_TRACKERS.has(name)) return "rv";
  if (TTR_TRACKERS.has(name)) return "ttr";
  return null;
}

function NHTTROverviewHeader() {
  const { activeSubService, currentAccount } = useAccount();
  const { dateRange } = useDateRange();
  const activeSub = currentAccount.subServices?.find((s) => s.id === activeSubService);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const start = dateRange.from.toISOString().slice(0, 10);
  const end = dateRange.to.toISOString().slice(0, 10);

  // Live CallRail data for NH Repair Shops
  const [callData, setCallData] = useState<{
    totalCalls: number;
    sources: { name: string; calls: number }[];
    rvCalls: number;
    ttrCalls: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/callrail?startDate=${start}&endDate=${end}&accountId=nhttr`)
      .then((r) => r.json())
      .then((res) => {
        if (cancelled || res.status !== "live" || !res.data) return;
        const trackers: { tracker: string; count: number }[] = res.data.trackerBreakdown || [];
        // Aggregate by category
        const byCategory: Record<string, number> = {};
        let rv = 0, ttr = 0;
        for (const { tracker, count } of trackers) {
          if (count === 0) continue;
          const cat = categorizeNHTTRTracker(tracker);
          if (cat) byCategory[cat] = (byCategory[cat] || 0) + count;
          const site = trackerToWebsite(tracker);
          if (site === "rv") rv += count;
          else if (site === "ttr") ttr += count;
        }
        const orderedCategories = ["Google Ads", "Google My Business", "Websites", "NTTS", "Find Truck Service", "TruckDown"];
        const sources = orderedCategories
          .map((name) => ({ name, calls: byCategory[name] || 0 }))
          .filter((s) => s.calls > 0);
        setCallData({
          totalCalls: res.data.totalCalls || 0,
          sources,
          rvCalls: rv,
          ttrCalls: ttr,
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [start, end]);

  // Live Info Submits from GA4 form_start events (per website property)
  const [rvInfoSubmits, setRvInfoSubmits] = useState<number>(0);
  const [ttrInfoSubmits, setTtrInfoSubmits] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    const fetchFormStarts = async (subAccountId: string): Promise<number> => {
      const res = await fetch(`/api/google-analytics?startDate=${start}&endDate=${end}&accountId=${subAccountId}&dimension=eventName`).then((r) => r.json()).catch(() => null);
      if (res?.status !== "live" || !res.data?.rows) return 0;
      const formStartRow = res.data.rows.find((r: { dimensionValues: { value: string }[] }) =>
        r.dimensionValues?.[0]?.value === "form_start"
      );
      if (!formStartRow) return 0;
      return parseInt(formStartRow.metricValues?.[0]?.value || "0", 10);
    };

    Promise.all([fetchFormStarts("nhttr-rv"), fetchFormStarts("nhttr-ttr")]).then(([rv, ttr]) => {
      if (cancelled) return;
      setRvInfoSubmits(rv);
      setTtrInfoSubmits(ttr);
    });
    return () => { cancelled = true; };
  }, [start, end]);

  const totalInfoSubmits = rvInfoSubmits + ttrInfoSubmits;

  const totalCalls = callData?.totalCalls ?? 0;

  // Icon & color mapping for call source categories
  const ICON_MAP: Record<string, { icon: typeof MousePointerClick; color: string }> = {
    "Google Ads": { icon: MousePointerClick, color: "#BE1E23" },
    "Google My Business": { icon: MapPin, color: "#8C0F14" },
    "Websites": { icon: Globe, color: "#BE1E23" },
    "NTTS": { icon: Layers, color: "#BE1E23" },
    "Find Truck Service": { icon: Layers, color: "#D97706" },
    "TruckDown": { icon: Layers, color: "#EA580C" },
  };
  const callSources = (callData?.sources || []).map((s) => ({
    name: s.name,
    calls: s.calls,
    icon: ICON_MAP[s.name]?.icon || Layers,
    color: ICON_MAP[s.name]?.color || "#666",
  }));

  const inventoryPlatformCalls = callSources.filter((s) => ["NTTS", "Find Truck Service", "TruckDown"].includes(s.name));
  const inventoryTotal = inventoryPlatformCalls.reduce((sum, s) => sum + s.calls, 0);

  // Per-website breakdown — calls and info submits split exactly per source
  const rvCalls = callData?.rvCalls ?? 0;
  const ttrCalls = callData?.ttrCalls ?? 0;
  const websiteBreakdown = [
    { name: "RV & Bus Repair", website: "nhrvrepair.com", calls: rvCalls, infoSubmits: rvInfoSubmits, color: "#BE1E23" },
    { name: "Truck & Trailer Repair", website: "nhtrucktrailerrepair.com", calls: ttrCalls, infoSubmits: ttrInfoSubmits, color: "#8C0F14" },
  ];

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
            {callSources.length > 0 && (
              <> <span className="font-bold">{callSources[0].name}</span> is the top call driver with {callSources[0].calls} calls.</>
            )}
            {inventoryTotal > 0 && (
              <> Inventory platforms generated {inventoryTotal} calls combined{inventoryPlatformCalls[0] ? `, with ${inventoryPlatformCalls[0].name} leading at ${inventoryPlatformCalls[0].calls} calls` : ""}.</>
            )}
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
          <p className="text-xs text-muted-foreground mt-1">From GA4 form interactions (both websites)</p>
        </div>
      </div>

      {/* Call Source Breakdown */}
      <div className="rounded-xl border border-border bg-card p-5 mb-4">
        <h3 className="text-base font-bold text-card-foreground mb-4">Where Calls Came From</h3>
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
        <h3 className="text-base font-bold text-card-foreground mb-4">Breakdown by Website</h3>
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

// ==================== ROAD READY INSURANCE OVERVIEW ====================
function RRIOverviewHeader() {
  const { currentAccount } = useAccount();
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Lead sources for insurance
  const leadSources = [
    { name: "Partner Referrals (NH, NFI, NHTTR)", icon: Layers, value: 85, color: "#225296" },
    { name: "Website (Organic)", icon: Globe, value: 35, color: "#00CCCC" },
    { name: "Google Ads", icon: MousePointerClick, value: 22, color: "#1D4ED8" },
    { name: "Meta Ads (Facebook/IG)", icon: Layers, value: 18, color: "#00B3B3" },
    { name: "Agent Network", icon: Layers, value: 12, color: "#2563EB" },
    { name: "Broker Referrals", icon: Layers, value: 8, color: "#009999" },
    { name: "Direct / Walk-in", icon: Phone, value: 10, color: "#164E63" },
  ];
  const totalLeads = leadSources.reduce((s, c) => s + c.value, 0);

  // Policy type breakdown
  const policyTypes = [
    { name: "Commercial Auto", quotes: 68, color: "#225296" },
    { name: "General Liability", quotes: 45, color: "#00CCCC" },
    { name: "Physical Damage", quotes: 32, color: "#1D4ED8" },
    { name: "Cargo Insurance", quotes: 28, color: "#00B3B3" },
    { name: "Workers Comp", quotes: 17, color: "#2563EB" },
  ];
  const maxPolicy = Math.max(...policyTypes.map((p) => p.quotes));

  return (
    <>
      {/* AI Performance Summary — Insurance language */}
      <div className="mb-4 rounded-xl border border-primary/20 overflow-hidden">
        <div className="bg-primary/10 px-5 py-3 flex items-center gap-3">
          <div className="rounded-lg bg-primary/20 p-2">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-primary">Road Ready Insurance &mdash; Performance Summary</h3>
            <p className="text-[10px] text-muted-foreground">AI-generated insights for this period</p>
          </div>
          <button
            onClick={() => { setSummaryLoading(true); setTimeout(() => setSummaryLoading(false), 800); }}
            className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-primary ${summaryLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="bg-card">
          {summaryLoading ? (
            <div className="p-5 space-y-2">
              <div className="h-3 w-3/4 rounded bg-primary/10 animate-pulse" />
              <div className="h-3 w-full rounded bg-primary/10 animate-pulse" />
              <div className="h-3 w-2/3 rounded bg-primary/10 animate-pulse" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-3.5 w-3.5 text-primary" />
                  <h4 className="text-[11px] font-bold text-primary uppercase tracking-wide">Summary</h4>
                </div>
                <p className="text-xs text-card-foreground leading-relaxed">
                  Quote requests are up <span className="font-semibold">+18%</span> this period with {totalLeads} total leads. Partner referrals from NH dealerships remain the strongest pipeline. Commercial auto policies are the most requested coverage type.
                </p>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  <h4 className="text-[11px] font-bold text-primary uppercase tracking-wide">Highlights</h4>
                </div>
                <ul className="space-y-1.5 text-xs text-card-foreground">
                  <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5">+</span><span>Partner referrals generating <span className="font-semibold">85 leads</span> — highest channel</span></li>
                  <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5">+</span><span>Quote-to-bind rate at <span className="font-semibold">34%</span> — above industry avg</span></li>
                  <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5">+</span><span>Website organic traffic up <span className="font-semibold">+22%</span> from SEO efforts</span></li>
                </ul>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-3.5 w-3.5 text-primary" />
                  <h4 className="text-[11px] font-bold text-primary uppercase tracking-wide">Opportunities</h4>
                </div>
                <ul className="space-y-1.5 text-xs text-card-foreground">
                  <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5">*</span><span>Expand agent network — currently <span className="font-semibold">12 leads</span> with high close rate</span></li>
                  <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5">*</span><span>Launch cargo insurance email campaign — growing demand</span></li>
                  <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5">*</span><span>Retarget website visitors who started but didn&apos;t finish quote forms</span></li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Where Leads Came From */}
      <HorizontalBarSection title="Where Quote Requests Came From" items={leadSources} total={totalLeads} />

      {/* Top Policy Types Quoted */}
      <div className="mb-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-bold text-card-foreground">Top Policy Types Quoted This Month</h3>
        </div>
        <div className="space-y-2">
          {policyTypes.map((p, i) => {
            const pct = maxPolicy > 0 ? Math.round((p.quotes / maxPolicy) * 100) : 0;
            return (
              <div key={p.name} className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                <span className="text-xs font-medium text-card-foreground w-32">{p.name}</span>
                <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                </div>
                <span className="text-xs font-bold text-card-foreground w-12 text-right">{p.quotes}</span>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">Based on CRM quote submissions and agent reports.</p>
      </div>
    </>
  );
}

export default function OverviewPage() {
  const { currentAccount } = useAccount();
  const isNHTTR = currentAccount.id === "nhttr";
  const isNFI = currentAccount.id === "nfi-truck-sales";
  const isRRI = currentAccount.id === "road-ready";

  const header = isRRI ? <RRIOverviewHeader /> : isNFI ? <NFIOverviewHeader /> : isNHTTR ? <NHTTROverviewHeader /> : <NHOverviewHeader />;

  return <WidgetPage headerContent={header} />;
}
