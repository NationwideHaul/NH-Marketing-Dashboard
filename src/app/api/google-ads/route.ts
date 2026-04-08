import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGoogleAdsData } from "@/lib/api-clients/google";
import { getAccountCredentials } from "@/lib/account-credentials";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate") || "2025-01-01";
  const endDate = searchParams.get("endDate") || "2025-12-31";
  const accountId = searchParams.get("accountId") || "nationwide-haul";

  const creds = getAccountCredentials(accountId);
  const customerId = creds.googleAdsCustomerId;

  if (!customerId || !creds.googleAdsDeveloperToken) {
    return NextResponse.json({
      platform: "google-ads",
      status: "error",
      error: `Google Ads not configured for account: ${accountId}`,
    });
  }

  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const data = await getGoogleAdsData(session.accessToken, (session as any).refreshToken, customerId, startDate, endDate); // eslint-disable-line @typescript-eslint/no-explicit-any
    return NextResponse.json({ platform: "google-ads", status: "live", accountId, data });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    return NextResponse.json({ platform: "google-ads", status: "error", error: error.message }, { status: 500 });
  }
}
