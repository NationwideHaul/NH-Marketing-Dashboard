import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGA4Data } from "@/lib/api-clients/google";
import { getAccountCredentials } from "@/lib/account-credentials";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate") || "30daysAgo";
  const endDate = searchParams.get("endDate") || "today";
  const accountId = searchParams.get("accountId") || "nationwide-haul";

  // Get account-specific credentials
  const creds = getAccountCredentials(accountId);
  const propertyId = creds.ga4PropertyId;

  if (!propertyId || !process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.json({
      platform: "google-analytics",
      status: "error",
      error: `GA4 not configured for account: ${accountId}`,
    });
  }

  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated. Sign in with Google first." }, { status: 401 });
    }

    const data = await getGA4Data(
      session.accessToken,
      (session as any).refreshToken, // eslint-disable-line @typescript-eslint/no-explicit-any
      propertyId,
      startDate,
      endDate
    );

    return NextResponse.json({
      platform: "google-analytics",
      status: "live",
      accountId,
      propertyId,
      data,
    });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error(`GA4 API error (${accountId}, property ${propertyId}):`, error.message);
    return NextResponse.json({
      platform: "google-analytics",
      status: "error",
      error: error.message,
    }, { status: 500 });
  }
}
