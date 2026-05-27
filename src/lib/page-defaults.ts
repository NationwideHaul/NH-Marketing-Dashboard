import type { WidgetConfig, LayoutItem } from "@/types/widget";

interface PageDefault {
  widgets: WidgetConfig[];
  layouts: { lg: LayoutItem[]; md: LayoutItem[] };
}

// Helper to generate layout positions
function row(widgets: { id: string; w: number; h: number; minW?: number; minH?: number }[], startY: number): LayoutItem[] {
  let x = 0;
  return widgets.map((w) => {
    const item: LayoutItem = { i: w.id, x, y: startY, w: w.w, h: w.h, minW: w.minW || 2, minH: w.minH || 2 };
    x += w.w;
    return item;
  });
}

// ==================== OVERVIEW ====================
export const overviewDefaults: PageDefault = {
  widgets: [
    { id: "ov-1", type: "stat", title: "Total Sessions", dataSource: "google-analytics", metric: "sessions", format: "number", comparisonEnabled: true },
    { id: "ov-2", type: "stat", title: "Ad Spend", dataSource: "google-ads", metric: "spend", format: "currency", comparisonEnabled: true },
    { id: "ov-3", type: "stat", title: "Total Leads", dataSource: "meta-ads", metric: "conversions", format: "number", comparisonEnabled: true },
    { id: "ov-4", type: "stat", title: "Phone Calls", dataSource: "callrail", metric: "totalCalls", format: "number", comparisonEnabled: true },
    { id: "ov-5", type: "line-chart", title: "Website Traffic", dataSource: "google-analytics", metric: "sessions", format: "number" },
    { id: "ov-6", type: "bar-chart", title: "Google Ads Clicks", dataSource: "google-ads", metric: "clicks", format: "number" },
    { id: "ov-7", type: "stat", title: "Email Open Rate", dataSource: "email-marketing", metric: "openRate", format: "percent", comparisonEnabled: true },
    { id: "ov-8", type: "stat", title: "YouTube Views", dataSource: "youtube", metric: "views", format: "number", comparisonEnabled: true },
    { id: "ov-9", type: "goal-tracker", title: "Monthly Ad Budget", dataSource: "google-ads", metric: "spend", format: "currency", goalValue: 10000 },
    { id: "ov-10", type: "stat", title: "IG Followers", dataSource: "instagram", metric: "followers", format: "number", comparisonEnabled: true },
  ],
  layouts: {
    lg: [
      ...row([{ id: "ov-1", w: 3, h: 2 }, { id: "ov-2", w: 3, h: 2 }, { id: "ov-3", w: 3, h: 2 }, { id: "ov-4", w: 3, h: 2 }], 0),
      ...row([{ id: "ov-5", w: 6, h: 5, minW: 3, minH: 3 }, { id: "ov-6", w: 6, h: 5, minW: 3, minH: 3 }], 2),
      ...row([{ id: "ov-7", w: 3, h: 2 }, { id: "ov-8", w: 3, h: 2 }, { id: "ov-9", w: 3, h: 2 }, { id: "ov-10", w: 3, h: 2 }], 7),
    ],
    md: [
      ...row([{ id: "ov-1", w: 2, h: 2 }, { id: "ov-2", w: 2, h: 2 }, { id: "ov-3", w: 2, h: 2 }, { id: "ov-4", w: 2, h: 2 }], 0),
      ...row([{ id: "ov-5", w: 4, h: 5, minW: 3, minH: 3 }, { id: "ov-6", w: 4, h: 5, minW: 3, minH: 3 }], 2),
      ...row([{ id: "ov-7", w: 2, h: 2 }, { id: "ov-8", w: 2, h: 2 }, { id: "ov-9", w: 2, h: 2 }, { id: "ov-10", w: 2, h: 2 }], 7),
    ],
  },
};

// ==================== GOOGLE ANALYTICS ====================
export const gaDefaults: PageDefault = {
  widgets: [
    // Row 1: Traffic stats
    { id: "ga-1", type: "stat", title: "Total Traffic", dataSource: "google-analytics", metric: "sessions", format: "number", comparisonEnabled: true },
    { id: "ga-2", type: "stat", title: "Unique Visitors", dataSource: "google-analytics", metric: "users", format: "number", comparisonEnabled: true },
    { id: "ga-3", type: "stat", title: "Page Views", dataSource: "google-analytics", metric: "pageViews", format: "number", comparisonEnabled: true },
    { id: "ga-4", type: "stat", title: "Bounce Rate", dataSource: "google-analytics", metric: "bounceRate", format: "percent", comparisonEnabled: true },
    // Row 2: Traffic over time + Users by channel
    { id: "ga-5", type: "area-chart", title: "Traffic Over Time", dataSource: "google-analytics", metric: "sessions", format: "number" },
    { id: "ga-6", type: "bar-chart", title: "Users by Channel", dataSource: "google-analytics", metric: "users", format: "number", dimension: "sessionDefaultChannelGroup" },
    // Row 3: Search/Organic/Paid
    { id: "ga-7", type: "stat", title: "Organic Traffic", dataSource: "google-analytics", metric: "sessions", format: "number", comparisonEnabled: true },
    { id: "ga-8", type: "stat", title: "Conversions", dataSource: "google-analytics", metric: "conversions", format: "number", comparisonEnabled: true },
    { id: "ga-9", type: "stat", title: "Avg. Session Duration", dataSource: "google-analytics", metric: "avgSessionDuration", format: "number", comparisonEnabled: true },
    // Row 4: Device + Engagement chart
    { id: "ga-10", type: "pie-chart", title: "Device Distribution", dataSource: "google-analytics", metric: "sessions", format: "number", dimension: "deviceCategory" },
    { id: "ga-11", type: "line-chart", title: "Engagement Over Time", dataSource: "google-analytics", metric: "pageViews", format: "number" },
  ],
  layouts: {
    lg: [
      ...row([{ id: "ga-1", w: 3, h: 2 }, { id: "ga-2", w: 3, h: 2 }, { id: "ga-3", w: 3, h: 2 }, { id: "ga-4", w: 3, h: 2 }], 0),
      ...row([{ id: "ga-5", w: 6, h: 5, minW: 3, minH: 3 }, { id: "ga-6", w: 6, h: 5, minW: 3, minH: 3 }], 2),
      ...row([{ id: "ga-7", w: 4, h: 2 }, { id: "ga-8", w: 4, h: 2 }, { id: "ga-9", w: 4, h: 2 }], 7),
      ...row([{ id: "ga-10", w: 4, h: 5, minW: 3, minH: 3 }, { id: "ga-11", w: 8, h: 5, minW: 3, minH: 3 }], 9),
    ],
    md: [
      ...row([{ id: "ga-1", w: 2, h: 2 }, { id: "ga-2", w: 2, h: 2 }, { id: "ga-3", w: 2, h: 2 }, { id: "ga-4", w: 2, h: 2 }], 0),
      ...row([{ id: "ga-5", w: 4, h: 5, minW: 3, minH: 3 }, { id: "ga-6", w: 4, h: 5, minW: 3, minH: 3 }], 2),
      ...row([{ id: "ga-7", w: 3, h: 2 }, { id: "ga-8", w: 3, h: 2 }, { id: "ga-9", w: 2, h: 2 }], 7),
      ...row([{ id: "ga-10", w: 4, h: 5, minW: 3, minH: 3 }, { id: "ga-11", w: 4, h: 5, minW: 3, minH: 3 }], 9),
    ],
  },
};

