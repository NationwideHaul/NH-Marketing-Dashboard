import { NextRequest, NextResponse } from "next/server";
import { getCRMSummary, getCRMLeadMetrics, getCRMRevenueMetrics, getCRMFunnelMetrics, brandForAccount } from "@/lib/api-clients/nationwide-haul-crm";
import { format, subDays } from "date-fns";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const metric = searchParams.get("metric") || "all"; // leads | revenue | funnel | all
  const startDate = searchParams.get("startDate") || format(subDays(new Date(), 30), "yyyy-MM-dd");
  const endDate = searchParams.get("endDate") || format(new Date(), "yyyy-MM-dd");
  // NFI is segmented by the "NFI Truck Sales" deal tag; other accounts get all leads.
  const brand = brandForAccount(searchParams.get("accountId"));

  if (!process.env.NH_CRM_API_KEY) {
    return NextResponse.json({
      platform: "nationwide-haul-crm",
      status: "error",
      message: "NH_CRM_API_KEY not configured.",
    });
  }

  try {
    if (metric === "leads") {
      const data = await getCRMLeadMetrics(startDate, endDate, brand);
      return NextResponse.json({ platform: "nationwide-haul-crm", status: "live", data });
    }

    if (metric === "revenue") {
      const data = await getCRMRevenueMetrics(startDate, endDate, brand);
      return NextResponse.json({ platform: "nationwide-haul-crm", status: "live", data });
    }

    if (metric === "funnel") {
      const data = await getCRMFunnelMetrics(startDate, endDate, brand);
      return NextResponse.json({ platform: "nationwide-haul-crm", status: "live", data });
    }

    // Default: all metrics from a single API call
    const summary = await getCRMSummary(startDate, endDate, brand);
    return NextResponse.json({
      platform: "nationwide-haul-crm",
      status: "live",
      data: summary,
    });
  } catch (error: unknown) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("NH CRM API error:", message);
    return NextResponse.json(
      { platform: "nationwide-haul-crm", status: "error", error: message, data: null },
      { status: 500 }
    );
  }
}
