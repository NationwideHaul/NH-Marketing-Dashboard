import { NextRequest, NextResponse } from "next/server";
import { getCRMSummary, getCRMLeadMetrics, getCRMRevenueMetrics, getCRMFunnelMetrics } from "@/lib/api-clients/nationwide-haul-crm";
import { format, subDays } from "date-fns";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const metric = searchParams.get("metric") || "all"; // leads | revenue | funnel | all
  const startDate = searchParams.get("startDate") || format(subDays(new Date(), 30), "yyyy-MM-dd");
  const endDate = searchParams.get("endDate") || format(new Date(), "yyyy-MM-dd");
  // accountId accepted for consistency with other routes (CRM is NH-specific for now)
  const accountId = searchParams.get("accountId") || "nationwide-haul"; // eslint-disable-line @typescript-eslint/no-unused-vars

  if (!process.env.NH_CRM_API_KEY) {
    return NextResponse.json({
      platform: "nationwide-haul-crm",
      status: "error",
      message: "NH_CRM_API_KEY not configured.",
    });
  }

  try {
    if (metric === "leads") {
      const data = await getCRMLeadMetrics(startDate, endDate);
      return NextResponse.json({ platform: "nationwide-haul-crm", status: "live", data });
    }

    if (metric === "revenue") {
      const data = await getCRMRevenueMetrics(startDate, endDate);
      return NextResponse.json({ platform: "nationwide-haul-crm", status: "live", data });
    }

    if (metric === "funnel") {
      const data = await getCRMFunnelMetrics(startDate, endDate);
      return NextResponse.json({ platform: "nationwide-haul-crm", status: "live", data });
    }

    // Default: all metrics from a single API call
    const summary = await getCRMSummary(startDate, endDate);
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
