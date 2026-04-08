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
    { id: "ga-1", type: "stat", title: "Monthly Visits", dataSource: "google-analytics", metric: "sessions", format: "number", comparisonEnabled: true },
    { id: "ga-2", type: "stat", title: "Unique Visitors", dataSource: "google-analytics", metric: "users", format: "number", comparisonEnabled: true },
    { id: "ga-3", type: "stat", title: "Page Views", dataSource: "google-analytics", metric: "pageViews", format: "number", comparisonEnabled: true },
    { id: "ga-4", type: "stat", title: "Bounce Rate", dataSource: "google-analytics", metric: "bounceRate", format: "percent", comparisonEnabled: true },
    // Row 2: Traffic over time + Users by channel
    { id: "ga-5", type: "area-chart", title: "Traffic Over Time", dataSource: "google-analytics", metric: "sessions", format: "number" },
    { id: "ga-6", type: "bar-chart", title: "Users by Channel", dataSource: "google-analytics", metric: "users", format: "number" },
    // Row 3: Search/Organic/Paid
    { id: "ga-7", type: "stat", title: "Organic Traffic", dataSource: "google-analytics", metric: "sessions", format: "number", comparisonEnabled: true },
    { id: "ga-8", type: "stat", title: "Conversions", dataSource: "google-analytics", metric: "conversions", format: "number", comparisonEnabled: true },
    { id: "ga-9", type: "stat", title: "Avg. Session Duration", dataSource: "google-analytics", metric: "avgSessionDuration", format: "number", comparisonEnabled: true },
    // Row 4: Device + Engagement chart
    { id: "ga-10", type: "pie-chart", title: "Device Distribution", dataSource: "google-analytics", metric: "sessions", format: "number" },
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
export const emailDefaults: PageDefault = {
  widgets: [
    { id: "em-1", type: "stat", title: "Emails Sent", dataSource: "email-marketing", metric: "emailsSent", format: "number", comparisonEnabled: true },
    { id: "em-2", type: "stat", title: "Open Rate", dataSource: "email-marketing", metric: "openRate", format: "percent", comparisonEnabled: true },
    { id: "em-3", type: "stat", title: "Click Rate", dataSource: "email-marketing", metric: "clickRate", format: "percent", comparisonEnabled: true },
    { id: "em-4", type: "stat", title: "New Contacts", dataSource: "email-marketing", metric: "newContacts", format: "number", comparisonEnabled: true },
    { id: "em-5", type: "line-chart", title: "Emails Sent Over Time", dataSource: "email-marketing", metric: "emailsSent", format: "number" },
    { id: "em-6", type: "line-chart", title: "Open Rate Trend", dataSource: "email-marketing", metric: "openRate", format: "percent" },
  ],
  layouts: {
    lg: [
      ...row([{ id: "em-1", w: 3, h: 2 }, { id: "em-2", w: 3, h: 2 }, { id: "em-3", w: 3, h: 2 }, { id: "em-4", w: 3, h: 2 }], 0),
      ...row([{ id: "em-5", w: 6, h: 5, minW: 3, minH: 3 }, { id: "em-6", w: 6, h: 5, minW: 3, minH: 3 }], 2),
    ],
    md: [
      ...row([{ id: "em-1", w: 2, h: 2 }, { id: "em-2", w: 2, h: 2 }, { id: "em-3", w: 2, h: 2 }, { id: "em-4", w: 2, h: 2 }], 0),
      ...row([{ id: "em-5", w: 4, h: 5, minW: 3, minH: 3 }, { id: "em-6", w: 4, h: 5, minW: 3, minH: 3 }], 2),
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
};
