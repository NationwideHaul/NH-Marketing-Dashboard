// RingCentral API client for call tracking

const RC_BASE_URL = process.env.RINGCENTRAL_SERVER_URL || "https://platform.ringcentral.com";

interface RCAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Authenticate using JWT (service account)
async function getAccessToken(): Promise<string> {
  const clientId = process.env.RINGCENTRAL_CLIENT_ID;
  const clientSecret = process.env.RINGCENTRAL_CLIENT_SECRET;
  const jwtToken = process.env.RINGCENTRAL_JWT_TOKEN;

  if (!clientId || !clientSecret || !jwtToken) {
    throw new Error("RingCentral credentials not configured");
  }

  const response = await fetch(`${RC_BASE_URL}/restapi/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwtToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`RingCentral auth failed: ${response.status}`);
  }

  const data: RCAuthResponse = await response.json();
  return data.access_token;
}

// Get call log
export async function getCallLog(
  dateFrom: string, // ISO format
  dateTo: string,
  perPage: number = 100
) {
  const token = await getAccessToken();

  const params = new URLSearchParams({
    dateFrom,
    dateTo,
    perPage: String(perPage),
    view: "Detailed",
  });

  const response = await fetch(
    `${RC_BASE_URL}/restapi/v1.0/account/~/call-log?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    throw new Error(`RingCentral API error: ${response.status}`);
  }

  return response.json();
}

// Get call log analytics (aggregated)
export async function getCallAnalytics(
  dateFrom: string,
  dateTo: string
) {
  const token = await getAccessToken();

  const response = await fetch(
    `${RC_BASE_URL}/restapi/v1.0/account/~/call-log?dateFrom=${dateFrom}&dateTo=${dateTo}&view=Simple&perPage=250`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    throw new Error(`RingCentral API error: ${response.status}`);
  }

  const data = await response.json();

  // Aggregate the call data
  const calls = data.records || [];
  const totalCalls = calls.length;
  const answered = calls.filter((c: any) => c.result === "Accepted" || c.result === "Call connected").length; // eslint-disable-line @typescript-eslint/no-explicit-any
  const missed = calls.filter((c: any) => c.result === "Missed" || c.result === "No Answer").length; // eslint-disable-line @typescript-eslint/no-explicit-any
  const durations = calls.filter((c: any) => c.duration).map((c: any) => c.duration); // eslint-disable-line @typescript-eslint/no-explicit-any
  const avgDuration = durations.length > 0 ? durations.reduce((a: number, b: number) => a + b, 0) / durations.length / 60 : 0;

  return {
    totalCalls,
    answered,
    missed,
    avgDuration: Math.round(avgDuration * 10) / 10,
    answerRate: totalCalls > 0 ? Math.round((answered / totalCalls) * 1000) / 10 : 0,
    records: calls,
  };
}
