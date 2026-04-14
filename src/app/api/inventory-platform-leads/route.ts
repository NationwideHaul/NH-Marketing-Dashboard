import { NextRequest, NextResponse } from "next/server";
import { getCRMSummary } from "@/lib/api-clients/nationwide-haul-crm";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

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
 * GET /api/inventory-platform-leads?months=7
 *
 * Fetches CRM lead data per month and maps bySource to inventory platform names.
 * Returns an array of monthly entries with per-platform info submit counts.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const monthCount = Math.min(Number(searchParams.get("months") || "7"), 12);

  if (!process.env.NH_CRM_API_KEY) {
    return NextResponse.json({
      status: "error",
      message: "NH_CRM_API_KEY not configured.",
      data: null,
    });
  }

  try {
    const now = new Date();
    const results: Array<{
      month: string; // "Mar 26" format
      monthKey: string; // "2026-03" format
      byPlatform: Record<string, number>;
    }> = [];

    // Fetch each month in parallel
    const monthPromises = Array.from({ length: monthCount }, (_, i) => {
      const monthDate = subMonths(now, monthCount - 1 - i);
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
          // Map CRM sources to platform names
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
