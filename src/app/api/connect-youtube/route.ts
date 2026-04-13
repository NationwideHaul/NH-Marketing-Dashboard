import { NextResponse } from "next/server";
import { google } from "googleapis";

// Starts a dedicated YouTube OAuth flow. Sign in with the Google account
// that OWNS the YouTube channel (e.g. Nationwidetrailer@gmail.com). The
// refresh token captured here goes into YOUTUBE_REFRESH_TOKEN in Vercel,
// independent of the main GOOGLE_REFRESH_TOKEN used for GA / Ads / GMB.
export async function GET() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "https://nh-marketing-theta.vercel.app/api/connect-youtube/callback"
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    state: "get-youtube-refresh-token",
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/yt-analytics.readonly",
    ],
  });

  return NextResponse.redirect(url);
}
