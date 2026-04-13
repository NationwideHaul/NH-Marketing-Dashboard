"use client";

import useSWR from "swr";
import { Target, MousePointerClick, TrendingUp, TrendingDown, Image as ImageIcon } from "lucide-react"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { format } from "date-fns";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useDateRange } from "@/context/date-range-context";
import { useAccount } from "@/context/account-context";
import type { WidgetConfig } from "@/types/widget";

type Campaign = {
  name: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  leads: number;
  costPerLead: number;
  trend: "up" | "down" | "flat";
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function AdTrendIcon({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up") return <TrendingUp className="h-3 w-3 text-green-600" />;
  if (trend === "down") return <TrendingDown className="h-3 w-3 text-red-500" />;
  return <div className="h-3 w-3" />;
}

function mapCampaigns(rows: any[]): Campaign[] { // eslint-disable-line @typescript-eslint/no-explicit-any
  return rows
    .map((row) => {
      const spend = parseFloat(row.spend || "0");
      const impressions = parseFloat(row.impressions || "0");
      const clicks = parseFloat(row.clicks || "0");
      const ctr = parseFloat(row.ctr || "0");
      const cpc = parseFloat(row.cpc || "0");
      const leadAction = row.actions?.find((a: any) => a.action_type === "lead"); // eslint-disable-line @typescript-eslint/no-explicit-any
      const leads = leadAction ? parseFloat(leadAction.value || "0") : 0;
      const costPerLead = leads > 0 ? spend / leads : 0;
      return {
        name: row.campaign_name || "Unnamed Campaign",
        spend,
        impressions,
        clicks,
        ctr,
        cpc,
        leads,
        costPerLead,
        trend: ctr >= 3 ? ("up" as const) : ctr < 1.5 ? ("down" as const) : ("flat" as const),
      };
    })
    .sort((a, b) => b.spend - a.spend);
}

export function ActiveAdsWidget({ config }: { config: WidgetConfig }) { // eslint-disable-line @typescript-eslint/no-unused-vars
  const { dateRange } = useDateRange();
  const { apiAccountId } = useAccount();
  const startDate = format(dateRange.from, "yyyy-MM-dd");
  const endDate = format(dateRange.to, "yyyy-MM-dd");
  const url = `/api/meta-ads?type=campaigns&startDate=${startDate}&endDate=${endDate}&accountId=${apiAccountId}`;

  const { data, error, isLoading } = useSWR(url, fetcher, {
    refreshInterval: 300000,
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
        Loading campaigns…
      </div>
    );
  }

  if (error || data?.status === "error") {
    return (
      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
        Unable to load campaigns
      </div>
    );
  }

  const rows: any[] = data?.data?.data ?? []; // eslint-disable-line @typescript-eslint/no-explicit-any
  const campaigns = mapCampaigns(rows);

  if (campaigns.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
        No active campaigns in this date range
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto px-3 py-2">
      <div className="space-y-3">
        {campaigns.map((ad, i) => (
          <div key={i} className="rounded-lg border border-border p-3 hover:bg-muted/20 transition-colors">
            {/* Header: name + status */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <AdTrendIcon trend={ad.trend} />
                  <p className="text-xs font-bold text-card-foreground truncate">{ad.name}</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Active</span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MousePointerClick className="h-2.5 w-2.5" /> CPC {formatCurrency(ad.cpc)}
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-foreground shrink-0 ml-2">{formatCurrency(ad.spend)}</span>
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
                <p className={cn("text-xs font-bold", ad.costPerLead > 0 && ad.costPerLead < 55 ? "text-green-600" : "text-foreground")}>
                  {ad.leads > 0 ? formatCurrency(ad.costPerLead) : "—"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
