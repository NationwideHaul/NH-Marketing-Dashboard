import { NextRequest, NextResponse } from "next/server";
import { format, subDays } from "date-fns";
import { getCallAnalytics } from "@/lib/api-clients/ringcentral";
import { listAccounts, getCallSummary, getCalls, findCompanyId, getTrackingNumbers } from "@/lib/api-clients/callrail";
import { getAccountCredentials } from "@/lib/account-credentials";

// Cache company IDs
const companyIdCache: Record<string, string> = {};

// Combined Call Logs endpoint -- merges RingCentral + CallRail
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const source = searchParams.get("source") || "all"; // all | ringcentral | callrail
  const startDate = searchParams.get("startDate") || format(subDays(new Date(), 30), "yyyy-MM-dd");
  const endDate = searchParams.get("endDate") || format(new Date(), "yyyy-MM-dd");
  const dashboardAccountId = searchParams.get("accountId") || "nationwide-haul";

  // Get company name for this dashboard account
  const creds = getAccountCredentials(dashboardAccountId);
  const companyName = creds.callrailCompanyName || "Nationwide Haul";

  const result: any = { platform: "call-logs", status: "live", companyName, data: {} }; // eslint-disable-line @typescript-eslint/no-explicit-any

  // ===== RINGCENTRAL =====
  if ((source === "all" || source === "ringcentral") && process.env.RINGCENTRAL_CLIENT_ID) {
    try {
      const rcData = await getCallAnalytics(
        new Date(startDate).toISOString(),
        new Date(endDate + "T23:59:59").toISOString()
      );
      result.data.ringcentral = rcData;
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      result.data.ringcentral = { error: error.message };
    }
  }

  // ===== CALLRAIL (filtered by company) =====
  if ((source === "all" || source === "callrail") && process.env.CALLRAIL_API_KEY) {
    try {
      const accountsData = await listAccounts();
      const accounts = accountsData.accounts || [];
      if (accounts.length > 0) {
        const crAccountId = accounts[0].id;

        // Find company ID for this account
        let companyId = companyIdCache[companyName];
        if (!companyId) {
          companyId = await findCompanyId(crAccountId, companyName) || "";
          if (companyId) companyIdCache[companyName] = companyId;
        }

        // Fetch trackers to build phone number -> name lookup
        const trackersData = await getTrackingNumbers(crAccountId, companyId || undefined);
        const trackers = trackersData.trackers || [];
        const trackerNameMap: Record<string, string> = {};
        trackers.forEach((t: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          // tracking_numbers is an array (e.g. ["+18632014144"])
          const numbers = t.tracking_numbers || [];
          numbers.forEach((n: string) => {
            trackerNameMap[n] = t.name; // e.g. "+18632014144" -> "Google Ads RV - Lakeland Shop"
            const digits = n.replace(/\D/g, "");
            if (digits) trackerNameMap[digits] = t.name; // also map "18632014144"
          });
        });

        const summary = await getCallSummary(crAccountId, startDate, endDate, companyId || undefined);
        const rawCalls = await getCalls(crAccountId, startDate, endDate, companyId || undefined);

        const calls = rawCalls.calls || [];
        const answeredCalls = calls.filter((c: any) => c.answered); // eslint-disable-line @typescript-eslint/no-explicit-any
        const qualifiedCalls = calls.filter((c: any) => c.answered && c.duration > 30); // eslint-disable-line @typescript-eslint/no-explicit-any
        const missedCalls = calls.filter((c: any) => !c.answered); // eslint-disable-line @typescript-eslint/no-explicit-any

        // Helper: resolve a tracking phone number to its friendly name
        function resolveTrackerName(call: any): string { // eslint-disable-line @typescript-eslint/no-explicit-any
          const rawNum = String(call.tracking_phone_number || "").replace(/\D/g, "");
          if (trackerNameMap[rawNum]) return trackerNameMap[rawNum];
          if (call.tracking_phone_number && trackerNameMap[call.tracking_phone_number]) return trackerNameMap[call.tracking_phone_number];
          if (call.source_name) return call.source_name;
          if (call.source && !/^\+?\d/.test(call.source)) return call.source; // Only use source if it's not a phone number
          return call.tracking_phone_number || "Unknown";
        }

        // Calls by source -- use tracker names
        const bySource: Record<string, { total: number; answered: number; qualified: number; missed: number }> = {};
        calls.forEach((c: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          const src = resolveTrackerName(c);
          if (!bySource[src]) bySource[src] = { total: 0, answered: 0, qualified: 0, missed: 0 };
          bySource[src].total++;
          if (c.answered) bySource[src].answered++;
          if (c.answered && c.duration > 30) bySource[src].qualified++;
          if (!c.answered) bySource[src].missed++;
        });

        // Calls by day of week (totals for the period, not averages)
        const byDayOfWeek: Record<string, { total: number; firstTime: number; repeat: number }> = {
          Sun: { total: 0, firstTime: 0, repeat: 0 },
          Mon: { total: 0, firstTime: 0, repeat: 0 },
          Tue: { total: 0, firstTime: 0, repeat: 0 },
          Wed: { total: 0, firstTime: 0, repeat: 0 },
          Thu: { total: 0, firstTime: 0, repeat: 0 },
          Fri: { total: 0, firstTime: 0, repeat: 0 },
          Sat: { total: 0, firstTime: 0, repeat: 0 },
        };
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        calls.forEach((c: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          const date = new Date(c.created_at || c.start_time);
          const day = dayNames[date.getDay()];
          if (byDayOfWeek[day]) {
            byDayOfWeek[day].total++;
            if (c.first_call) byDayOfWeek[day].firstTime++;
            else byDayOfWeek[day].repeat++;
          }
        });

        // Calls by hour
        const byHour: Record<number, number> = {};
        calls.forEach((c: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          const hour = new Date(c.created_at || c.start_time).getHours();
          byHour[hour] = (byHour[hour] || 0) + 1;
        });

        result.data.callrail = {
          ...summary,
          companyName,
          qualifiedCalls: qualifiedCalls.length,
          missedCallRate: calls.length > 0 ? Math.round((missedCalls.length / calls.length) * 1000) / 10 : 0,
          bySource: Object.entries(bySource)
            .map(([source, stats]) => ({ source, ...stats }))
            .sort((a, b) => b.total - a.total),
          byDayOfWeek: Object.entries(byDayOfWeek).map(([day, stats]) => ({ day, ...stats })),
          byHour: Object.entries(byHour)
            .map(([hour, count]) => ({ hour: parseInt(hour), count }))
            .sort((a, b) => a.hour - b.hour),
          recentCalls: calls.slice(0, 20).map((c: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
            caller: c.caller_name || c.caller_number || "Unknown",
            number: c.caller_number,
            source: resolveTrackerName(c),
            duration: c.duration || 0,
            answered: c.answered || false,
            firstCall: c.first_call || false,
            date: c.created_at,
          })),
        };
      }
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      result.data.callrail = { error: error.message };
    }
  }

  return NextResponse.json(result);
}
