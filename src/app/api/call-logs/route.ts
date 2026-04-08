import { NextRequest, NextResponse } from "next/server";
import { format, subDays } from "date-fns";
import { getCallAnalytics } from "@/lib/api-clients/ringcentral";
import { listAccounts, getCallSummary, getCalls } from "@/lib/api-clients/callrail";

// Combined Call Logs endpoint — merges RingCentral + CallRail
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const source = searchParams.get("source") || "all"; // all | ringcentral | callrail
  const startDate = searchParams.get("startDate") || format(subDays(new Date(), 30), "yyyy-MM-dd");
  const endDate = searchParams.get("endDate") || format(new Date(), "yyyy-MM-dd");
  const department = searchParams.get("department") || "Nationwide Haul";

  const result: any = { platform: "call-logs", status: "live", data: {} }; // eslint-disable-line @typescript-eslint/no-explicit-any

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

  // ===== CALLRAIL =====
  if ((source === "all" || source === "callrail") && process.env.CALLRAIL_API_KEY) {
    try {
      const accountsData = await listAccounts();
      const accounts = accountsData.accounts || [];
      if (accounts.length > 0) {
        const accountId = accounts[0].id;
        const summary = await getCallSummary(accountId, startDate, endDate);
        const rawCalls = await getCalls(accountId, startDate, endDate);

        // Enrich with quality filters
        const calls = rawCalls.calls || [];
        const answeredCalls = calls.filter((c: any) => c.answered); // eslint-disable-line @typescript-eslint/no-explicit-any
        const qualifiedCalls = calls.filter((c: any) => c.answered && c.duration > 30); // eslint-disable-line @typescript-eslint/no-explicit-any
        const missedCalls = calls.filter((c: any) => !c.answered); // eslint-disable-line @typescript-eslint/no-explicit-any
        const firstTimeCalls = calls.filter((c: any) => c.first_call); // eslint-disable-line @typescript-eslint/no-explicit-any

        // Calls by source (lead attribution)
        const bySource: Record<string, { total: number; answered: number; qualified: number; missed: number }> = {};
        calls.forEach((c: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          const src = c.source || c.tracking_phone_number || "Unknown";
          if (!bySource[src]) bySource[src] = { total: 0, answered: 0, qualified: 0, missed: 0 };
          bySource[src].total++;
          if (c.answered) bySource[src].answered++;
          if (c.answered && c.duration > 30) bySource[src].qualified++;
          if (!c.answered) bySource[src].missed++;
        });

        // Calls by day of week
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

        // Calls by hour (heatmap data)
        const byHour: Record<number, number> = {};
        calls.forEach((c: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          const hour = new Date(c.created_at || c.start_time).getHours();
          byHour[hour] = (byHour[hour] || 0) + 1;
        });

        result.data.callrail = {
          ...summary,
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
            source: c.source || "Unknown",
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
