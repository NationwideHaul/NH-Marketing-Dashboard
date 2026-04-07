import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGMBData } from "@/lib/api-clients/google";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate") || "2025-01-01";
  const endDate = searchParams.get("endDate") || "2025-12-31";

  const accountId = process.env.GMB_ACCOUNT_ID;
  const locationId = process.env.GMB_LOCATION_ID;
  if (!accountId || !locationId || !process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.json({
      platform: "gmb",
      status: "mock",
      message: "GMB credentials not configured. Showing mock data.",
    });
  }

  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const data = await getGMBData(
      session.accessToken,
      (session as any).refreshToken, // eslint-disable-line @typescript-eslint/no-explicit-any
      accountId,
      locationId,
      startDate,
      endDate
    );

    return NextResponse.json({ platform: "gmb", status: "live", data });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("GMB API error:", error.message);
    return NextResponse.json({ platform: "gmb", status: "error", error: error.message }, { status: 500 });
  }
}
