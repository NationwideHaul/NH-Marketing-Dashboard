import { NextRequest, NextResponse } from "next/server";
import { getCallAnalytics } from "@/lib/api-clients/ringcentral";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dateFrom = searchParams.get("dateFrom") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const dateTo = searchParams.get("dateTo") || new Date().toISOString();

  if (!process.env.RINGCENTRAL_CLIENT_ID || !process.env.RINGCENTRAL_JWT_TOKEN) {
    return NextResponse.json({
      platform: "ringcentral",
      status: "mock",
      message: "RingCentral credentials not configured. Showing mock data.",
    });
  }

  try {
    const data = await getCallAnalytics(dateFrom, dateTo);
    return NextResponse.json({ platform: "ringcentral", status: "live", data });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("RingCentral API error:", error.message);
    return NextResponse.json({ platform: "ringcentral", status: "error", error: error.message }, { status: 500 });
  }
}
