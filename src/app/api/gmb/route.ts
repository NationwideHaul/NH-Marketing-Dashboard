import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGMBData } from "@/lib/api-clients/google";
import { getAccountCredentials } from "@/lib/account-credentials";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate") || "2025-01-01";
  const endDate = searchParams.get("endDate") || "2025-12-31";
  const accountId = searchParams.get("accountId") || "nationwide-haul";
  const locationIdParam = searchParams.get("locationId"); // optional: specific location

  // Get account credentials
  const creds = getAccountCredentials(accountId);

  // Determine which location to query
  let locationId = locationIdParam;
  const accountIdForGmb = process.env.GMB_ACCOUNT_ID;

  // If account has GMB locations configured, use the first one (or the specified one)
  if (creds.gmbLocations?.length) {
    if (locationIdParam) {
      const found = creds.gmbLocations.find((loc) => loc.id === locationIdParam);
      if (found) locationId = found.id;
    } else {
      locationId = creds.gmbLocations[0].id;
    }
  }

  // Fall back to env vars for accounts without configured locations
  if (!locationId) locationId = process.env.GMB_LOCATION_ID || null;

  if (!locationId || !process.env.GOOGLE_CLIENT_ID) {
    // Return location info if available (for the GMB page to show cards)
    if (creds.gmbLocations?.length) {
      return NextResponse.json({
        platform: "gmb",
        status: "locations-only",
        accountId,
        locations: creds.gmbLocations,
        message: "GMB API not yet connected. Showing location info.",
      });
    }
    return NextResponse.json({
      platform: "gmb",
      status: "not-configured",
      message: "GMB not configured for this account.",
    });
  }

  try {
    const session = await auth();
    if (!session?.accessToken) {
      // Still return location info even without auth
      if (creds.gmbLocations?.length) {
        return NextResponse.json({
          platform: "gmb",
          status: "locations-only",
          accountId,
          locations: creds.gmbLocations,
          message: "Sign in with Google to see GMB analytics.",
        });
      }
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const data = await getGMBData(
      session.accessToken,
      (session as any).refreshToken, // eslint-disable-line @typescript-eslint/no-explicit-any
      accountIdForGmb || "",
      locationId,
      startDate,
      endDate
    );

    return NextResponse.json({
      platform: "gmb",
      status: "live",
      accountId,
      locationId,
      locations: creds.gmbLocations || [],
      data,
    });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error(`GMB API error (${accountId}, location ${locationId}):`, error.message);
    // Return location info even on API error
    if (creds.gmbLocations?.length) {
      return NextResponse.json({
        platform: "gmb",
        status: "locations-only",
        accountId,
        locations: creds.gmbLocations,
        error: error.message,
      });
    }
    return NextResponse.json({ platform: "gmb", status: "error", error: error.message }, { status: 500 });
  }
}
