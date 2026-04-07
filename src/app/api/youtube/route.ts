import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getYouTubeAnalytics, getYouTubeTopVideos, getYouTubeTrafficSources } from "@/lib/api-clients/google";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate") || "2025-01-01";
  const endDate = searchParams.get("endDate") || "2025-12-31";
  const type = searchParams.get("type") || "overview"; // overview | top-videos | traffic

  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!channelId || !process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.json({
      platform: "youtube",
      status: "mock",
      message: "YOUTUBE_CHANNEL_ID not configured. Showing mock data.",
    });
  }

  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const refreshToken = (session as any).refreshToken; // eslint-disable-line @typescript-eslint/no-explicit-any

    let data;
    if (type === "top-videos") {
      data = await getYouTubeTopVideos(session.accessToken, refreshToken, channelId, startDate, endDate);
    } else if (type === "traffic") {
      data = await getYouTubeTrafficSources(session.accessToken, refreshToken, channelId, startDate, endDate);
    } else {
      data = await getYouTubeAnalytics(session.accessToken, refreshToken, channelId, startDate, endDate);
    }

    return NextResponse.json({ platform: "youtube", status: "live", data });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("YouTube API error:", error.message);
    return NextResponse.json({ platform: "youtube", status: "error", error: error.message }, { status: 500 });
  }
}
