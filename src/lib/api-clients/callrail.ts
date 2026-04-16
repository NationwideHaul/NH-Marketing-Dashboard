// CallRail API client for call tracking

import { getCredential } from "@/lib/credential-store";

const CR_BASE_URL = "https://api.callrail.com/v3";

async function getHeaders() {
  const { value: apiKey } = await getCredential("CALLRAIL_API_KEY");
  if (!apiKey) throw new Error("CALLRAIL_API_KEY not configured");
  return {
    Authorization: `Token token=${apiKey}`,
    "Content-Type": "application/json",
  };
}

// List accounts
export async function listAccounts() {
  const response = await fetch(`${CR_BASE_URL}/a.json`, {
    headers: await getHeaders(),
  });
  if (!response.ok) throw new Error(`CallRail API error: ${response.status}`);
  return response.json();
}

// List companies under an account
export async function listCompanies(accountId: string) {
  const response = await fetch(
    `${CR_BASE_URL}/a/${accountId}/companies.json`,
    { headers: await getHeaders() }
  );
  if (!response.ok) throw new Error(`CallRail API error: ${response.status}`);
  return response.json();
}

// Get calls for an account, optionally filtered by company ID
// Paginates to fetch ALL calls in the date range
export async function getCalls(
  accountId: string,
  startDate: string, // YYYY-MM-DD
  endDate: string,
  companyId?: string,
  perPage: number = 250
) {
  const allCalls: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= 10) { // Safety cap at 10 pages
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      per_page: String(perPage),
      page: String(page),
      fields: "source_name,tracker_id",
    });
    if (companyId) params.set("company_id", companyId);

    const response = await fetch(
      `${CR_BASE_URL}/a/${accountId}/calls.json?${params}`,
      { headers: await getHeaders() }
    );
    if (!response.ok) throw new Error(`CallRail API error: ${response.status}`);

    const data = await response.json();
    allCalls.push(...(data.calls || []));
    totalPages = data.total_pages || 1;
    page++;
  }

  return { calls: allCalls, total_records: allCalls.length };
}

// Get call analytics/summary
export async function getCallSummary(
  accountId: string,
  startDate: string,
  endDate: string,
  companyId?: string
) {
  // Fetch calls and all trackers in parallel
  const [callData, trackerData] = await Promise.all([
    getCalls(accountId, startDate, endDate, companyId),
    getTrackingNumbers(accountId, companyId).catch(() => ({ trackers: [] })),
  ]);
  const calls = callData.calls || [];
  const allTrackers: any[] = trackerData.trackers || []; // eslint-disable-line @typescript-eslint/no-explicit-any

  const totalCalls = calls.length;
  const answered = calls.filter((c: any) => c.answered).length; // eslint-disable-line @typescript-eslint/no-explicit-any
  const missed = totalCalls - answered;
  const firstTimeCalls = calls.filter((c: any) => c.first_call).length; // eslint-disable-line @typescript-eslint/no-explicit-any
  const durations = calls.filter((c: any) => c.duration).map((c: any) => c.duration); // eslint-disable-line @typescript-eslint/no-explicit-any
  const avgDuration = durations.length > 0
    ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length)
    : 0;

  // Source breakdown
  const sources: Record<string, number> = {};
  calls.forEach((c: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const src = c.source || "Unknown";
    sources[src] = (sources[src] || 0) + 1;
  });

  // Tracker/source name breakdown — includes ALL configured trackers (even those with 0 calls)
  const trackerBreakdown: Record<string, number> = {};
  // Seed with all tracker names at 0
  allTrackers.forEach((t: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (t.name) trackerBreakdown[t.name] = 0;
  });
  // Count actual calls by source_name
  calls.forEach((c: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const tracker = c.source_name || c.tracking_phone_number || "Unknown";
    trackerBreakdown[tracker] = (trackerBreakdown[tracker] || 0) + 1;
  });

  return {
    totalCalls,
    answered,
    missed,
    firstTimeCalls,
    avgDuration,
    answerRate: totalCalls > 0 ? Math.round((answered / totalCalls) * 1000) / 10 : 0,
    sourceBreakdown: Object.entries(sources)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count),
    trackerBreakdown: Object.entries(trackerBreakdown)
      .map(([tracker, count]) => ({ tracker, count }))
      .sort((a, b) => b.count - a.count),
    calls, // raw data for tables
  };
}

// Find company ID by name
export async function findCompanyId(accountId: string, companyName: string): Promise<string | null> {
  const data = await listCompanies(accountId);
  const companies = data.companies || [];
  const found = companies.find((c: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
    c.name === companyName || c.name.includes(companyName)
  );
  return found?.id || null;
}

// Get tracking numbers
export async function getTrackingNumbers(accountId: string, companyId?: string) {
  const params = companyId ? `?company_id=${companyId}` : "";
  const response = await fetch(
    `${CR_BASE_URL}/a/${accountId}/trackers.json${params}`,
    { headers: await getHeaders() }
  );
  if (!response.ok) throw new Error(`CallRail API error: ${response.status}`);
  return response.json();
}
