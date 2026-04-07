import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Auto-discover GMB accounts and locations on first sign-in
export async function GET() {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Step 1: List accounts
    const accountsRes = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      { headers: { Authorization: `Bearer ${session.accessToken}` } }
    );
    const accountsData = await accountsRes.json();

    if (!accountsData.accounts) {
      return NextResponse.json({ accounts: [], error: accountsData.error?.message });
    }

    // Step 2: For each account, list locations
    const results = [];
    for (const account of accountsData.accounts) {
      const locationsRes = await fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title,storefrontAddress,metadata`,
        { headers: { Authorization: `Bearer ${session.accessToken}` } }
      );
      const locationsData = await locationsRes.json();

      results.push({
        accountName: account.name, // e.g., "accounts/123456"
        accountDisplayName: account.accountName,
        type: account.type,
        locations: (locationsData.locations || []).map((loc: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
          locationName: loc.name, // e.g., "locations/789"
          title: loc.title,
          address: loc.storefrontAddress,
          placeId: loc.metadata?.placeId,
          mapsUri: loc.metadata?.mapsUri,
        })),
      });
    }

    return NextResponse.json({
      platform: "gmb",
      status: "live",
      accounts: results,
    });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("GMB Discovery error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
