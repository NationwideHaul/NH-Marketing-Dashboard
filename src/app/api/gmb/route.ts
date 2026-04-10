import { NextRequest, NextResponse } from "next/server";
import { getGMBData, getStoredGoogleClient } from "@/lib/api-clients/google";
import { getAccountCredentials } from "@/lib/account-credentials";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate") || "2025-01-01";
  const endDate = searchParams.get("endDate") || "2025-12-31";
  const accountId = searchParams.get("accountId") || "nationwide-haul";
  const locationIdParam = searchParams.get("locationId");

  const creds = getAccountCredentials(accountId);

  let locationId = locationIdParam;
  const accountIdForGmb = process.env.GMB_ACCOUNT_ID;

  if (creds.gmbLocations?.length) {
    if (locationIdParam) {
      const found = creds.gmbLocations.find((loc) => loc.id === locationIdParam);
      if (found) locationId = found.id;
    } else {
      locationId = creds.gmbLocations[0].id;
    }
  }

  if (!locationId) locationId = process.env.GMB_LOCATION_ID || null;

  if (!locationId || !process.env.GOOGLE_CLIENT_ID) {
    if (creds.gmbLocations?.length) {
      return NextResponse.json({
        platform: "gmb", status: "locations-only", accountId,
        locations: creds.gmbLocations, message: "GMB API not yet connected.",
      });
    }
    return NextResponse.json({ platform: "gmb", status: "not-configured", message: "GMB not configured." });
  }

  try {
    const { accessToken } = await getStoredGoogleClient();

    const data = await getGMBData(accessToken, process.env.GOOGLE_REFRESH_TOKEN, accountIdForGmb || "", locationId, startDate, endDate);

    return NextResponse.json({
      platform: "gmb", status: "live", accountId, locationId,
      locations: creds.gmbLocations || [], data,
    });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error(`GMB API error (${accountId}, location ${locationId}):`, error.message);
    if (creds.gmbLocations?.length) {
      return NextResponse.json({
        platform: "gmb", status: "locations-only", accountId,
        locations: creds.gmbLocations, error: error.message,
      });
    }
    return NextResponse.json({ platform: "gmb", status: "error", error: error.message }, { status: 500 });
  }
}
