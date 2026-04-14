import { NextRequest, NextResponse } from "next/server";
import { getCRMSummary } from "@/lib/api-clients/nationwide-haul-crm";
import { listAccounts, getCalls, findCompanyId } from "@/lib/api-clients/callrail";
import { format, subMonths, startOfMonth, endOfMonth, parseISO, differenceInCalendarMonths } from "date-fns";

/* ------------------------------------------------------------------ */
/*  CRM source → platform mapping (for info submits)                  */
/* ------------------------------------------------------------------ */

const SOURCE_TO_PLATFORM: Record<string, string> = {
  "TruckPaper": "TruckPaper",
  "TruckPaper.com": "TruckPaper",
  "Truckpaper.com": "TruckPaper",
  "Commercial Truck Trader": "Commercial Truck Trader",
  "My Little Salesman": "My Little Salesman",
  "Cherry Trader": "Cherry Trader",
  "nationwidehaul.com": "NH Website",
  "Website": "NH Website",
  "website": "NH Website",
  "FormSubmit": "NH Website",
  "CognitoForms": "NH Website",
  "Rentalyard": "Rentalyard",
  "Rentalyard.com": "Rentalyard",
  "RitchieList": "RitchieList",
};

/* ------------------------------------------------------------------ */
/*  CallRail tracker_name → platform mapping (for calls)              */
/*  Uses substring matching: if tracker name contains the key, it     */
/*  maps to that platform. Order matters — first match wins.          */
/* ------------------------------------------------------------------ */

const TRACKER_TO_PLATFORM: [string, string][] = [
  // TruckPaper (all variants)
  ["Truck Paper", "TruckPaper"],
  // Commercial Truck Trader
  ["Commercial Truck Trader", "Commercial Truck Trader"],
  // My Little Salesman
  ["My Little Salesman", "My Little Salesman"],
  // Cherry Trader
  ["Cherry Trader", "Cherry Trader"],
  // Sleeper Trader
  ["Sleeper Trader", "Sleeper Trader"],
  // NH Website
  ["NH Website", "NH Website"],
  ["Main Nationwide Haul Website", "NH Website"],
  ["Nationwide Haul.com", "NH Website"],
  ["NH Listing Details", "NH Website"],
  ["Nationwide Haul Inventory", "NH Website"],
  // Ritchie List
  ["Ritchie List", "RitchieList"],
  // Next Truck Online
  ["Next Truck Online", "Next Truck Online"],
  // Machinio
  ["Machinio", "Machinio"],
  // Trucker to Trucker
  ["Trucker to Trucker", "Trucker to Trucker"],
];

function trackerToPlatform(trackerName: string): string | null {
  for (const [pattern, platform] of TRACKER_TO_PLATFORM) {
    if (trackerName.includes(pattern)) return platform;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  CallRail company ID cache                                         */
/* ------------------------------------------------------------------ */

let cachedCRAccountId: string | null = null;
let cachedCompanyId: string | null = null;

async function getCallRailIds(): Promise<{ crAccountId: string; companyId: string | null }> {
  if (cachedCRAccountId) return { crAccountId: cachedCRAccountId, companyId: cachedCompanyId };

  const accountsData = await listAccounts();
  const accounts = accountsData.accounts || [];
  if (accounts.length === 0) throw new Error("No CallRail accounts");

  cachedCRAccountId = accounts[0].id;
  cachedCompanyId = await findCompanyId(cachedCRAccountId, "Nationwide Haul");
  return { crAccountId: cachedCRAccountId, companyId: cachedCompanyId };
}

/* ------------------------------------------------------------------ */
/*  Fetch CallRail calls for a month, aggregate by platform           */
/* ------------------------------------------------------------------ */

async function getCallsByPlatform(
  start: string,
  end: string,
): Promise<Record<string, number>> {
  const { crAccountId, companyId } = await getCallRailIds();
  const data = await getCalls(crAccountId, start, end, companyId || undefined);
  const calls = data.calls || [];

  const byPlatform: Record<string, number> = {};
  for (const call of calls) {
    const tracker = call.tracker_name || "";
    const platform = trackerToPlatform(tracker);
    if (platform) {
      byPlatform[platform] = (byPlatform[platform] || 0) + 1;
    }
  }
  return byPlatform;
}

/* ------------------------------------------------------------------ */
/*  GET /api/inventory-platform-leads                                 */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const endDateStr = searchParams.get("endDate") || format(new Date(), "yyyy-MM-dd");
  const startDateStr = searchParams.get("startDate") || format(subMonths(new Date(), 6), "yyyy-MM-dd");

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

    // Fetch CRM info submits + CallRail calls per month in parallel
    const apiResults = await Promise.all(
      monthRanges.map(async ({ start, end, monthLabel, monthKey }) => {
        const [crmResult, callResult] = await Promise.all([
          getCRMSummary(start, end)
            .then((data) => {
              const byPlatform: Record<string, number> = {};
              for (const [source, count] of Object.entries(data.leads.bySource)) {
                const platform = SOURCE_TO_PLATFORM[source];
                if (platform) byPlatform[platform] = (byPlatform[platform] || 0) + count;
              }
              return byPlatform;
            })
            .catch(() => ({} as Record<string, number>)),
          getCallsByPlatform(start, end).catch(() => ({} as Record<string, number>)),
        ]);

        return {
          month: monthLabel,
          monthKey,
          infoSubmitsByPlatform: crmResult,
          callsByPlatform: callResult,
        };
      }),
    );

    return NextResponse.json({ status: "live", data: apiResults });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Inventory platform leads error:", message);
    return NextResponse.json({ status: "error", error: message, data: null }, { status: 500 });
  }
}
