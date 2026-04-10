import { google } from "googleapis";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

// Create OAuth2 client from env
function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
  );
  return oauth2Client;
}

// Set credentials from session token
export function getAuthenticatedClient(accessToken: string, refreshToken?: string) {
  const client = getOAuth2Client();
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return client;
}

// ========== GOOGLE ANALYTICS 4 ==========
export async function getGA4Data(
  accessToken: string,
  refreshToken: string | undefined,
  propertyId: string,
  startDate: string, // YYYY-MM-DD
  endDate: string,
  dimension?: string // optional: "deviceCategory", "sessionDefaultChannelGroup", "sessionSource", etc.
) {
  const auth = getAuthenticatedClient(accessToken, refreshToken);

  const analyticsData = new BetaAnalyticsDataClient({
    authClient: auth as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  });

  // Use custom dimension if provided, otherwise default to date
  const dimensionName = dimension || "date";
  const metrics = [
    { name: "sessions" },
    { name: "totalUsers" },
    { name: "screenPageViews" },
    { name: "bounceRate" },
    { name: "averageSessionDuration" },
    { name: "conversions" },
  ];

  const orderBys = dimension
    ? [{ metric: { metricName: "sessions" }, desc: true }]
    : [{ dimension: { dimensionName: "date" } }];

  const [response] = await analyticsData.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: dimensionName }],
    metrics,
    orderBys,
  });

  return response;
}

// ========== GOOGLE ADS ==========
export async function getGoogleAdsData(
  accessToken: string,
  refreshToken: string | undefined,
  customerId: string,
  startDate: string,
  endDate: string
) {
  const auth = getAuthenticatedClient(accessToken, refreshToken);

  // Google Ads API uses REST
  const url = `https://googleads.googleapis.com/v19/customers/${customerId}/googleAds:searchStream`;

  const query = `
    SELECT
      segments.date,
      metrics.cost_micros,
      metrics.clicks,
      metrics.impressions,
      metrics.ctr,
      metrics.conversions,
      metrics.cost_per_conversion
    FROM customer
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
    ORDER BY segments.date ASC
  `;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
    "Content-Type": "application/json",
  };

  // MCC (Manager Account) ID is required when accessing sub-accounts
  const managerId = process.env.GOOGLE_ADS_MANAGER_ID;
  if (managerId) {
    headers["login-customer-id"] = managerId;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
  });

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    // API returned non-JSON (likely HTML error page)
    throw new Error(`Google Ads API error (${response.status}): ${text.substring(0, 500)}`);
  }
}

// ========== GOOGLE MY BUSINESS ==========
export async function getGMBData(
  accessToken: string,
  refreshToken: string | undefined,
  accountId: string,
  locationId: string,
  startDate: string,
  endDate: string
) {
  const auth = getAuthenticatedClient(accessToken, refreshToken);

  const mybusiness = google.mybusinessbusinessinformation({
    version: "v1",
    auth,
  });

  // Business Performance API
  const url = `https://businessprofileperformance.googleapis.com/v1/locations/${locationId}:fetchMultiDailyMetricsTimeSeries`;

  const response = await fetch(
    `${url}?dailyMetrics=BUSINESS_IMPRESSIONS_DESKTOP_MAPS&dailyMetrics=BUSINESS_IMPRESSIONS_DESKTOP_SEARCH&dailyMetrics=CALL_CLICKS&dailyMetrics=WEBSITE_CLICKS&dailyMetrics=BUSINESS_DIRECTION_REQUESTS&dailyRange.startDate.year=${startDate.split("-")[0]}&dailyRange.startDate.month=${parseInt(startDate.split("-")[1])}&dailyRange.startDate.day=${parseInt(startDate.split("-")[2])}&dailyRange.endDate.year=${endDate.split("-")[0]}&dailyRange.endDate.month=${parseInt(endDate.split("-")[1])}&dailyRange.endDate.day=${parseInt(endDate.split("-")[2])}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  return response.json();
}

// ========== YOUTUBE ANALYTICS ==========
export async function getYouTubeAnalytics(
  accessToken: string,
  refreshToken: string | undefined,
  channelId: string,
  startDate: string,
  endDate: string
) {
  const auth = getAuthenticatedClient(accessToken, refreshToken);

  const youtubeAnalytics = google.youtubeAnalytics({
    version: "v2",
    auth,
  });

  const response = await youtubeAnalytics.reports.query({
    ids: `channel==${channelId}`,
    startDate,
    endDate,
    metrics: "views,estimatedMinutesWatched,subscribersGained,likes,comments",
    dimensions: "day",
    sort: "day",
  });

  return response.data;
}

export async function getYouTubeTopVideos(
  accessToken: string,
  refreshToken: string | undefined,
  channelId: string,
  startDate: string,
  endDate: string
) {
  const auth = getAuthenticatedClient(accessToken, refreshToken);

  const youtubeAnalytics = google.youtubeAnalytics({
    version: "v2",
    auth,
  });

  const response = await youtubeAnalytics.reports.query({
    ids: `channel==${channelId}`,
    startDate,
    endDate,
    metrics: "views,likes,comments,estimatedMinutesWatched",
    dimensions: "video",
    sort: "-views",
    maxResults: 10,
  });

  return response.data;
}

export async function getYouTubeTrafficSources(
  accessToken: string,
  refreshToken: string | undefined,
  channelId: string,
  startDate: string,
  endDate: string
) {
  const auth = getAuthenticatedClient(accessToken, refreshToken);

  const youtubeAnalytics = google.youtubeAnalytics({
    version: "v2",
    auth,
  });

  const response = await youtubeAnalytics.reports.query({
    ids: `channel==${channelId}`,
    startDate,
    endDate,
    metrics: "views",
    dimensions: "insightTrafficSourceType",
    sort: "-views",
  });

  return response.data;
}
