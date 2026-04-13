import { NextResponse } from "next/server";
import { getStoredGoogleClient } from "@/lib/api-clients/google";

// TEMPORARY: diagnose YouTube access after brand-account migration
export async function GET() {
  try {
    const { accessToken } = await getStoredGoogleClient();
    const channelId = "UCjWMfLksDwfwVA-u3xkhnhg";

    // 1. Try direct channel fetch (works for any channel you can access)
    const chRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id,snippet,statistics&id=${channelId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const byId = await chRes.json();

    // 2. Try mine=true (only works for directly-owned channels)
    const mineRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const mine = await mineRes.json();

    // 3. Try YouTube Analytics for the specific channel
    const anaRes = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel%3D%3D${channelId}&startDate=2026-03-14&endDate=2026-04-13&metrics=views,estimatedMinutesWatched,subscribersGained`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const analytics = await anaRes.json();

    return NextResponse.json({
      channelById: byId,
      channelsMine: mine,
      analyticsSample: analytics,
    });
  } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    return NextResponse.json({ error: e.message });
  }
}