// ==================== GOOGLE ADS ====================
export const gadsDefaults: PageDefault = {
  widgets: [
    // Row 1: Key stats
    { id: "gads-1", type: "stat", title: "Total Clicks", dataSource: "google-ads", metric: "clicks", format: "number", comparisonEnabled: true },
    { id: "gads-2", type: "stat", title: "Total Conversions", dataSource: "google-ads", metric: "conversions", format: "number", comparisonEnabled: true },
    { id: "gads-3", type: "stat", title: "Average CPC", dataSource: "google-ads", metric: "cpc", format: "currency", comparisonEnabled: true },
    { id: "gads-4", type: "stat", title: "Impressions", dataSource: "google-ads", metric: "impressions", format: "number", comparisonEnabled: true },
    // Row 2: Charts
    { id: "gads-5", type: "line-chart", title: "Clicks Over Time", dataSource: "google-ads", metric: "clicks", format: "number" },
    { id: "gads-6", type: "area-chart", title: "Cost Over Time", dataSource: "google-ads", metric: "spend", format: "currency" },
    // Row 3: More stats
    { id: "gads-7", type: "stat", title: "CTR", dataSource: "google-ads", metric: "ctr", format: "percent", comparisonEnabled: true },
    { id: "gads-8", type: "stat", title: "Cost Per Conversion", dataSource: "google-ads", metric: "costPerConversion", format: "currency", comparisonEnabled: true },
    { id: "gads-9", type: "goal-tracker", title: "Monthly Budget", dataSource: "google-ads", metric: "spend", format: "currency", goalValue: 5000 },
    { id: "gads-10", type: "stat", title: "Total Spend", dataSource: "google-ads", metric: "spend", format: "currency", comparisonEnabled: true },
    // Row 4: Campaign table
    { id: "gads-11", type: "table", title: "Active Campaigns", dataSource: "google-ads", metric: "clicks", format: "number" },
  ],
  layouts: {
    lg: [
      ...row([{ id: "gads-1", w: 3, h: 2 }, { id: "gads-2", w: 3, h: 2 }, { id: "gads-3", w: 3, h: 2 }, { id: "gads-4", w: 3, h: 2 }], 0),
      ...row([{ id: "gads-5", w: 6, h: 5, minW: 3, minH: 3 }, { id: "gads-6", w: 6, h: 5, minW: 3, minH: 3 }], 2),
      ...row([{ id: "gads-7", w: 3, h: 2 }, { id: "gads-8", w: 3, h: 2 }, { id: "gads-9", w: 3, h: 2 }, { id: "gads-10", w: 3, h: 2 }], 7),
      ...row([{ id: "gads-11", w: 12, h: 6, minW: 6, minH: 4 }], 9),
    ],
    md: [
      ...row([{ id: "gads-1", w: 2, h: 2 }, { id: "gads-2", w: 2, h: 2 }, { id: "gads-3", w: 2, h: 2 }, { id: "gads-4", w: 2, h: 2 }], 0),
      ...row([{ id: "gads-5", w: 4, h: 5, minW: 3, minH: 3 }, { id: "gads-6", w: 4, h: 5, minW: 3, minH: 3 }], 2),
      ...row([{ id: "gads-7", w: 2, h: 2 }, { id: "gads-8", w: 2, h: 2 }, { id: "gads-9", w: 2, h: 2 }, { id: "gads-10", w: 2, h: 2 }], 7),
      ...row([{ id: "gads-11", w: 8, h: 6, minW: 4, minH: 4 }], 9),
    ],
  },
};

