import { NextRequest, NextResponse } from "next/server";
import { listAccounts, getCallSummary, getCalls, getTrackingNumbers } from "@/lib/api-clients/callrail";
import { getAccountCredentials } from "@/lib/account-credentials";
import { format, subDays } from "date-fns";

// Cache the top-level CallRail account ID (same for all companies)
let cachedCRAccountId: string | null = null;

async function getCRAccountId(): Promise<string> {
  if (cachedCRAccountId) return cachedCRAccountId;
  const accountsData = await listAccounts();
  const accounts = accountsData.accounts || [];
  if (accounts.length === 0) throw new Error("No CallRail accounts found");
  cachedCRAccountId = accounts[0].id;
  return cachedCRAccountId;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "summary"; // summary | calls | accounts | trackers
  const startDate = searchParams.get("startDate") || format(subDays(new Date(), 30), "yyyy-MM-dd");
  const endDate = searchParams.get("endDate") || format(new Date(), "yyyy-MM-dd");
  const dashboardAccountId = searchParams.get("accountId") || "nationwide-haul";

  if (!process.env.CALLRAIL_API_KEY) {
    return NextResponse.json({
      platform: "callrail",
      status: "error",
      message: "CALLRAIL_API_KEY not configured.",
    });
  }

  // Get credentials for this dashboard account — includes company ID
  const creds = await getAccountCredentials(dashboardAccountId);
  const companyId = creds.callrailCompanyId;
  const companyName = creds.callrailCompanyName || dashboardAccountId;

  if (!companyId) {
    return NextResponse.json({
      platform: "callrail",
      status: "error",
      message: `No CallRail company ID configured for account "${dashboardAccountId}".`,
    });
  }

  try {
    const crAccountId = await getCRAccountId();

    if (type === "accounts") {
      const accountsData = await listAccounts();
      return NextResponse.json({ platform: "callrail", status: "live", data: accountsData.accounts || [] });
    }

    if (type === "trackers") {
      const data = await getTrackingNumbers(crAccountId, companyId);
      return NextResponse.json({ platform: "callrail", status: "live", companyName, companyId, data });
    }

    if (type === "calls") {
      const data = await getCalls(crAccountId, startDate, endDate, companyId);
      return NextResponse.json({ platform: "callrail", status: "live", companyName, companyId, data });
    }

    // Default: summary filtered by company ID
    const data = await getCallSummary(crAccountId, startDate, endDate, companyId);
    return NextResponse.json({
      platform: "callrail",
      status: "live",
      accountId: dashboardAccountId,
      companyName,
      companyId,
      data,
    });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error(`CallRail API error (${companyName}, companyId: ${companyId}):`, error.message);
    return NextResponse.json({ platform: "callrail", status: "error", error: error.message }, { status: 500 });
  }
}
