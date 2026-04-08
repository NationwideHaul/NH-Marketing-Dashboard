// CallRail API client for call tracking

const CR_BASE_URL = "https://api.callrail.com/v3";

function getHeaders() {
  const apiKey = process.env.CALLRAIL_API_KEY;
  if (!apiKey) throw new Error("CALLRAIL_API_KEY not configured");
  return {
    Authorization: `Token token=${apiKey}`,
    "Content-Type": "application/json",
  };
}

// List accounts
export async function listAccounts() {
  const response = await fetch(`${CR_BASE_URL}/a.json`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error(`CallRail API error: ${response.status}`);
  return response.json();
}

// Get calls for an account
export async function getCalls(
  accountId: string,
  startDate: string, // YYYY-MM-DD
  endDate: string,
  perPage: number = 250
) {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    per_page: String(perPage),
  });

  const response = await fetch(
    `${CR_BASE_URL}/a/${accountId}/calls.json?${params}`,
    { headers: getHeaders() }
  );
  if (!response.ok) throw new Error(`CallRail API error: ${response.status}`);
  return response.json();
}

// Get call analytics/summary
export async function getCallSummary(
  accountId: string,
  startDate: string,
  endDate: string
) {
  const data = await getCalls(accountId, startDate, endDate);
  const calls = data.calls || [];

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
    calls, // raw data for tables
  };
}

// Get tracking numbers
export async function getTrackingNumbers(accountId: string) {
  const response = await fetch(
    `${CR_BASE_URL}/a/${accountId}/trackers.json`,
    { headers: getHeaders() }
  );
  if (!response.ok) throw new Error(`CallRail API error: ${response.status}`);
  return response.json();
}