// ==================== GOOGLE MY BUSINESS ====================
export const gmbDefaults: PageDefault = {
  widgets: [
    // Row 1: Key stats
    { id: "gmb-1", type: "stat", title: "Profile Views", dataSource: "gmb", metric: "profileViews", format: "number", comparisonEnabled: true },
    { id: "gmb-2", type: "stat", title: "Search Appearances", dataSource: "gmb", metric: "searchViews", format: "number", comparisonEnabled: true },
    { id: "gmb-3", type: "stat", title: "Phone Calls", dataSource: "gmb", metric: "phoneCalls", format: "number", comparisonEnabled: true },
    { id: "gmb-4", type: "stat", title: "Direction Requests", dataSource: "gmb", metric: "directionRequests", format: "number", comparisonEnabled: true },
    // Row 2: Charts
    { id: "gmb-5", type: "area-chart", title: "Profile Interactions Over Time", dataSource: "gmb", metric: "profileViews", format: "number" },
    { id: "gmb-6", type: "pie-chart", title: "Platform & Device Breakdown", dataSource: "gmb", metric: "profileViews", format: "number" },
    // Row 3: More stats
    { id: "gmb-7", type: "stat", title: "Website Clicks", dataSource: "gmb", metric: "websiteClicks", format: "number", comparisonEnabled: true },
    { id: "gmb-8", type: "stat", title: "Map Views", dataSource: "gmb", metric: "mapViews", format: "number", comparisonEnabled: true },
    // Row 4: Charts
    { id: "gmb-9", type: "area-chart", title: "Calls Over Time", dataSource: "gmb", metric: "phoneCalls", format: "number" },
    { id: "gmb-10", type: "area-chart", title: "Direction Requests Over Time", dataSource: "gmb", metric: "directionRequests", format: "number" },
    { id: "gmb-11", type: "area-chart", title: "Website Clicks Over Time", dataSource: "gmb", metric: "websiteClicks", format: "number" },
  ],
  layouts: {
    lg: [
      ...row([{ id: "gmb-1", w: 3, h: 2 }, { id: "gmb-2", w: 3, h: 2 }, { id: "gmb-3", w: 3, h: 2 }, { id: "gmb-4", w: 3, h: 2 }], 0),
      ...row([{ id: "gmb-5", w: 8, h: 5, minW: 4, minH: 3 }, { id: "gmb-6", w: 4, h: 5, minW: 3, minH: 3 }], 2),
      ...row([{ id: "gmb-7", w: 6, h: 2 }, { id: "gmb-8", w: 6, h: 2 }], 7),
      ...row([{ id: "gmb-9", w: 4, h: 5, minW: 3, minH: 3 }, { id: "gmb-10", w: 4, h: 5, minW: 3, minH: 3 }, { id: "gmb-11", w: 4, h: 5, minW: 3, minH: 3 }], 9),
    ],
    md: [
      ...row([{ id: "gmb-1", w: 2, h: 2 }, { id: "gmb-2", w: 2, h: 2 }, { id: "gmb-3", w: 2, h: 2 }, { id: "gmb-4", w: 2, h: 2 }], 0),
      ...row([{ id: "gmb-5", w: 5, h: 5, minW: 3, minH: 3 }, { id: "gmb-6", w: 3, h: 5, minW: 3, minH: 3 }], 2),
      ...row([{ id: "gmb-7", w: 4, h: 2 }, { id: "gmb-8", w: 4, h: 2 }], 7),
      ...row([{ id: "gmb-9", w: 4, h: 5, minW: 3, minH: 3 }, { id: "gmb-10", w: 4, h: 5, minW: 3, minH: 3 }], 9),
      ...row([{ id: "gmb-11", w: 4, h: 5, minW: 3, minH: 3 }], 14),
    ],
  },
};

// ==================== CALL LOGS ====================
export const callLogsDefaults: PageDefault = {
  widgets: [
    { id: "cl-1", type: "stat", title: "Total Calls", dataSource: "callrail", metric: "totalCalls", format: "number", comparisonEnabled: true },
    { id: "cl-2", type: "stat", title: "Answered Calls", dataSource: "callrail", metric: "answered", format: "number", comparisonEnabled: true },
    { id: "cl-3", type: "stat", title: "Missed Calls", dataSource: "callrail", metric: "missed", format: "number", comparisonEnabled: true },
    { id: "cl-4", type: "stat", title: "Answer Rate", dataSource: "callrail", metric: "answerRate", format: "percent", comparisonEnabled: true },
    { id: "cl-5", type: "bar-chart", title: "Calls Over Time", dataSource: "callrail", metric: "totalCalls", format: "number" },
    { id: "cl-6", type: "pie-chart", title: "Calls by Source", dataSource: "callrail", metric: "totalCalls", format: "number" },
    { id: "cl-7", type: "stat", title: "First-Time Callers", dataSource: "callrail", metric: "firstTimeCalls", format: "number", comparisonEnabled: true },
    { id: "cl-8", type: "stat", title: "Avg. Duration", dataSource: "callrail", metric: "avgDuration", format: "number", comparisonEnabled: true },
    { id: "cl-9", type: "table", title: "Recent Calls", dataSource: "callrail", metric: "totalCalls", format: "number" },
  ],
  layouts: {
    lg: [
      ...row([{ id: "cl-1", w: 3, h: 2 }, { id: "cl-2", w: 3, h: 2 }, { id: "cl-3", w: 3, h: 2 }, { id: "cl-4", w: 3, h: 2 }], 0),
      ...row([{ id: "cl-5", w: 7, h: 5, minW: 3, minH: 3 }, { id: "cl-6", w: 5, h: 5, minW: 3, minH: 3 }], 2),
      ...row([{ id: "cl-7", w: 3, h: 2 }, { id: "cl-8", w: 3, h: 2 }], 7),
      ...row([{ id: "cl-9", w: 12, h: 6, minW: 6, minH: 4 }], 9),
    ],
    md: [
      ...row([{ id: "cl-1", w: 2, h: 2 }, { id: "cl-2", w: 2, h: 2 }, { id: "cl-3", w: 2, h: 2 }, { id: "cl-4", w: 2, h: 2 }], 0),
      ...row([{ id: "cl-5", w: 4, h: 5, minW: 3, minH: 3 }, { id: "cl-6", w: 4, h: 5, minW: 3, minH: 3 }], 2),
      ...row([{ id: "cl-7", w: 4, h: 2 }, { id: "cl-8", w: 4, h: 2 }], 7),
      ...row([{ id: "cl-9", w: 8, h: 6, minW: 4, minH: 4 }], 9),
    ],
  },
};

// ==================== EMAIL MARKETING ====================
// All email stats are now manually tracked via EmailStatsHeader (no GHL API widgets)
export const emailDefaults: PageDefault = {
  widgets: [],
  layouts: { lg: [], md: [] },
};

