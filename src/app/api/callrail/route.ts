import { NextRequest, NextResponse } from "next/server";
import { listAccounts, getCallSummary, getCalls } from "@/lib/api-clients/callrail";
import { format, subDays } from "date-fns";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "summary"; // summary | calls | accounts
  const startDate = searchParams.get("startDate") || format(subDays(new Date(), 30), "yyyy-MM-dd");
  const endDate = searchParams.get("endDate") || format(new Date(), "yyyy-MM-dd");

  if (!process.env.CALLRAIL_API_KEY) {
    return NextResponse.json({
      platform: "callrail",
      status: "mock",
      message: "CALLRAIL_API_KEY not configured.",
    });
  }

  try {
    // First get accounts to find the account ID
    const accountsData = await listAccounts();
    const accounts = accountsData.accounts || [];

    if (accounts.length === 0) {
      return NextResponse.json({ platform: "callrail", status: "error", error: "No accounts found" });
    }

    const accountId = accounts[0].id; // Use first account

    if (type === "accounts") {
      return NextResponse.json({ platform: "callrail", status: "live", data: accounts });
    }

    if (type === "calls") {
      const data = await getCalls(accountId, startDate, endDate);
      return NextResponse.json({ platform: "callrail", status: "live", data });
    }

    // Default: summary
    const data = await getCallSummary(accountId, startDate, endDate);
    return NextResponse.json({
      platform: "callrail",
      status: "live",
      accountId,
      accountName: accounts[0].name,
      data,
    });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("CallRail API error:", error.message);
    return NextResponse.json({ platform: "callrail", status: "error", error: error.message }, { status: 500 });
  }
}
