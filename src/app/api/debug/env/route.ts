import { NextResponse } from "next/server";
import { getStoredGoogleClient } from "@/lib/api-clients/google";

// TEMPORARY: diagnose YouTube ownership
export async function GET() {
  try {
    const { accessToken } = await getStoredGoogleClient();
    // 1. Which Google user is the token for?
    const meRes = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
    );
    const me = await meRes.json();
    // 2. Which YT channels does this user OWN / MANAGE?
    const chRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=id,snippet,contentDetails&mine=true",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const channels = await chRes.json();
    return NextResponse.json({
      google_user: me,
      my_channels: channels,
      configured_channel_id: "UCjWMfLksDwfwVA-u3xkhnhg",
    });
  } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    return NextResponse.json({ error: e.message });
  }
}