// ==================== META ADS ====================
export const metaAdsDefaults: PageDefault = {
  widgets: [
    { id: "ma-1", type: "stat", title: "Amount Spent", dataSource: "meta-ads", metric: "spend", format: "currency", comparisonEnabled: true },
    { id: "ma-2", type: "stat", title: "Impressions", dataSource: "meta-ads", metric: "impressions", format: "number", comparisonEnabled: true },
    { id: "ma-3", type: "stat", title: "Reach", dataSource: "meta-ads", metric: "reach", format: "number", comparisonEnabled: true },
    { id: "ma-4", type: "stat", title: "Clicks", dataSource: "meta-ads", metric: "clicks", format: "number", comparisonEnabled: true },
    { id: "ma-5", type: "stat", title: "CTR", dataSource: "meta-ads", metric: "ctr", format: "percent", comparisonEnabled: true },
    { id: "ma-6", type: "stat", title: "CPC", dataSource: "meta-ads", metric: "cpc", format: "currency", comparisonEnabled: true },
    { id: "ma-7", type: "stat", title: "Leads", dataSource: "meta-ads", metric: "conversions", format: "number", comparisonEnabled: true },
    { id: "ma-8", type: "stat", title: "Cost Per Lead", dataSource: "meta-ads", metric: "costPerLead", format: "currency", comparisonEnabled: true },
    { id: "ma-9", type: "area-chart", title: "Spend Over Time", dataSource: "meta-ads", metric: "spend", format: "currency" },
    { id: "ma-10", type: "line-chart", title: "Reach Over Time", dataSource: "meta-ads", metric: "reach", format: "number" },
    { id: "ma-ads", type: "active-ads", title: "Active Ads", dataSource: "meta-ads", metric: "spend", format: "currency" },
  ],
  layouts: {
    lg: [
      ...row([{ id: "ma-1", w: 3, h: 2 }, { id: "ma-2", w: 3, h: 2 }, { id: "ma-3", w: 3, h: 2 }, { id: "ma-4", w: 3, h: 2 }], 0),
      ...row([{ id: "ma-5", w: 3, h: 2 }, { id: "ma-6", w: 3, h: 2 }, { id: "ma-7", w: 3, h: 2 }, { id: "ma-8", w: 3, h: 2 }], 2),
      ...row([{ id: "ma-9", w: 6, h: 5, minW: 3, minH: 3 }, { id: "ma-10", w: 6, h: 5, minW: 3, minH: 3 }], 4),
      ...row([{ id: "ma-ads", w: 12, h: 8, minW: 6, minH: 5 }], 9),
    ],
    md: [
      ...row([{ id: "ma-1", w: 2, h: 2 }, { id: "ma-2", w: 2, h: 2 }, { id: "ma-3", w: 2, h: 2 }, { id: "ma-4", w: 2, h: 2 }], 0),
      ...row([{ id: "ma-5", w: 2, h: 2 }, { id: "ma-6", w: 2, h: 2 }, { id: "ma-7", w: 2, h: 2 }, { id: "ma-8", w: 2, h: 2 }], 2),
      ...row([{ id: "ma-9", w: 4, h: 5, minW: 3, minH: 3 }, { id: "ma-10", w: 4, h: 5, minW: 3, minH: 3 }], 4),
      ...row([{ id: "ma-ads", w: 8, h: 8, minW: 4, minH: 5 }], 9),
    ],
  },
};

// ==================== SOCIAL MEDIA SUB-TABS ====================
export const facebookDefaults: PageDefault = {
  widgets: [
    { id: "fb-1", type: "stat", title: "Views", dataSource: "facebook", metric: "pageViews", format: "number", comparisonEnabled: true },
    { id: "fb-2", type: "stat", title: "Interactions", dataSource: "facebook", metric: "postEngagement", format: "number", comparisonEnabled: true },
    { id: "fb-3", type: "stat", title: "Follows", dataSource: "facebook", metric: "followers", format: "number", comparisonEnabled: true },
    { id: "fb-4", type: "stat", title: "Reach", dataSource: "facebook", metric: "reach", format: "number", comparisonEnabled: true },
    { id: "fb-tc", type: "top-content", title: "Top 3 Content This Period", dataSource: "facebook", metric: "postEngagement", format: "number" },
    { id: "fb-rc", type: "recent-content", title: "Recent Content", dataSource: "facebook", metric: "postEngagement", format: "number" },
    { id: "fb-5", type: "area-chart", title: "Reach Over Time", dataSource: "facebook", metric: "reach", format: "number" },
    { id: "fb-6", type: "bar-chart", title: "Engagement Over Time", dataSource: "facebook", metric: "postEngagement", format: "number" },
  ],
  layouts: {
    lg: [
      ...row([{ id: "fb-1", w: 3, h: 2 }, { id: "fb-2", w: 3, h: 2 }, { id: "fb-3", w: 3, h: 2 }, { id: "fb-4", w: 3, h: 2 }], 0),
      ...row([{ id: "fb-tc", w: 6, h: 6, minW: 4, minH: 4 }, { id: "fb-rc", w: 6, h: 6, minW: 4, minH: 4 }], 2),
      ...row([{ id: "fb-5", w: 6, h: 5, minW: 3, minH: 3 }, { id: "fb-6", w: 6, h: 5, minW: 3, minH: 3 }], 8),
    ],
    md: [
      ...row([{ id: "fb-1", w: 2, h: 2 }, { id: "fb-2", w: 2, h: 2 }, { id: "fb-3", w: 2, h: 2 }, { id: "fb-4", w: 2, h: 2 }], 0),
      ...row([{ id: "fb-tc", w: 4, h: 6, minW: 4, minH: 4 }, { id: "fb-rc", w: 4, h: 6, minW: 4, minH: 4 }], 2),
      ...row([{ id: "fb-5", w: 4, h: 5, minW: 3, minH: 3 }, { id: "fb-6", w: 4, h: 5, minW: 3, minH: 3 }], 8),
    ],
  },
};

