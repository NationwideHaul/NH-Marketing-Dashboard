import { NextRequest, NextResponse } from "next/server";
import { getCRMSummary, brandForAccount } from "@/lib/api-clients/nationwide-haul-crm";
import { normalizeCRMSource } from "@/lib/crm-source-normalize";
import { format, subMonths, startOfMonth, endOfMonth, parseISO, differenceInCalendarMonths } from "date-fns";

/**
 * Maps canonical CRM lead source names (see normalizeCRMSource) → inventory
 * platform names. Sources are normalized before lookup, so only canonical keys
 * are needed here.
 */
const SOURCE_TO_PLATFORM: Record<string, string> = {
  "TruckPaper": "TruckPaper",
  "Commercial Truck Trader": "Commercial Truck Trader",
  "My Little Salesman": "My Little Salesman",
  "Cherry Trader": "Cherry Trader",
  "Nationwide Haul Website": "NH Website",
  "FormSubmit": "NH Website",
  "CognitoForms": "NH Website",
  "Rentalyard": "Rentalyard",
  "RitchieList": "RitchieList",
  // NFI Truck Sales website
  "NFI Website": "NFI Website",
};

/**
 * GET /api/inventory-platform-leads?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 *
 * Fetches CRM lead data per month and maps bySource to inventory platform names.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const endDateStr = searchParams.get("endDate") || format(new Date(), "yyyy-MM-dd");
  const startDateStr = searchParams.get("startDate") || format(subMonths(new Date(), 6), "yyyy-MM-dd");
  // Filter info submits to the account's brand (NFI gets only NFI-tagged leads).
  const brand = brandForAccount(searchParams.get("accountId"));

  if (!process.env.NH_CRM_API_KEY) {
    return NextResponse.json({ status: "error", message: "NH_CRM_API_KEY not configured.", data: null });
  }

  try {
    const startDate = parseISO(startDateStr);
    const endDate = parseISO(endDateStr);
    const monthSpan = Math.max(differenceInCalendarMonths(endDate, startDate), 0) + 1;
    const monthCount = Math.min(monthSpan, 12);

    const monthRanges = Array.from({ length: monthCount }, (_, i) => {
      const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      return {
        start: format(startOfMonth(monthDate), "yyyy-MM-dd"),
        end: format(endOfMonth(monthDate), "yyyy-MM-dd"),
        monthLabel: format(monthDate, "MMM yy"),
        monthKey: format(monthDate, "yyyy-MM"),
      };
    });

    const debug = searchParams.get("debug") === "1";
    const typesSeen: Record<string, number> = {};
    const sourcesSeen: Record<string, number> = {};

    const apiResults = await Promise.all(
      monthRanges.map(async ({ start, end, monthLabel, monthKey }) => {
        try {
          const data = await getCRMSummary(start, end, brand);
          if (debug) {
            for (const [t, c] of Object.entries(data.leads.byType || {})) {
              typesSeen[t] = (typesSeen[t] || 0) + c;
            }
            for (const [s, c] of Object.entries(data.leads.bySource || {})) {
              sourcesSeen[s] = (sourcesSeen[s] || 0) + c;
            }
          }
          const byPlatform: Record<string, number> = {};
          for (const [source, count] of Object.entries(data.leads.bySource)) {
            const platform = SOURCE_TO_PLATFORM[normalizeCRMSource(source)];
            if (platform) byPlatform[platform] = (byPlatform[platform] || 0) + count;
          }
          return { month: monthLabel, monthKey, byPlatform };
        } catch {
          return { month: monthLabel, monthKey, byPlatform: {} };
        }
      }),
    );

    return NextResponse.json({
      status: "live",
      data: apiResults,
      ...(debug ? { debug: { typesSeen, sourcesSeen } } : {}),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Inventory platform leads error:", message);
    return NextResponse.json({ status: "error", error: message, data: null }, { status: 500 });
  }
}
