import { NextRequest, NextResponse } from "next/server";
import {
  getYouTubeAnalytics,
  getYouTubeTopVideos,
  getYouTubeTrafficSources,
  getYouTubeChannelStats,
  getYouTubeRecentVideosWithStats,
  getStoredYouTubeClient,
} from "@/lib/api-clients/google";
import { getAccountCredentials } from "@/lib/account-credentials";
import { getCredential } from "@/lib/credential-store";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate") || "2025-01-01";
  const endDate = searchParams.get("endDate") || "2025-12-31";
  const type = searchParams.get("type") || "overview";
  const accountId = searchParams.get("accountId") || "nationwide-haul";

  const creds = await getAccountCredentials(accountId);
  const channelId = creds.youtubeChannelId;

  if (!channelId) {
    return NextResponse.json({
      platform: "youtube",
      status: "error",
      error: `YouTube not configured for account: ${accountId}`,
    });
  }

  try {
    const { accessToken } = await getStoredYouTubeClient();
    const [ytToken, mainToken] = await Promise.all([
      getCredential("YOUTUBE_REFRESH_TOKEN").then((r) => r.value),
      getCredential("GOOGLE_REFRESH_TOKEN").then((r) => r.value),
    ]);
    const refreshToken = ytToken || mainToken;

    // Always get channel stats + recent videos from Data API (works for Brand Account managers)
    const [channel, allVideos] = await Promise.all([
      getYouTubeChannelStats(accessToken, channelId).catch(() => null),
      getYouTubeRecentVideosWithStats(accessToken, channelId, 50).catch(() => []),
    ]);

    // Filter to videos published inside the selected date range
    const fromTs = new Date(`${startDate}T00:00:00Z`).getTime();
    const toTs = new Date(`${endDate}T23:59:59Z`).getTime();
    const inRangeVideos = allVideos.filter((v: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (!v.publishedAt) return false;
      const t = new Date(v.publishedAt).getTime();
      return t >= fromTs && t <= toTs;
    });
    const videos = allVideos; // keep all for top/recent widgets

    // Attempt Analytics API — may fail silently for managers without owner consent
    let analytics: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
    let topVideos: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
    let trafficSources: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
    try {
      if (type === "top-videos") {
        topVideos = await getYouTubeTopVideos(accessToken, refreshToken, channelId, startDate, endDate);
      } else if (type === "traffic") {
        trafficSources = await getYouTubeTrafficSources(accessToken, refreshToken, channelId, startDate, endDate);
      } else {
        analytics = await getYouTubeAnalytics(accessToken, refreshToken, channelId, startDate, endDate);
      }
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      analytics = { _note: `Analytics API unavailable: ${e.message}` };
    }

    const stats = channel?.statistics || {};
    const totalViews = parseInt(stats.viewCount || "0", 10);
    const totalSubscribers = parseInt(stats.subscriberCount || "0", 10);
    const videoCount = parseInt(stats.videoCount || "0", 10);

    // In-range aggregates (videos published inside the selected date range)
    const rangeViews = inRangeVideos.reduce((s: number, v: any) => s + (v.views || 0), 0); // eslint-disable-line @typescript-eslint/no-explicit-any
    const rangeLikes = inRangeVideos.reduce((s: number, v: any) => s + (v.likes || 0), 0); // eslint-disable-line @typescript-eslint/no-explicit-any
    const rangeComments = inRangeVideos.reduce((s: number, v: any) => s + (v.comments || 0), 0); // eslint-disable-line @typescript-eslint/no-explicit-any
    const rangeVideosCount = inRangeVideos.length;

    // If Analytics API worked, use its totals (true "new in period" numbers)
    let analyticsRangeViews: number | null = null;
    let analyticsRangeSubs: number | null = null;
    let analyticsRangeMinutes: number | null = null;
    let analyticsRangeLikes: number | null = null;
    let analyticsRangeComments: number | null = null;
    if (analytics?.rows && Array.isArray(analytics.rows)) {
      analyticsRangeViews = 0;
      analyticsRangeSubs = 0;
      analyticsRangeMinutes = 0;
      analyticsRangeLikes = 0;
      analyticsRangeComments = 0;
      for (const row of analytics.rows as any[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
        analyticsRangeViews += row[1] || 0;
        analyticsRangeMinutes += row[2] || 0;
        analyticsRangeSubs += row[3] || 0;
        analyticsRangeLikes += row[4] || 0;
        analyticsRangeComments += row[5] || 0;
      }
    }

    // Prefer Analytics API "new in range" numbers when available; otherwise
    // fall back to sums of videos published in range (approximation).
    const viewsInRange = analyticsRangeViews ?? rangeViews;
    const likesInRange = analyticsRangeLikes ?? rangeLikes;
    const commentsInRange = analyticsRangeComments ?? rangeComments;
    const subscribersGained = analyticsRangeSubs ?? 0; // Data API has no way to compute this
    const watchTimeMinutes = analyticsRangeMinutes ?? 0; // same — analytics-only
    const watchTimeHours = Math.round((watchTimeMinutes / 60) * 10) / 10;

    return NextResponse.json({
      platform: "youtube",
      status: "live",
      accountId,
      data: {
        channelTitle: channel?.snippet?.title,
        channelDescription: channel?.snippet?.description,
        thumbnail: channel?.snippet?.thumbnails?.default?.url,
        customUrl: channel?.snippet?.customUrl,
        // Range-scoped (the numbers widgets show)
        views: viewsInRange,
        likes: likesInRange,
        comments: commentsInRange,
        subscribers: subscribersGained,
        videosPublished: rangeVideosCount,
        watchTime: watchTimeHours,
        estimatedMinutesWatched: watchTimeMinutes,
        // All-time totals (banner / lifetime references)
        totalViews,
        totalSubscribers,
        totalLikes: allVideos.reduce((s: number, v: any) => s + (v.likes || 0), 0), // eslint-disable-line @typescript-eslint/no-explicit-any
        totalComments: allVideos.reduce((s: number, v: any) => s + (v.comments || 0), 0), // eslint-disable-line @typescript-eslint/no-explicit-any
        videoCount,
        // Per-video list for top-content / recent-content widgets
        videos,
        inRangeVideos,
        // Analytics API raw payload (daily rows when permitted)
        analytics,
        topVideos,
        trafficSources,
        // Metadata
        analyticsAvailable: !!analyticsRangeViews,
      },
    });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    return NextResponse.json(
      { platform: "youtube", status: "error", error: error.message },
      { status: 500 }
    );
  }
}
