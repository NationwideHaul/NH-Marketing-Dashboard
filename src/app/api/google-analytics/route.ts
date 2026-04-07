import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGA4Data } from "@/lib/api-clients/google";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate") || "30daysAgo";
  const endDate = searchParams.get("endDate") || "today";

  // Check if Google credentials are configured
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId || !process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.json({
      platform: "google-analytics",
      status: "mock",
      message: "GA4_PROPERTY_ID or GOOGLE_CLIENT_ID not configured. Showing mock data.",
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
      data,
    });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("GA4 API error:", error.message);
    return NextResponse.json({
      platform: "google-analytics",
      status: "error",
      error: error.message,
    }, { status: 500 });
  }
}
