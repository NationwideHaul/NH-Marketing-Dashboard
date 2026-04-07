import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGoogleAdsData } from "@/lib/api-clients/google";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate") || "2025-01-01";
  const endDate = searchParams.get("endDate") || "2025-12-31";

  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
  if (!customerId || !process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.json({
      platform: "google-ads",
      status: "mock",
      message: "GOOGLE_ADS_CUSTOMER_ID not configured. Showing mock data.",
    });
  }

  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const data = await getGoogleAdsData(
      session.accessToken,
      (session as any).refreshToken, // eslint-disable-line @typescript-eslint/no-explicit-any
      customerId,
      startDate,
      endDate
    );

    return NextResponse.json({ platform: "google-ads", status: "live", data });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("Google Ads API error:", error.message);
    return NextResponse.json({ platform: "google-ads", status: "error", error: error.message }, { status: 500 });
  }
}
