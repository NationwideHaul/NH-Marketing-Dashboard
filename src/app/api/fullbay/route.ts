import { NextRequest, NextResponse } from "next/server";
import { format, subDays } from "date-fns";
import { getRevenueSummary, getInvoices } from "@/lib/api-clients/fullbay";

// FullBay is NHTTR-only. Gate other accounts so callers can't accidentally
// pull repair revenue while viewing a different subaccount.
const ALLOWED_ACCOUNTS = new Set(["nhttr", "nhttr-rv", "nhttr-ttr"]);

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const type = sp.get("type") || "summary"; // summary | invoices
  const startDate = sp.get("startDate") || format(subDays(new Date(), 30), "yyyy-MM-dd");
  const endDate = sp.get("endDate") || format(new Date(), "yyyy-MM-dd");
  const accountId = sp.get("accountId") || "nhttr";

  if (!ALLOWED_ACCOUNTS.has(accountId)) {
    return NextResponse.json({
      platform: "fullbay",
      status: "error",
      error: `FullBay is only configured for NHTTR (requested: ${accountId})`,
    });
  }

  if (!process.env.NHTTR_FULLBAY) {
    return NextResponse.json({
      platform: "fullbay",
      status: "error",
      error: "NHTTR_FULLBAY not configured",
    });
  }

  try {
    if (type === "invoices") {
      const data = await getInvoices(startDate, endDate);
      return NextResponse.json({ platform: "fullbay", status: "live", accountId, data });
    }
    const data = await getRevenueSummary(startDate, endDate);
    return NextResponse.json({ platform: "fullbay", status: "live", accountId, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FullBay API error (${accountId}):`, message);
    return NextResponse.json({ platform: "fullbay", status: "error", error: message }, { status: 500 });
  }
}
