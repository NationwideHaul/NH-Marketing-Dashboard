import { NextRequest, NextResponse } from "next/server";
import { getGoogleAdsData, getStoredGoogleClient } from "@/lib/api-clients/google";
import { getAccountCredentials } from "@/lib/account-credentials";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate") || "2025-01-01";
  const endDate = searchParams.get("endDate") || "2025-12-31";
  const accountId = searchParams.get("accountId") || "nationwide-haul";

  const creds = await getAccountCredentials(accountId);
  const customerId = creds.googleAdsCustomerId;

  if (!customerId || !creds.googleAdsDeveloperToken) {
    return NextResponse.json({
      platform: "google-ads",
      status: "error",
      error: `Google Ads not configured for account: ${accountId}`,
    });
  }

  try {
    const { accessToken } = await getStoredGoogleClient();

    const data = await getGoogleAdsData(accessToken, process.env.GOOGLE_REFRESH_TOKEN, customerId, startDate, endDate);
    return NextResponse.json({ platform: "google-ads", status: "live", accountId, data });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    return NextResponse.json({
      platform: "google-ads", status: "error", error: error.message,
    }, { status: 500 });
  }
}
