import { NextRequest, NextResponse } from "next/server";
import { getLocationStats } from "@/lib/api-clients/gohighlevel";
import { getAccountCredentials } from "@/lib/account-credentials";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const accountId = searchParams.get("accountId") || "nationwide-haul";

  const creds = getAccountCredentials(accountId);
  const apiKey = creds.ghlApiKey || process.env.GHL_API_KEY;
  const locationId = creds.ghlLocationId;

  if (!apiKey || !locationId) {
    return NextResponse.json({ platform: "go-high-level", status: "error", error: `GHL not configured for account: ${accountId}` });
  }

  try {
    const stats = await getLocationStats(locationId);
    return NextResponse.json({ platform: "go-high-level", status: "live", accountId, data: stats });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    return NextResponse.json({ platform: "go-high-level", status: "error", error: error.message }, { status: 500 });
  }
}