export const instagramDefaults: PageDefault = {
  widgets: [
    { id: "ig-1", type: "stat", title: "Followers", dataSource: "instagram", metric: "followers", format: "number", comparisonEnabled: true },
    { id: "ig-2", type: "stat", title: "Reach", dataSource: "instagram", metric: "reach", format: "number", comparisonEnabled: true },
    { id: "ig-3", type: "stat", title: "Likes", dataSource: "instagram", metric: "likes", format: "number", comparisonEnabled: true },
    { id: "ig-4", type: "stat", title: "Saves", dataSource: "instagram", metric: "saves", format: "number", comparisonEnabled: true },
    { id: "ig-tc", type: "top-content", title: "Top 3 Content This Period", dataSource: "instagram", metric: "likes", format: "number" },
    { id: "ig-rc", type: "recent-content", title: "Recent Content", dataSource: "instagram", metric: "likes", format: "number" },
    { id: "ig-5", type: "area-chart", title: "Reach Over Time", dataSource: "instagram", metric: "reach", format: "number" },
    { id: "ig-6", type: "bar-chart", title: "Engagement Over Time", dataSource: "instagram", metric: "likes", format: "number" },
  ],
  layouts: {
    lg: [
      ...row([{ id: "ig-1", w: 3, h: 2 }, { id: "ig-2", w: 3, h: 2 }, { id: "ig-3", w: 3, h: 2 }, { id: "ig-4", w: 3, h: 2 }], 0),
      ...row([{ id: "ig-tc", w: 6, h: 6, minW: 4, minH: 4 }, { id: "ig-rc", w: 6, h: 6, minW: 4, minH: 4 }], 2),
      ...row([{ id: "ig-5", w: 6, h: 5, minW: 3, minH: 3 }, { id: "ig-6", w: 6, h: 5, minW: 3, minH: 3 }], 8),
    ],
    md: [
      ...row([{ id: "ig-1", w: 2, h: 2 }, { id: "ig-2", w: 2, h: 2 }, { id: "ig-3", w: 2, h: 2 }, { id: "ig-4", w: 2, h: 2 }], 0),
      ...row([{ id: "ig-tc", w: 4, h: 6, minW: 4, minH: 4 }, { id: "ig-rc", w: 4, h: 6, minW: 4, minH: 4 }], 2),
      ...row([{ id: "ig-5", w: 4, h: 5, minW: 3, minH: 3 }, { id: "ig-6", w: 4, h: 5, minW: 3, minH: 3 }], 8),
    ],
  },
};

export const youtubeDefaults: PageDefault = {
  widgets: [
    { id: "yt-1", type: "stat", title: "Views", dataSource: "youtube", metric: "views", format: "number", comparisonEnabled: true },
    { id: "yt-2", type: "stat", title: "Watch Time (hrs)", dataSource: "youtube", metric: "watchTime", format: "number", comparisonEnabled: true },
    { id: "yt-3", type: "stat", title: "Subscribers", dataSource: "youtube", metric: "subscribers", format: "number", comparisonEnabled: true },
    { id: "yt-4", type: "stat", title: "Likes", dataSource: "youtube", metric: "likes", format: "number", comparisonEnabled: true },
    { id: "yt-tc", type: "top-content", title: "Your Top Content", dataSource: "youtube", metric: "views", format: "number" },
    { id: "yt-rc", type: "recent-content", title: "Latest Content", dataSource: "youtube", metric: "views", format: "number" },
    { id: "yt-5", type: "area-chart", title: "Views Over Time", dataSource: "youtube", metric: "views", format: "number" },
    { id: "yt-6", type: "bar-chart", title: "Likes Over Time", dataSource: "youtube", metric: "likes", format: "number" },
  ],
  layouts: {
    lg: [
      ...row([{ id: "yt-1", w: 3, h: 2 }, { id: "yt-2", w: 3, h: 2 }, { id: "yt-3", w: 3, h: 2 }, { id: "yt-4", w: 3, h: 2 }], 0),
      ...row([{ id: "yt-tc", w: 6, h: 6, minW: 4, minH: 4 }, { id: "yt-rc", w: 6, h: 6, minW: 4, minH: 4 }], 2),
      ...row([{ id: "yt-5", w: 6, h: 5, minW: 3, minH: 3 }, { id: "yt-6", w: 6, h: 5, minW: 3, minH: 3 }], 8),
    ],
    md: [
      ...row([{ id: "yt-1", w: 2, h: 2 }, { id: "yt-2", w: 2, h: 2 }, { id: "yt-3", w: 2, h: 2 }, { id: "yt-4", w: 2, h: 2 }], 0),
      ...row([{ id: "yt-tc", w: 4, h: 6, minW: 4, minH: 4 }, { id: "yt-rc", w: 4, h: 6, minW: 4, minH: 4 }], 2),
      ...row([{ id: "yt-5", w: 4, h: 5, minW: 3, minH: 3 }, { id: "yt-6", w: 4, h: 5, minW: 3, minH: 3 }], 8),
    ],
  },
};

export const linkedinDefaults: PageDefault = {
  widgets: [
    { id: "li-1", type: "stat", title: "Impressions", dataSource: "linkedin", metric: "impressions", format: "number", comparisonEnabled: true },
    { id: "li-2", type: "stat", title: "Clicks", dataSource: "linkedin", metric: "clicks", format: "number", comparisonEnabled: true },
    { id: "li-3", type: "stat", title: "Followers", dataSource: "linkedin", metric: "followers", format: "number", comparisonEnabled: true },
    { id: "li-4", type: "stat", title: "CTR", dataSource: "linkedin", metric: "ctr", format: "percent", comparisonEnabled: true },
    { id: "li-5", type: "area-chart", title: "Impressions Over Time", dataSource: "linkedin", metric: "impressions", format: "number" },
  ],
  layouts: {
    lg: [
      ...row([{ id: "li-1", w: 3, h: 2 }, { id: "li-2", w: 3, h: 2 }, { id: "li-3", w: 3, h: 2 }, { id: "li-4", w: 3, h: 2 }], 0),
      ...row([{ id: "li-5", w: 12, h: 5, minW: 6, minH: 3 }], 2),
    ],
    md: [
      ...row([{ id: "li-1", w: 2, h: 2 }, { id: "li-2", w: 2, h: 2 }, { id: "li-3", w: 2, h: 2 }, { id: "li-4", w: 2, h: 2 }], 0),
      ...row([{ id: "li-5", w: 8, h: 5, minW: 4, minH: 3 }], 2),
    ],
  },
};

