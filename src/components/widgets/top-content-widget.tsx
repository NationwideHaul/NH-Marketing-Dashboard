"use client";

import useSWR from "swr";
import { Heart, MessageCircle, Share2, Image as ImageIcon, Play } from "lucide-react";
import { format } from "date-fns";
import { formatNumber } from "@/lib/utils";
import { useDateRange } from "@/context/date-range-context";
import { useAccount } from "@/context/account-context";
import type { WidgetConfig } from "@/types/widget";

type TopItem = {
  title: string;
  type: string;
  engagement: { icon: "heart" | "comment" | "share" | "save"; value: number }[];
  metric: number;
  metricLabel: string;
  thumbnail?: string;
  permalink?: string;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function EngagementIcon({ type }: { type: string }) {
  const cls = "h-3 w-3";
  if (type === "heart") return <Heart className={cls} />;
  if (type === "comment") return <MessageCircle className={cls} />;
  if (type === "share") return <Share2 className={cls} />;
  return null;
}

function useTopContent(dataSource: string): { items: TopItem[]; loading: boolean; error: boolean } {
  const { dateRange } = useDateRange();
  const { apiAccountId } = useAccount();
  const startDate = format(dateRange.from, "yyyy-MM-dd");
  const endDate = format(dateRange.to, "yyyy-MM-dd");

  const type = dataSource === "instagram" ? "instagram" : dataSource === "facebook" ? "facebook" : null;
  const url = type
    ? `/api/meta-ads?type=${type}&startDate=${startDate}&endDate=${endDate}&accountId=${apiAccountId}`
    : null;

  const { data, isLoading, error } = useSWR(url, fetcher, {
    refreshInterval: 300000,
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  if (!type || !data) return { items: [], loading: !!isLoading, error: !!error };

  if (type === "facebook") {
    const posts: any[] = data?.data?.posts ?? []; // eslint-disable-line @typescript-eslint/no-explicit-any
    const items = [...posts]
      .map((p) => {
        const likes = p.likes || 0;
        const comments = p.comments || 0;
        const shares = p.shares || 0;
        const engagement = likes + comments + shares;
        return {
          title: (p.message || "(no caption)").slice(0, 90),
          type: p.image ? "Photo" : "Post",
          engagement: [
            { icon: "heart" as const, value: likes },
            { icon: "comment" as const, value: comments },
            { icon: "share" as const, value: shares },
          ],
          metric: engagement,
          metricLabel: "engagement",
          thumbnail: p.image,
          permalink: p.permalink,
          _engagement: engagement,
        };
      })
      .sort((a, b) => b._engagement - a._engagement)
      .slice(0, 5);
    return { items, loading: false, error: data?.status === "error" };
  }

  if (type === "instagram") {
    const media: any[] = data?.data?.media ?? []; // eslint-disable-line @typescript-eslint/no-explicit-any
    const items = [...media]
      .map((m) => {
        const likes = m.likes || 0;
        const comments = m.comments || 0;
        const engagement = likes + comments;
        const kind = m.mediaType === "VIDEO" || m.mediaType === "REELS" ? "Reel"
          : m.mediaType === "CAROUSEL_ALBUM" ? "Carousel"
          : "Post";
        return {
          title: (m.caption || "(no caption)").slice(0, 90),
          type: kind,
          engagement: [
            { icon: "heart" as const, value: likes },
            { icon: "comment" as const, value: comments },
          ],
          metric: engagement,
          metricLabel: "engagement",
          thumbnail: m.thumbnail,
          permalink: m.permalink,
          _engagement: engagement,
        };
      })
      .sort((a, b) => b._engagement - a._engagement)
      .slice(0, 5);
    return { items, loading: false, error: data?.status === "error" };
  }

  return { items: [], loading: false, error: false };
}

export function TopContentWidget({ config }: { config: WidgetConfig }) {
  const { items, loading, error } = useTopContent(config.dataSource);
  const supported = config.dataSource === "facebook" || config.dataSource === "instagram";

  if (!supported) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-muted-foreground px-3 text-center">
        Top content coming soon for {config.dataSource}
      </div>
    );
  }
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
        Loading top posts…
      </div>
    );
  }
  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
        Unable to load posts
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
        No posts in this date range
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto px-3 py-2">
      <div className="space-y-2.5">
        {items.map((item, i) => (
          <a
            key={i}
            href={item.permalink || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 hover:bg-muted/20 rounded-md p-1 transition-colors"
          >
            <div className="w-16 h-10 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden">
              {item.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
              ) : item.type === "Reel" ? (
                <Play className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-card-foreground truncate">{item.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  item.type === "Reel" ? "bg-purple-100 text-purple-700" : "bg-muted text-muted-foreground"
                }`}>{item.type}</span>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  {item.engagement.map((e, j) => (
                    <span key={j} className="flex items-center gap-0.5">
                      <EngagementIcon type={e.icon} />
                      {formatNumber(e.value)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <span className="text-xs font-bold text-card-foreground shrink-0">{formatNumber(item.metric)}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
