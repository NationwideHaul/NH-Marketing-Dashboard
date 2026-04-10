import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

// Google redirects here after auth. Shows the refresh token to save.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL || "https://nh-marketing-theta.vercel.app"}/api/connect-google/callback`
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);

    return new NextResponse(
      `<!DOCTYPE html>
      <html><head><title>Google Connected</title></head>
      <body style="font-family:system-ui;max-width:600px;margin:80px auto;padding:20px;">
        <h1 style="color:#16a34a;">&#10003; Google Connected Successfully!</h1>
        <p>Copy this refresh token and save it as <strong>GOOGLE_REFRESH_TOKEN</strong> in Vercel:</p>
        <textarea readonly style="width:100%;height:80px;font-family:monospace;font-size:12px;padding:8px;border:1px solid #ccc;border-radius:4px;">${tokens.refresh_token || "NO REFRESH TOKEN - try again"}</textarea>
        <p style="margin-top:16px;color:#666;">After saving this in Vercel, redeploy, and Google APIs will work forever without sign-in.</p>
        <p><a href="/">← Back to Dashboard</a></p>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