// ==================== NFI OVERVIEW ====================
export const nfiOverviewDefaults: PageDefault = {
  widgets: [
    // Row 1: Website & Email stats
    // Email metrics mirror what the user enters on the Email Marketing tab
    // (localStorage "nh-email-logs-<accountId>"), summed across the selected
    // date range's months. Values update live when the user edits the tab.
    { id: "nfi-1", type: "stat", title: "Website Total Visitors", dataSource: "google-analytics", metric: "sessions", format: "number", comparisonEnabled: true },
    { id: "nfi-2", type: "stat", title: "Email Campaign Opens", dataSource: "email-logs", metric: "opened", format: "number", comparisonEnabled: true },
    { id: "nfi-3", type: "stat", title: "Email Campaign Clicks", dataSource: "email-logs", metric: "clicked", format: "number", comparisonEnabled: true },
    { id: "nfi-3b", type: "stat", title: "Email Campaign Replied", dataSource: "email-logs", metric: "replied", format: "number", comparisonEnabled: true },
    // Row 2: PPC stats
    { id: "nfi-4", type: "stat", title: "Paid Search Traffic (PPC)", dataSource: "google-analytics", metric: "sessions", format: "number", comparisonEnabled: true, dimension: "sessionDefaultChannelGroup", dimensionValue: "Paid Search" },
    { id: "nfi-5", type: "stat", title: "PPC Total Clicks", dataSource: "google-ads", metric: "clicks", format: "number", comparisonEnabled: true },
    { id: "nfi-6", type: "stat", title: "PPC Cost Per Click", dataSource: "google-ads", metric: "cpc", format: "currency", comparisonEnabled: true },
    { id: "nfi-7", type: "stat", title: "PPC Identified Conversions", dataSource: "google-ads", metric: "conversions", format: "number", comparisonEnabled: true },
    // Row 3: Calls & Truck Paper
    { id: "nfi-8", type: "stat", title: "Total Phone Calls (CallRail)", dataSource: "callrail", metric: "totalCalls", format: "number", comparisonEnabled: true },
    { id: "nfi-9", type: "stat", title: "Truck Paper Phone Calls", dataSource: "callrail", metric: "totalCalls", format: "number", comparisonEnabled: true, tracker: "Truck Paper" },
    // Info submits + banner clicks are manually tracked until the NFI-tagged
    // CRM pipeline is wired up. Hover the card and click the pencil to edit.
    { id: "nfi-10", type: "manual-stat", title: "Truck Paper Info Submits", dataSource: "overview", metric: "truckPaperInfoSubmits", format: "number", manualValue: 0 },
    { id: "nfi-12", type: "manual-stat", title: "Banner Ad Clicks (Truck Paper)", dataSource: "overview", metric: "bannerClicks", format: "number", manualValue: 0 },
    // Section: Trends Over Time
    { id: "nfi-sec", type: "section-header", title: "Trends Over Time", dataSource: "overview", metric: "none", format: "number", sectionTitle: "Trends Over Time" },
    // Charts — 5 months of data for monthly comparison
    { id: "nfi-13", type: "line-chart", title: "Website Traffic", dataSource: "google-analytics", metric: "sessions", format: "number", trendMonths: 5 },
    { id: "nfi-14", type: "bar-chart", title: "PPC Clicks", dataSource: "google-ads", metric: "clicks", format: "number", trendMonths: 5 },
    { id: "nfi-15", type: "line-chart", title: "PPC Conversions", dataSource: "google-ads", metric: "conversions", format: "number", trendMonths: 5 },
    { id: "nfi-16", type: "line-chart", title: "PPC Cost Per Click", dataSource: "google-ads", metric: "cpc", format: "currency", trendMonths: 5 },
    { id: "nfi-17", type: "area-chart", title: "Total Phone Calls", dataSource: "callrail", metric: "totalCalls", format: "number", trendMonths: 5 },
    { id: "nfi-18", type: "bar-chart", title: "Email Opens", dataSource: "email-marketing", metric: "emailsSent", format: "number", trendMonths: 5 },
  ],
  layouts: {
    lg: [
      // Row 1: 4 stat cards (website + email)
      ...row([{ id: "nfi-1", w: 3, h: 2 }, { id: "nfi-2", w: 3, h: 2 }, { id: "nfi-3", w: 3, h: 2 }, { id: "nfi-3b", w: 3, h: 2 }], 0),
      // Row 2: 4 stat cards (PPC)
      ...row([{ id: "nfi-4", w: 3, h: 2 }, { id: "nfi-5", w: 3, h: 2 }, { id: "nfi-6", w: 3, h: 2 }, { id: "nfi-7", w: 3, h: 2 }], 2),
      // Row 3: 4 stat cards (calls + truck paper)
      ...row([{ id: "nfi-8", w: 3, h: 2 }, { id: "nfi-9", w: 3, h: 2 }, { id: "nfi-10", w: 3, h: 2 }, { id: "nfi-12", w: 3, h: 2 }], 4),
      // Section header
      ...row([{ id: "nfi-sec", w: 12, h: 1 }], 6),
      // Row 4: 3 charts
      ...row([{ id: "nfi-13", w: 4, h: 5, minW: 3, minH: 3 }, { id: "nfi-14", w: 4, h: 5, minW: 3, minH: 3 }, { id: "nfi-15", w: 4, h: 5, minW: 3, minH: 3 }], 7),
      // Row 5: 3 more charts
      ...row([{ id: "nfi-16", w: 4, h: 5, minW: 3, minH: 3 }, { id: "nfi-17", w: 4, h: 5, minW: 3, minH: 3 }, { id: "nfi-18", w: 4, h: 5, minW: 3, minH: 3 }], 12),
    ],
    md: [
      ...row([{ id: "nfi-1", w: 2, h: 2 }, { id: "nfi-2", w: 2, h: 2 }, { id: "nfi-3", w: 2, h: 2 }, { id: "nfi-3b", w: 2, h: 2 }], 0),
      ...row([{ id: "nfi-4", w: 2, h: 2 }, { id: "nfi-5", w: 2, h: 2 }, { id: "nfi-6", w: 2, h: 2 }, { id: "nfi-7", w: 2, h: 2 }], 2),
      ...row([{ id: "nfi-8", w: 2, h: 2 }, { id: "nfi-9", w: 2, h: 2 }, { id: "nfi-10", w: 2, h: 2 }, { id: "nfi-12", w: 2, h: 2 }], 4),
      ...row([{ id: "nfi-sec", w: 8, h: 1 }], 6),
      ...row([{ id: "nfi-13", w: 4, h: 5, minW: 3, minH: 3 }, { id: "nfi-14", w: 4, h: 5, minW: 3, minH: 3 }], 7),
      ...row([{ id: "nfi-15", w: 4, h: 5, minW: 3, minH: 3 }, { id: "nfi-16", w: 4, h: 5, minW: 3, minH: 3 }], 12),
      ...row([{ id: "nfi-17", w: 4, h: 5, minW: 3, minH: 3 }, { id: "nfi-18", w: 4, h: 5, minW: 3, minH: 3 }], 17),
    ],
  },
};

