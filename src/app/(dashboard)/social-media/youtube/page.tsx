"use client";

import { Eye } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { WidgetPage } from "@/components/widgets/widget-page";
import { formatNumber } from "@/lib/utils";

// Mock data -- will be replaced by real YouTube API data
const channelViews = 3841;
const dataDays = 28;
const viewsChart = [
  { date: "Mar 12", value: 80 }, { date: "Mar 15", value: 95 }, { date: "Mar 18", value: 110 },
  { date: "Mar 21", value: 130 }, { date: "Mar 24", value: 160 }, { date: "Mar 27", value: 190 },
  { date: "Mar 30", value: 170 }, { date: "Apr 2", value: 155 }, { date: "Apr 5", value: 140 },
  { date: "Apr 8", value: 125 },
];

function YouTubeBanner() {
  return (
    <div className="mb-4 rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-5">
        <p className="text-sm text-muted-foreground mb-1">Your channel got</p>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-bold text-foreground">{formatNumber(channelViews)} views</span>
          <span className="text-sm text-muted-foreground">in the last {dataDays} days</span>
        </div>
      </div>
      <div className="h-[140px] px-4 pb-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={viewsChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} width={35} />
            <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)" }} />
            <Area type="monotone" dataKey="value" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.12} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function YouTubePage() {
  return <WidgetPage headerContent={<YouTubeBanner />} />;
}
