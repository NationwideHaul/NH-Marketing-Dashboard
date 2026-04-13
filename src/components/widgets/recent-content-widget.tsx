"use client";

import useSWR from "swr";
import { Heart, MessageCircle, Share2, Image as ImageIcon, Play } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { formatNumber } from "@/lib/utils";
import { useDateRange } from "@/context/date-range-context";
import { useAccount } from "@/context/account-context";
import type { WidgetConfig } from "@/types/widget";

type RecentItem = {
  title: string;
  daysAgo: number;
  type: string;
  engagement: { icon: "heart" | "comment" | "share"; value: number }[];
  thumbnail?: string;
  permalink?: string;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function EngagementIcon({ type }: { type: string }) {
  const cls = "h-2.5 w-2.5";
  if (type === "heart") return <Heart className={cls} />;
  if (type === "comment") return <MessageCircle className={cls} />;
  if (type === "share") return <Share2 className={cls} />;
  return null;
}

function useRecent(dataSource: string): { items: RecentItem[]; loading: boolean; error: boolean } {
  const { dateRange } = useDateRange();
  const { apiAccountId } = useAccount();
  const startDate = format(dateRange.from, "yyyy-MM-dd");
  const endDate = format(dateRange.to, "yyyy-MM-dd");

  const type = dataSource === "instagram" ? "instagram"
    : dataSource === "facebook" ? "facebook"
    : dataSource === "youtube" ? "youtube"
    : null;
  const url =
    type === "youtube"
      ? `/api/youtube?startDate=${startDate}&endDate=${endDate}&accountId=${apiAccountId}`
      : type
        ? `/api/meta-ads?type=${type}&startDate=${startDate}&endDate=${endDate}&accountId=${apiAccountId}`
        : null;

  const { data, isLoading, error } = useSWR(url, fetcher, {
    refreshInterval: 300000,
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  if (!type || !data) return { items: [], loading: !!isLoading, error: !!error };

  const now = new Date();

  if (type === "facebook") {
    const posts: any[] = data?.data?.posts ?? []; // eslint-disable-line @typescript-eslint/no-explicit-any
    const items = [...posts]
      .map((p) => {
        const created = p.createdTime ? new Date(p.createdTime) : now;
        return {
          title: (p.message || "(no caption)").slice(0, 90),
          daysAgo: Math.max(0, differenceInDays(now, created)),
          type: p.image ? "Photo" : "Post",
          engagement: [
            { icon: "heart" as const, value: p.likes || 0 },
            { icon: "comment" as const, value: p.comments || 0 },
            { icon: "share" as const, value: p.shares || 0 },
          ],
          thumbnail: p.image,
          permalink: p.permalink,
          _ts: created.getTime(),
        };
      })
      .sort((a, b) => b._ts - a._ts)
      .slice(0, 6);
    return { items, loading: false, error: data?.status === "error" };
  }

  if (type === "youtube") {
    const videos: any[] = data?.data?.videos ?? []; // eslint-disable-line @typescript-eslint/no-explicit-any
    const items = [...videos]
      .map((v) => {
        const created = v.publishedAt ? new Date(v.publishedAt) : now;
        const isShort = (v.duration || "").match(/PT(\d+)S/) && !(v.duration || "").includes("M");
        return {
          title: (v.title || "(no title)").slice(0, 90),
          daysAgo: Math.max(0, differenceInDays(now, created)),
          type: isShort ? "Short" : "Video",
          engagement: [
            { icon: "heart" as const, value: v.likes || 0 },
            { icon: "comment" as const, value: v.comments || 0 },
          ],
          thumbnail: v.thumbnail,
          permalink: v.permalink,
          _ts: created.getTime(),
        };
      })
      .sort((a, b) => b._ts - a._ts)
      .slice(0, 6);
    return { items, loading: false, error: data?.status === "error" };
  }

  if (type === "instagram") {
    const media: any[] = data?.data?.media ?? []; // eslint-disable-line @typescript-eslint/no-explicit-any
    const items = [...media]
      .map((m) => {
        const created = m.timestamp ? new Date(m.timestamp) : now;
        const kind = m.mediaType === "VIDEO" || m.mediaType === "REELS" ? "Reel"
          : m.mediaType === "CAROUSEL_ALBUM" ? "Carousel"
          : "Post";
        return {
          title: (m.caption || "(no caption)").slice(0, 90),
          daysAgo: Math.max(0, differenceInDays(now, created)),
          type: kind,
          engagement: [
            { icon: "heart" as const, value: m.likes || 0 },
            { icon: "comment" as const, value: m.comments || 0 },
          ],
          thumbnail: m.thumbnail,
          permalink: m.permalink,
          _ts: created.getTime(),
        };
      })
      .sort((a, b) => b._ts - a._ts)
      .slice(0, 6);
    return { items, loading: false, error: data?.status === "error" };
  }

  return { items: [], loading: false, error: false };
}

export function RecentContentWidget({ config }: { config: WidgetConfig }) {
  const { items, loading, error } = useRecent(config.dataSource);
  const supported =
    config.dataSource === "facebook" ||
    config.dataSource === "instagram" ||
    config.dataSource === "youtube";

  if (!supported) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-muted-foreground px-3 text-center">
        Recent content coming soon for {config.dataSource}
      </div>
    );
  }
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
        Loading recent posts…
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
        No recent posts
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto px-3 py-2">
      <div className="space-y-2">
        {items.map((item, i) => (
          <a
            key={i}
            href={item.permalink || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-muted/30 transition-colors"
          >
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
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
              <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                <span className={`px-1.5 py-0.5 rounded-full font-medium ${
                  item.type === "Reel" ? "bg-purple-100 text-purple-700" : "bg-muted"
                }`}>{item.type}</span>
                <span>{item.daysAgo === 0 ? "today" : `${item.daysAgo}d ago`}</span>
                {item.engagement.map((e, j) => (
                  e.value > 0 ? (
                    <span key={j} className="flex items-center gap-0.5">
                      <EngagementIcon type={e.icon} />
                      {formatNumber(e.value)}
                    </span>
                  ) : null
                ))}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