// ==================== NH OVERVIEW (Dealership) ====================
export const nhOverviewDefaults: PageDefault = {
  widgets: [
    // Row 1: Interactive stats (click to see 12-month chart)
    { id: "nh-1", type: "interactive-stat", title: "Total Phone Calls", dataSource: "callrail", metric: "totalCalls", format: "number", comparisonEnabled: true },
    { id: "nh-2", type: "interactive-stat", title: "Total Info Submits", dataSource: "google-analytics", metric: "conversions", format: "number", comparisonEnabled: true },
    { id: "nh-3", type: "interactive-stat", title: "Total Website Visitors", dataSource: "google-analytics", metric: "sessions", format: "number", comparisonEnabled: true },
    { id: "nh-4", type: "interactive-stat", title: "Overall Social Media Interactions", dataSource: "overview", metric: "socialEngagement", format: "number", comparisonEnabled: true },
    // Row 2: Source graphics
    { id: "nh-5", type: "pie-chart", title: "Sessions by Traffic Source", dataSource: "google-analytics", metric: "sessions", format: "number", dimension: "sessionDefaultChannelGroup" },
    { id: "nh-6", type: "bar-chart", title: "Conversion Rate Per Source", dataSource: "google-analytics", metric: "conversions", format: "number", dimension: "sessionDefaultChannelGroup" },
    // Section: Trends Over Time
    { id: "nh-sec", type: "section-header", title: "Trends Over Time", dataSource: "overview", metric: "none", format: "number", sectionTitle: "Trends Over Time" },
    // Trend charts (5 months)
    { id: "nh-c1", type: "line-chart", title: "Website Traffic", dataSource: "google-analytics", metric: "sessions", format: "number", trendMonths: 5 },
    { id: "nh-c2", type: "area-chart", title: "Phone Calls", dataSource: "callrail", metric: "totalCalls", format: "number", trendMonths: 5 },
    { id: "nh-c3", type: "line-chart", title: "Info Submits", dataSource: "overview", metric: "infoSubmits", format: "number", trendMonths: 5 },
    { id: "nh-c4", type: "bar-chart", title: "PPC Clicks", dataSource: "google-ads", metric: "clicks", format: "number", trendMonths: 5 },
    { id: "nh-c5", type: "bar-chart", title: "Social Media Engagement", dataSource: "overview", metric: "socialEngagement", format: "number", trendMonths: 5 },
    { id: "nh-c6", type: "line-chart", title: "Conversion Rate Trend", dataSource: "overview", metric: "conversionRate", format: "percent", trendMonths: 5 },
  ],
  layouts: {
    lg: [
      // Row 1: 4 interactive stat cards
      ...row([{ id: "nh-1", w: 3, h: 2 }, { id: "nh-2", w: 3, h: 2 }, { id: "nh-3", w: 3, h: 2 }, { id: "nh-4", w: 3, h: 2 }], 0),
      // Row 2: Source graphics
      ...row([{ id: "nh-5", w: 6, h: 5, minW: 3, minH: 3 }, { id: "nh-6", w: 6, h: 5, minW: 3, minH: 3 }], 2),
      // Section header
      ...row([{ id: "nh-sec", w: 12, h: 1 }], 7),
      // Trend charts row 1
      ...row([{ id: "nh-c1", w: 4, h: 5, minW: 3, minH: 3 }, { id: "nh-c2", w: 4, h: 5, minW: 3, minH: 3 }, { id: "nh-c3", w: 4, h: 5, minW: 3, minH: 3 }], 8),
      // Trend charts row 2
      ...row([{ id: "nh-c4", w: 4, h: 5, minW: 3, minH: 3 }, { id: "nh-c5", w: 4, h: 5, minW: 3, minH: 3 }, { id: "nh-c6", w: 4, h: 5, minW: 3, minH: 3 }], 13),
    ],
    md: [
      ...row([{ id: "nh-1", w: 2, h: 2 }, { id: "nh-2", w: 2, h: 2 }, { id: "nh-3", w: 2, h: 2 }, { id: "nh-4", w: 2, h: 2 }], 0),
      ...row([{ id: "nh-5", w: 4, h: 5, minW: 3, minH: 3 }, { id: "nh-6", w: 4, h: 5, minW: 3, minH: 3 }], 2),
      ...row([{ id: "nh-sec", w: 8, h: 1 }], 7),
      ...row([{ id: "nh-c1", w: 4, h: 5, minW: 3, minH: 3 }, { id: "nh-c2", w: 4, h: 5, minW: 3, minH: 3 }], 8),
      ...row([{ id: "nh-c3", w: 4, h: 5, minW: 3, minH: 3 }, { id: "nh-c4", w: 4, h: 5, minW: 3, minH: 3 }], 13),
      ...row([{ id: "nh-c5", w: 4, h: 5, minW: 3, minH: 3 }, { id: "nh-c6", w: 4, h: 5, minW: 3, minH: 3 }], 18),
    ],
  },
};

