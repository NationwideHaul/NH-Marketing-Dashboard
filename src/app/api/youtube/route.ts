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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate") || "2025-01-01";
  const endDate = searchParams.get("endDate") || "2025-12-31";
  const type = searchParams.get("type") || "overview";
  const accountId = searchParams.get("accountId") || "nationwide-haul";

  const creds = getAccountCredentials(accountId);
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
    const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;

    // Always get channel stats + recent videos from Data API (works for Brand Account managers)
    const [channel, videos] = await Promise.all([
      getYouTubeChannelStats(accessToken, channelId).catch(() => null),
      getYouTubeRecentVideosWithStats(accessToken, channelId, 20).catch(() => []),
    ]);

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
    const subscribers = parseInt(stats.subscriberCount || "0", 10);
    const videoCount = parseInt(stats.videoCount || "0", 10);

    // Rebuild per-video engagement totals over the recent-videos window
    const totalLikes = videos.reduce((s: number, v: any) => s + (v.likes || 0), 0); // eslint-disable-line @typescript-eslint/no-explicit-any
    const totalComments = videos.reduce((s: number, v: any) => s + (v.comments || 0), 0); // eslint-disable-line @typescript-eslint/no-explicit-any
    const recentVideoViews = videos.reduce((s: number, v: any) => s + (v.views || 0), 0); // eslint-disable-line @typescript-eslint/no-explicit-any

    return NextResponse.json({
      platform: "youtube",
      status: "live",
      accountId,
      data: {
        // Channel-level stats (from Data API, always available for managers)
        channelTitle: channel?.snippet?.title,
        channelDescription: channel?.snippet?.description,
        thumbnail: channel?.snippet?.thumbnails?.default?.url,
        customUrl: channel?.snippet?.customUrl,
        totalViews,
        views: totalViews,
        subscribers,
        videoCount,
        videosPublished: videos.length,
        likes: totalLikes,
        totalLikes,
        comments: totalComments,
        totalComments,
        recentVideoViews,
        // Per-video list for top-content / recent-content widgets
        videos,
        // Analytics API (daily time series) — null if not permitted
        analytics,
        topVideos,
        trafficSources,
      },
    });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    return NextResponse.json(
      { platform: "youtube", status: "error", error: error.message },
      { status: 500 }
    );
  }
}
