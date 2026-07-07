import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET() {
  const baseUrl = (process.env.NEXTAUTH_URL || "https://marketing.nationwidehaul.com").replace(/\/$/, "");
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${baseUrl}/api/connect-google/callback`
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    state: "get-refresh-token",
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/analytics.readonly",
      "https://www.googleapis.com/auth/adwords",
      "https://www.googleapis.com/auth/business.manage",
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/yt-analytics.readonly",
    ],
  });

  return NextResponse.redirect(url);
}