// ==================== ROAD READY OVERVIEW ====================
export const rriOverviewDefaults: PageDefault = {
  widgets: [
    // Row 1: Key stats (no Ad Spend)
    { id: "rri-1", type: "interactive-stat", title: "Total Sessions", dataSource: "google-analytics", metric: "sessions", format: "number", comparisonEnabled: true },
    { id: "rri-2", type: "interactive-stat", title: "Total Leads", dataSource: "meta-ads", metric: "conversions", format: "number", comparisonEnabled: true },
    { id: "rri-3", type: "interactive-stat", title: "Phone Calls", dataSource: "callrail", metric: "totalCalls", format: "number", comparisonEnabled: true },
    { id: "rri-4", type: "interactive-stat", title: "Email Open Rate", dataSource: "email-marketing", metric: "openRate", format: "percent", comparisonEnabled: true },
    // Row 2: Charts (no Google Ads Clicks)
    { id: "rri-5", type: "area-chart", title: "Website Traffic", dataSource: "google-analytics", metric: "sessions", format: "number" },
    { id: "rri-6", type: "line-chart", title: "Leads Over Time", dataSource: "meta-ads", metric: "conversions", format: "number" },
    // Row 3: More stats (no Monthly Ad Budget)
    { id: "rri-7", type: "stat", title: "IG Followers", dataSource: "instagram", metric: "followers", format: "number", comparisonEnabled: true },
    { id: "rri-8", type: "stat", title: "FB Reach", dataSource: "facebook", metric: "reach", format: "number", comparisonEnabled: true },
    { id: "rri-9", type: "stat", title: "New Contacts", dataSource: "email-marketing", metric: "newContacts", format: "number", comparisonEnabled: true },
    { id: "rri-10", type: "stat", title: "GMB Profile Views", dataSource: "gmb", metric: "profileViews", format: "number", comparisonEnabled: true },
    // Section: Trends
    { id: "rri-sec", type: "section-header", title: "Trends Over Time", dataSource: "overview", metric: "none", format: "number", sectionTitle: "Trends Over Time" },
    { id: "rri-c1", type: "line-chart", title: "Phone Calls Trend", dataSource: "callrail", metric: "totalCalls", format: "number", trendMonths: 5 },
    { id: "rri-c2", type: "bar-chart", title: "Social Media Engagement", dataSource: "overview", metric: "socialEngagement", format: "number", trendMonths: 5 },
    { id: "rri-c3", type: "area-chart", title: "Email Campaign Performance", dataSource: "email-marketing", metric: "emailsSent", format: "number", trendMonths: 5 },
  ],
  layouts: {
    lg: [
      ...row([{ id: "rri-1", w: 3, h: 2 }, { id: "rri-2", w: 3, h: 2 }, { id: "rri-3", w: 3, h: 2 }, { id: "rri-4", w: 3, h: 2 }], 0),
      ...row([{ id: "rri-5", w: 6, h: 5, minW: 3, minH: 3 }, { id: "rri-6", w: 6, h: 5, minW: 3, minH: 3 }], 2),
      ...row([{ id: "rri-7", w: 3, h: 2 }, { id: "rri-8", w: 3, h: 2 }, { id: "rri-9", w: 3, h: 2 }, { id: "rri-10", w: 3, h: 2 }], 7),
      ...row([{ id: "rri-sec", w: 12, h: 1 }], 9),
      ...row([{ id: "rri-c1", w: 4, h: 5, minW: 3, minH: 3 }, { id: "rri-c2", w: 4, h: 5, minW: 3, minH: 3 }, { id: "rri-c3", w: 4, h: 5, minW: 3, minH: 3 }], 10),
    ],
    md: [
      ...row([{ id: "rri-1", w: 2, h: 2 }, { id: "rri-2", w: 2, h: 2 }, { id: "rri-3", w: 2, h: 2 }, { id: "rri-4", w: 2, h: 2 }], 0),
      ...row([{ id: "rri-5", w: 4, h: 5, minW: 3, minH: 3 }, { id: "rri-6", w: 4, h: 5, minW: 3, minH: 3 }], 2),
      ...row([{ id: "rri-7", w: 2, h: 2 }, { id: "rri-8", w: 2, h: 2 }, { id: "rri-9", w: 2, h: 2 }, { id: "rri-10", w: 2, h: 2 }], 7),
      ...row([{ id: "rri-sec", w: 8, h: 1 }], 9),
      ...row([{ id: "rri-c1", w: 4, h: 5, minW: 3, minH: 3 }, { id: "rri-c2", w: 4, h: 5, minW: 3, minH: 3 }], 10),
      ...row([{ id: "rri-c3", w: 4, h: 5, minW: 3, minH: 3 }], 15),
    ],
  },
};

// Map page path to defaults
export const pageDefaults: Record<string, PageDefault> = {
  "/": overviewDefaults,
  "/google-analytics": gaDefaults,
  "/google-ads": gadsDefaults,
  "/gmb": gmbDefaults,
  "/call-logs": callLogsDefaults,
  "/go-high-level": emailDefaults,
  "/meta-ads": metaAdsDefaults,
  "/social-media": facebookDefaults,
  "/social-media/instagram": instagramDefaults,
  "/social-media/youtube": youtubeDefaults,
  "/social-media/linkedin": linkedinDefaults,
};
