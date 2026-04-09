"use client";

import { Heart, MessageCircle, Share2, Bookmark, Image, Play } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { WidgetConfig } from "@/types/widget";

// Mock data per platform — will be replaced by real API data
const platformRecent: Record<string, { title: string; daysAgo: number; views: number; type: string; engagement: { icon: string; value: number }[] }[]> = {
  youtube: [
    { title: "Custom MHC Dump Trailer Walkthrough! w/ 120 Lights", daysAgo: 2, views: 84, type: "Short", engagement: [] },
    { title: "MHC Road Warrior Flatbed Trailer Walkthrough", daysAgo: 4, views: 67, type: "Short", engagement: [] },
    { title: "45' Flatbed Trailer for Sale — Full Tour", daysAgo: 7, views: 156, type: "Video", engagement: [] },
    { title: "VOLVO Sleeper Truck — Interior Walkthrough", daysAgo: 10, views: 203, type: "Video", engagement: [] },
  ],
  facebook: [
    { title: "Flatbed inventory update — 15 units available NOW", daysAgo: 1, views: 34, type: "Photo", engagement: [{ icon: "heart", value: 34 }, { icon: "comment", value: 5 }, { icon: "share", value: 3 }] },
    { title: "Why owner-operators are switching to reefer trailers in 2026", daysAgo: 3, views: 67, type: "Link", engagement: [{ icon: "heart", value: 67 }, { icon: "comment", value: 12 }, { icon: "share", value: 7 }] },
    { title: "Shop tour — see how we prep every truck before delivery", daysAgo: 5, views: 89, type: "Video", engagement: [{ icon: "heart", value: 89 }, { icon: "comment", value: 15 }, { icon: "share", value: 9 }] },
    { title: "End of month deals on sleeper trucks! DM us for pricing", daysAgo: 7, views: 56, type: "Photo", engagement: [{ icon: "heart", value: 56 }, { icon: "comment", value: 8 }, { icon: "share", value: 4 }] },
    { title: "Customer testimonial — Best dealership experience", daysAgo: 10, views: 123, type: "Photo", engagement: [{ icon: "heart", value: 123 }, { icon: "comment", value: 22 }, { icon: "share", value: 11 }] },
  ],
  instagram: [
    { title: "Behind the scenes — how we detail every truck before delivery", daysAgo: 1, views: 78, type: "Reel", engagement: [{ icon: "heart", value: 78 }, { icon: "comment", value: 8 }, { icon: "save", value: 12 }] },
    { title: "Customer delivery day! Congrats on the new Dry Van", daysAgo: 2, views: 112, type: "Post", engagement: [{ icon: "heart", value: 112 }, { icon: "comment", value: 15 }, { icon: "save", value: 9 }] },
    { title: "Flatbed vs Step Deck — which is right for your load?", daysAgo: 4, views: 95, type: "Carousel", engagement: [{ icon: "heart", value: 95 }, { icon: "comment", value: 19 }, { icon: "save", value: 22 }] },
    { title: "VOLVO Sleeper interior tour — would you drive this?", daysAgo: 6, views: 167, type: "Reel", engagement: [{ icon: "heart", value: 167 }, { icon: "comment", value: 31 }, { icon: "save", value: 38 }] },
    { title: "New arrivals this week! 5 Reefers + 3 Flatbeds in stock", daysAgo: 8, views: 89, type: "Post", engagement: [{ icon: "heart", value: 89 }, { icon: "comment", value: 11 }, { icon: "save", value: 15 }] },
  ],
};

function EngagementIcon({ type }: { type: string }) {
  const cls = "h-2.5 w-2.5";
  if (type === "heart") return <Heart className={cls} />;
  if (type === "comment") return <MessageCircle className={cls} />;
  if (type === "share") return <Share2 className={cls} />;
  if (type === "save") return <Bookmark className={cls} />;
  return null;
}

export function RecentContentWidget({ config }: { config: WidgetConfig }) {
  const platform = config.dataSource === "youtube" ? "youtube"
    : config.dataSource === "instagram" ? "instagram"
    : "facebook";
  const items = platformRecent[platform] || [];
  const isYouTube = platform === "youtube";

  return (
    <div className="h-full overflow-auto px-3 py-2">
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-muted/30 transition-colors">
            {/* Thumbnail placeholder */}
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
              {item.type === "Video" || item.type === "Reel" || item.type === "Short" ? (
                <Play className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Image className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-card-foreground truncate">{item.title}</p>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                <span className={`px-1.5 py-0.5 rounded-full font-medium ${
                  item.type === "Short" || item.type === "Reel" ? "bg-purple-100 text-purple-700" : "bg-muted"
                }`}>{item.type}</span>
                <span>{item.daysAgo}d ago</span>
                {isYouTube ? (
                  <span>{formatNumber(item.views)} views</span>
                ) : (
                  item.engagement.map((e, j) => (
                    <span key={j} className="flex items-center gap-0.5">
                      <EngagementIcon type={e.icon} />
                      {e.value}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
