import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "No code provided" }, { status: 400 });

  const baseUrl = (process.env.NEXTAUTH_URL || "https://marketing.nationwidehaul.com").replace(/\/$/, "");
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${baseUrl}/api/connect-youtube/callback`
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    return new NextResponse(
      `<!DOCTYPE html>
      <html><head><title>YouTube Connected</title></head>
      <body style="font-family:system-ui;max-width:600px;margin:80px auto;padding:20px;">
        <h1 style="color:#c4302b;">&#10003; YouTube Connected</h1>
        <p>Copy this refresh token and save it as <strong>YOUTUBE_REFRESH_TOKEN</strong> in Vercel:</p>
        <textarea readonly style="width:100%;height:80px;font-family:monospace;font-size:12px;padding:8px;border:1px solid #ccc;border-radius:4px;">${tokens.refresh_token || "NO REFRESH TOKEN — retry the flow"}</textarea>
        <p style="margin-top:16px;color:#666;">After saving and redeploying, YouTube widgets will start showing real data.</p>
        <p><a href="/">&larr; Back to Dashboard</a></p>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
