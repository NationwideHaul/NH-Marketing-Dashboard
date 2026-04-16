import { NextRequest, NextResponse } from "next/server";
import { getGA4Data, getStoredGoogleClient } from "@/lib/api-clients/google";
import { getAccountCredentials } from "@/lib/account-credentials";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate") || "30daysAgo";
  const endDate = searchParams.get("endDate") || "today";
  const accountId = searchParams.get("accountId") || "nationwide-haul";
  const dimension = searchParams.get("dimension") || undefined;

  const creds = await getAccountCredentials(accountId);
  const propertyId = creds.ga4PropertyId;

  if (!propertyId || !process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.json({
      platform: "google-analytics",
      status: "error",
      error: `GA4 not configured for account: ${accountId}`,
    });
  }

  try {
    const { accessToken } = await getStoredGoogleClient();

    const data = await getGA4Data(
      accessToken,
      process.env.GOOGLE_REFRESH_TOKEN,
      propertyId,
      startDate,
      endDate,
      dimension
    );

    return NextResponse.json({
      platform: "google-analytics",
      status: "live",
      accountId,
      propertyId,
      dimension: dimension || "date",
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
