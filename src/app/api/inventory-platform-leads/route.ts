import { NextRequest, NextResponse } from "next/server";
import { getCRMSummary } from "@/lib/api-clients/nationwide-haul-crm";
import { format, subMonths, startOfMonth, endOfMonth, parseISO, differenceInCalendarMonths } from "date-fns";

/**
 * Maps CRM lead source names → inventory platform names.
 * Multiple CRM sources can map to the same platform (e.g. "TruckPaper" and "TruckPaper.com").
 */
const SOURCE_TO_PLATFORM: Record<string, string> = {
  // TruckPaper
  "TruckPaper": "TruckPaper",
  "TruckPaper.com": "TruckPaper",
  "Truckpaper.com": "TruckPaper",
  // Commercial Truck Trader
  "Commercial Truck Trader": "Commercial Truck Trader",
  // My Little Salesman
  "My Little Salesman": "My Little Salesman",
  // Cherry Trader
  "Cherry Trader": "Cherry Trader",
  // NH Website
  "nationwidehaul.com": "NH Website",
  "Website": "NH Website",
  "website": "NH Website",
  "FormSubmit": "NH Website",
  "CognitoForms": "NH Website",
  // Rentalyard (not a current platform, but tracked)
  "Rentalyard": "Rentalyard",
  "Rentalyard.com": "Rentalyard",
  // RitchieList
  "RitchieList": "RitchieList",
};

/**
 * GET /api/inventory-platform-leads?startDate=2026-01-01&endDate=2026-04-14
 *
 * Fetches CRM lead data per month within the date range and maps bySource to inventory platform names.
 * Also returns a "total" entry aggregating the entire range for the current-period view.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const endDateStr = searchParams.get("endDate") || format(new Date(), "yyyy-MM-dd");
  const startDateStr = searchParams.get("startDate") || format(subMonths(new Date(), 6), "yyyy-MM-dd");

  if (!process.env.NH_CRM_API_KEY) {
    return NextResponse.json({
      status: "error",
      message: "NH_CRM_API_KEY not configured.",
      data: null,
    });
  }

  try {
    const startDate = parseISO(startDateStr);
    const endDate = parseISO(endDateStr);
    const monthSpan = Math.max(differenceInCalendarMonths(endDate, startDate), 0) + 1;
    // Cap at 12 months to avoid excessive API calls
    const monthCount = Math.min(monthSpan, 12);

    // Build per-month ranges within the selected date range
    const monthPromises = Array.from({ length: monthCount }, (_, i) => {
      const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      const start = format(startOfMonth(monthDate), "yyyy-MM-dd");
      const end = format(endOfMonth(monthDate), "yyyy-MM-dd");
      const monthLabel = format(monthDate, "MMM yy");
      const monthKey = format(monthDate, "yyyy-MM");
      return { start, end, monthLabel, monthKey };
    });

    const apiResults = await Promise.all(
      monthPromises.map(async ({ start, end, monthLabel, monthKey }) => {
        try {
          const data = await getCRMSummary(start, end);
          const byPlatform: Record<string, number> = {};
          for (const [source, count] of Object.entries(data.leads.bySource)) {
            const platform = SOURCE_TO_PLATFORM[source];
            if (platform) {
              byPlatform[platform] = (byPlatform[platform] || 0) + count;
            }
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
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Inventory platform leads error:", message);
    return NextResponse.json(
      { status: "error", error: message, data: null },
      { status: 500 },
    );
  }
}
