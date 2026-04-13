import { NextRequest, NextResponse } from "next/server";
import { getYouTubeAnalytics, getYouTubeTopVideos, getYouTubeTrafficSources, getStoredYouTubeClient } from "@/lib/api-clients/google";
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
    return NextResponse.json({ platform: "youtube", status: "error", error: `YouTube not configured for account: ${accountId}` });
  }

  try {
    const { accessToken } = await getStoredYouTubeClient();
    const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;

    let data;
    if (type === "top-videos") data = await getYouTubeTopVideos(accessToken, refreshToken, channelId, startDate, endDate);
    else if (type === "traffic") data = await getYouTubeTrafficSources(accessToken, refreshToken, channelId, startDate, endDate);
    else data = await getYouTubeAnalytics(accessToken, refreshToken, channelId, startDate, endDate);

    return NextResponse.json({ platform: "youtube", status: "live", accountId, data });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    return NextResponse.json({ platform: "youtube", status: "error", error: error.message }, { status: 500 });
  }
}
