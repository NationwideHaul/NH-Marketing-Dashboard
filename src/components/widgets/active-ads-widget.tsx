"use client";

import { Target, Eye, MousePointerClick, DollarSign, Users, TrendingUp, TrendingDown, Image } from "lucide-react";
import { formatNumber, formatCurrency, formatPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { WidgetConfig } from "@/types/widget";

// Mock data -- will be replaced by real Meta Ads API data (campaigns endpoint)
const activeAds = [
  {
    name: "VOLVO Sleepers — Lookalike Audience",
    status: "Active",
    objective: "Lead Generation",
    adText: "Looking for a reliable sleeper truck? Nationwide Haul has the best selection of VOLVO sleepers in FL. Financing available. Call today!",
    spend: 1247.50,
    impressions: 45200,
    clicks: 1645,
    ctr: 3.64,
    cpc: 0.76,
    leads: 23,
    costPerLead: 54.24,
    trend: "up" as const,
  },
  {
    name: "Reefer Trailers — Owner Operators",
    status: "Active",
    objective: "Lead Generation",
    adText: "New and used reefer trailers in stock. Great prices for owner-operators. Visit our Lakeland lot or browse online.",
    spend: 892.30,
    impressions: 38100,
    clicks: 1120,
    ctr: 2.94,
    cpc: 0.80,
    leads: 18,
    costPerLead: 49.57,
    trend: "up" as const,
  },
  {
    name: "Flatbed Inventory — Retargeting",
    status: "Active",
    objective: "Conversions",
    adText: "You looked at our flatbeds — they're still available! 15+ units in stock. Step decks, standards, and more.",
    spend: 534.00,
    impressions: 22400,
    clicks: 687,
    ctr: 3.07,
    cpc: 0.78,
    leads: 11,
    costPerLead: 48.55,
    trend: "flat" as const,
  },
  {
    name: "Dry Van Clearance — Broad",
    status: "Active",
    objective: "Traffic",
    adText: "End-of-quarter dry van clearance! Prices starting at $18,500. Limited inventory — first come, first served.",
    spend: 312.80,
    impressions: 18700,
    clicks: 423,
    ctr: 2.26,
    cpc: 0.74,
    leads: 5,
    costPerLead: 62.56,
    trend: "down" as const,
  },
  {
    name: "Brand Awareness — Video Campaign",
    status: "Active",
    objective: "Brand Awareness",
    adText: "Nationwide Haul — your trusted truck and trailer dealership in Florida. Watch our latest inventory walkthrough.",
    spend: 198.40,
    impressions: 52300,
    clicks: 312,
    ctr: 0.60,
    cpc: 0.64,
    leads: 2,
    costPerLead: 99.20,
    trend: "flat" as const,
  },
];

function AdTrendIcon({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up") return <TrendingUp className="h-3 w-3 text-green-600" />;
  if (trend === "down") return <TrendingDown className="h-3 w-3 text-red-500" />;
  return <div className="h-3 w-3" />;
}

export function ActiveAdsWidget({ config }: { config: WidgetConfig }) {
  return (
    <div className="h-full overflow-auto px-3 py-2">
      <div className="space-y-3">
        {activeAds.map((ad, i) => (
          <div key={i} className="rounded-lg border border-border p-3 hover:bg-muted/20 transition-colors">
            {/* Header: name + status + objective */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <AdTrendIcon trend={ad.trend} />
                  <p className="text-xs font-bold text-card-foreground truncate">{ad.name}</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">{ad.status}</span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Target className="h-2.5 w-2.5" /> {ad.objective}
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-foreground shrink-0 ml-2">{formatCurrency(ad.spend)}</span>
            </div>

            {/* Ad text preview */}
            <div className="flex gap-3 mb-2">
              <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center shrink-0">
                <Image className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">{ad.adText}</p>
            </div>

            {/* Metrics row */}
            <div className="grid grid-cols-5 gap-2 pt-2 border-t border-border">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">Impressions</p>
                <p className="text-xs font-bold text-foreground">{formatNumber(ad.impressions)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">Clicks</p>
                <p className="text-xs font-bold text-foreground">{formatNumber(ad.clicks)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">CTR</p>
                <p className={cn("text-xs font-bold", ad.ctr >= 3 ? "text-green-600" : ad.ctr >= 2 ? "text-foreground" : "text-red-500")}>{ad.ctr.toFixed(2)}%</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">Leads</p>
                <p className="text-xs font-bold text-foreground">{ad.leads}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">CPL</p>
                <p className={cn("text-xs font-bold", ad.costPerLead < 55 ? "text-green-600" : "text-foreground")}>{formatCurrency(ad.costPerLead)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
