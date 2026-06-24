import { NextRequest, NextResponse } from "next/server";
import { getCRMSummary, brandForAccount, type CRMSummaryResponse } from "@/lib/api-clients/nationwide-haul-crm";
import { getCrmSummaryDirect } from "@/lib/crm-summary-direct";
import { isCrmSupabaseConfigured } from "@/lib/supabase-crm";
import { format, subDays } from "date-fns";

const PLATFORM = "nationwide-haul-crm";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const metric = searchParams.get("metric") || "all"; // leads | revenue | funnel | all
  const startDate = searchParams.get("startDate") || format(subDays(new Date(), 30), "yyyy-MM-dd");
  const endDate = searchParams.get("endDate") || format(new Date(), "yyyy-MM-dd");
  const brand = brandForAccount(searchParams.get("accountId"));

  // Prefer reading the CRM's Supabase directly (clean attribution: deals.brand /
  // deals.channel / contacts.lead_source). Fall back to the CRM's summary
  // endpoint only if the CRM Supabase isn't configured.
  const useDirect = isCrmSupabaseConfigured();
  if (!useDirect && !process.env.NH_CRM_API_KEY) {
    return NextResponse.json({ platform: PLATFORM, status: "error", message: "CRM not configured." });
  }

  try {
    const summary: CRMSummaryResponse = useDirect
      ? await getCrmSummaryDirect(startDate, endDate, brand)
      : await getCRMSummary(startDate, endDate, brand);

    if (metric === "leads") {
      const { leads, period } = summary;
      return NextResponse.json({
        platform: PLATFORM,
        status: "live",
        data: {
          period,
          totalLeads: leads.total,
          previousTotal: leads.previousTotal,
          changePercent: leads.changePercent,
          bySource: Object.entries(leads.bySource).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count),
          byType: Object.entries(leads.byType).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
          byEquipmentType: Object.entries(leads.byEquipmentType).map(([equipmentType, count]) => ({ equipmentType, count })),
          timeSeries: leads.timeSeries,
        },
      });
    }

    if (metric === "revenue") {
      const { deals, period } = summary;
      return NextResponse.json({ platform: PLATFORM, status: "live", data: { period, ...deals, totalDeals: deals.total } });
    }

    if (metric === "funnel") {
      const { funnel, period } = summary;
      return NextResponse.json({ platform: PLATFORM, status: "live", data: { period, funnel, raw: funnel } });
    }

    // Default: full summary (used by the CRM Leads page + overview widgets)
    return NextResponse.json({ platform: PLATFORM, status: "live", data: summary });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("NH CRM API error:", message);
    return NextResponse.json({ platform: PLATFORM, status: "error", error: message, data: null }, { status: 500 });
  }
}
