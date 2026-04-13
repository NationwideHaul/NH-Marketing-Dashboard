import { NextRequest, NextResponse } from "next/server";
import { getLocationStats } from "@/lib/api-clients/gohighlevel";
import { getAccountCredentials } from "@/lib/account-credentials";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const accountId = searchParams.get("accountId") || "nationwide-haul";
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const creds = getAccountCredentials(accountId);
  const apiKey = creds.ghlApiKey;
  const locationId = creds.ghlLocationId;

  if (!apiKey || !locationId) {
    return NextResponse.json({
      platform: "go-high-level",
      status: "error",
      error: `GHL not configured for account: ${accountId}`,
    });
  }

  const rangeStartMs = startDate ? new Date(`${startDate}T00:00:00Z`).getTime() : undefined;
  const rangeEndMs = endDate ? new Date(`${endDate}T23:59:59Z`).getTime() : undefined;

  try {
    const stats = await getLocationStats(apiKey, locationId, rangeStartMs, rangeEndMs);
    return NextResponse.json({
      platform: "go-high-level",
      status: "live",
      accountId,
      locationId,
      data: stats,
    });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    return NextResponse.json(
      { platform: "go-high-level", status: "error", error: error.message },
      { status: 500 }
    );
  }
}
