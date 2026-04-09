"use client";

import { BarChart3, Heart, MessageCircle, Share2, Bookmark, Eye, Image, Play } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { WidgetConfig } from "@/types/widget";

// Mock data per platform — will be replaced by real API data (thumbnails, titles, metrics)
const platformContent: Record<string, { title: string; metric: number; metricLabel: string; type: string; engagement: { icon: string; value: number }[] }[]> = {
  youtube: [
    { title: "Nationwide Haul Truck, Trailer RV & Bus Repair Shop in Lakeland FL", metric: 1476, metricLabel: "views", type: "Video", engagement: [] },
    { title: "New or used reefer — which one actually makes sense for YOUR operation?", metric: 519, metricLabel: "views", type: "Video", engagement: [] },
    { title: "Why This Dry Van (Starlite Sat / Vanguard 2024)...", metric: 198, metricLabel: "views", type: "Video", engagement: [] },
    { title: "MH Flatbed — What Nobody Tells You", metric: 175, metricLabel: "views", type: "Short", engagement: [] },
    { title: "The MAC Half Round Dump Trailer also Be Work for You", metric: 152, metricLabel: "views", type: "Video", engagement: [] },
  ],
  facebook: [
    { title: "New 2025 Reefer Trailer just dropped! Check out this beauty", metric: 4200, metricLabel: "reach", type: "Photo", engagement: [{ icon: "heart", value: 145 }, { icon: "comment", value: 23 }, { icon: "share", value: 12 }] },
    { title: "Customer just picked up his brand new Dry Van — congrats!", metric: 3100, metricLabel: "reach", type: "Photo", engagement: [{ icon: "heart", value: 112 }, { icon: "comment", value: 18 }, { icon: "share", value: 8 }] },
    { title: "VOLVO Sleeper Truck — full walkthrough video inside", metric: 5600, metricLabel: "reach", type: "Video", engagement: [{ icon: "heart", value: 98 }, { icon: "comment", value: 31 }, { icon: "share", value: 15 }] },
  ],
  instagram: [
    { title: "This Reefer just came off the lot — DM us for pricing", metric: 6100, metricLabel: "reach", type: "Reel", engagement: [{ icon: "heart", value: 234 }, { icon: "comment", value: 18 }, { icon: "save", value: 32 }] },
    { title: "POV: You just picked up your new flatbed", metric: 5400, metricLabel: "reach", type: "Reel", engagement: [{ icon: "heart", value: 189 }, { icon: "comment", value: 25 }, { icon: "save", value: 28 }] },
    { title: "2025 inventory lineup — which one are you picking?", metric: 4800, metricLabel: "reach", type: "Carousel", engagement: [{ icon: "heart", value: 156 }, { icon: "comment", value: 42 }, { icon: "save", value: 19 }] },
  ],
};

function EngagementIcon({ type, size = 3 }: { type: string; size?: number }) {
  const cls = `h-${size} w-${size}`;
  if (type === "heart") return <Heart className={cls} />;
  if (type === "comment") return <MessageCircle className={cls} />;
  if (type === "share") return <Share2 className={cls} />;
  if (type === "save") return <Bookmark className={cls} />;
  return null;
}

export function TopContentWidget({ config }: { config: WidgetConfig }) {
  const platform = config.dataSource === "youtube" ? "youtube"
    : config.dataSource === "instagram" ? "instagram"
    : "facebook";
  const items = platformContent[platform] || [];
  const isYouTube = platform === "youtube";

  return (
    <div className="h-full overflow-auto px-3 py-2">
      <div className="space-y-2.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            {/* Thumbnail placeholder — real image when API connected */}
            <div className="w-16 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
              {item.type === "Video" || item.type === "Reel" || item.type === "Short" ? (
                <Play className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Image className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-card-foreground truncate">{item.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  item.type === "Short" || item.type === "Reel" ? "bg-purple-100 text-purple-700"
                  : "bg-muted text-muted-foreground"
                }`}>{item.type}</span>
                {isYouTube ? (
                  <span className="text-[10px] text-muted-foreground">{formatNumber(item.metric)} {item.metricLabel}</span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">{formatNumber(item.metric)} {item.metricLabel}</span>
                )}
              </div>
              {!isYouTube && item.engagement.length > 0 && (
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                  {item.engagement.map((e, j) => (
                    <span key={j} className="flex items-center gap-0.5">
                      <EngagementIcon type={e.icon} />
                      {e.value}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <span className="text-xs font-bold text-card-foreground shrink-0">{formatNumber(item.metric)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
