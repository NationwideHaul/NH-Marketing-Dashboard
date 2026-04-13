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

// Per-refresh-token cache of access tokens so each Google account used
// (GA/Ads main account, separate YouTube owner, etc.) gets its own cached token.
const tokenCache = new Map<string, { accessToken: string; expiry: number }>();

async function refreshAccessToken(refreshToken: string) {
  const cached = tokenCache.get(refreshToken);
  const now = Date.now() / 1000;
  if (cached && cached.expiry > now + 60) return cached.accessToken;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: (process.env.GOOGLE_CLIENT_ID || "").trim(),
      client_secret: (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Token refresh failed: ${data.error_description || data.error}`);
  }

  tokenCache.set(refreshToken, {
    accessToken: data.access_token,
    expiry: now + (data.expires_in || 3600),
  });
  return data.access_token as string;
}

// Default Google client — used for GA, Google Ads, GMB, etc. (main account)
export async function getStoredGoogleClient() {
  const refreshToken = (process.env.GOOGLE_REFRESH_TOKEN || "").trim();
  if (!refreshToken) {
    throw new Error("GOOGLE_REFRESH_TOKEN not set. Connect Google once to get it.");
  }
  const accessToken = await refreshAccessToken(refreshToken);
  const client = getOAuth2Client();
  client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
  return { client, accessToken };
}

// YouTube-specific client — uses YOUTUBE_REFRESH_TOKEN if set (owned by the
// channel-owner Google account), otherwise falls back to the main token.
export async function getStoredYouTubeClient() {
  const refreshToken =
    (process.env.YOUTUBE_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN || "").trim();
  if (!refreshToken) {
    throw new Error("No refresh token configured for YouTube.");
  }
  const accessToken = await refreshAccessToken(refreshToken);
  const client = getOAuth2Client();
  client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
  return { client, accessToken };
}

// Set credentials from session token (legacy - kept for backwards compatibility)
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
  const url = `https://googleads.googleapis.com/v23/customers/${customerId}/googleAds:searchStream`;

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
