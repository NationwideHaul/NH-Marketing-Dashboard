import { NextRequest, NextResponse } from "next/server";
import { listAccounts, getCallSummary, getCalls, findCompanyId, getTrackingNumbers } from "@/lib/api-clients/callrail";
import { getAccountCredentials } from "@/lib/account-credentials";
import { format, subDays } from "date-fns";

// Cache company IDs so we don't look them up on every request
const companyIdCache: Record<string, string> = {};

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

  // Get the company name for this dashboard account
  const creds = getAccountCredentials(dashboardAccountId);
  const companyName = creds.callrailCompanyName || "Nationwide Haul";

  try {
    // Get the CallRail account ID
    const accountsData = await listAccounts();
    const accounts = accountsData.accounts || [];

    if (accounts.length === 0) {
      return NextResponse.json({ platform: "callrail", status: "error", error: "No CallRail accounts found" });
    }

    const crAccountId = accounts[0].id;

    // Find the company ID for this dashboard account's company
    let companyId = companyIdCache[companyName];
    if (!companyId) {
      companyId = await findCompanyId(crAccountId, companyName) || "";
      if (companyId) companyIdCache[companyName] = companyId;
    }

    if (type === "accounts") {
      return NextResponse.json({ platform: "callrail", status: "live", data: accounts });
    }

    if (type === "trackers") {
      const data = await getTrackingNumbers(crAccountId, companyId || undefined);
      return NextResponse.json({ platform: "callrail", status: "live", companyName, data });
    }

    if (type === "calls") {
      const data = await getCalls(crAccountId, startDate, endDate, companyId || undefined);
      return NextResponse.json({ platform: "callrail", status: "live", companyName, data });
    }

    // Default: summary filtered by company
    const data = await getCallSummary(crAccountId, startDate, endDate, companyId || undefined);
    return NextResponse.json({
      platform: "callrail",
      status: "live",
      accountId: dashboardAccountId,
      companyName,
      companyId: companyId || null,
      data,
    });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error(`CallRail API error (company: ${companyName}):`, error.message);
    return NextResponse.json({ platform: "callrail", status: "error", error: error.message }, { status: 500 });
  }
}
