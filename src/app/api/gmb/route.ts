import { NextRequest, NextResponse } from "next/server";
import { getGMBData, getStoredGoogleClient } from "@/lib/api-clients/google";
import { getAccountCredentials } from "@/lib/account-credentials";
import { getCredential } from "@/lib/credential-store";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate") || "2025-01-01";
  const endDate = searchParams.get("endDate") || "2025-12-31";
  const accountId = searchParams.get("accountId") || "nationwide-haul";
  const locationIdParam = searchParams.get("locationId");

  const creds = await getAccountCredentials(accountId);

  let locationId = locationIdParam;
  const [
    { value: accountIdForGmb },
    { value: gmbLocEnv },
    { value: clientId },
    { value: refreshToken },
  ] = await Promise.all([
    getCredential("GMB_ACCOUNT_ID"),
    getCredential("GMB_LOCATION_ID"),
    getCredential("GOOGLE_CLIENT_ID"),
    getCredential("GOOGLE_REFRESH_TOKEN"),
  ]);

  if (creds.gmbLocations?.length) {
    if (locationIdParam) {
      const found = creds.gmbLocations.find((loc) => loc.id === locationIdParam);
      if (found) locationId = found.id;
    } else {
      locationId = creds.gmbLocations[0].id;
    }
  }

  if (!locationId) locationId = gmbLocEnv || null;

  if (!locationId || !clientId) {
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

    const data = await getGMBData(accessToken, refreshToken || undefined, accountIdForGmb || "", locationId, startDate, endDate);

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
