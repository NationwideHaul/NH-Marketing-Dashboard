import type { WidgetType, DataSourceOption, LayoutItem } from "@/types/widget";

// Default sizes for each widget type (in grid units, 12-col grid)
export const defaultWidgetSizes: Record<WidgetType, { w: number; h: number; minW: number; minH: number }> = {
  "stat": { w: 3, h: 2, minW: 2, minH: 2 },
  "line-chart": { w: 6, h: 4, minW: 3, minH: 3 },
  "bar-chart": { w: 6, h: 4, minW: 3, minH: 3 },
  "area-chart": { w: 6, h: 4, minW: 3, minH: 3 },
  "pie-chart": { w: 4, h: 4, minW: 3, minH: 3 },
  "table": { w: 6, h: 5, minW: 4, minH: 3 },
  "goal-tracker": { w: 3, h: 2, minW: 2, minH: 2 },
};

// Widget type labels for the picker
export const widgetTypeLabels: Record<WidgetType, { label: string; description: string; icon: string }> = {
  "stat": { label: "Stat Card", description: "Single metric with comparison", icon: "Hash" },
  "line-chart": { label: "Line Chart", description: "Metric over time", icon: "TrendingUp" },
  "bar-chart": { label: "Bar Chart", description: "Compare values side by side", icon: "BarChart3" },
  "area-chart": { label: "Area Chart", description: "Trend with filled area", icon: "AreaChart" },
  "pie-chart": { label: "Pie Chart", description: "Distribution breakdown", icon: "PieChart" },
  "table": { label: "Data Table", description: "Top performers list", icon: "Table" },
  "goal-tracker": { label: "Goal Tracker", description: "Progress toward a target", icon: "Target" },
};

// All data sources with their available metrics
export const dataSources: DataSourceOption[] = [
  {
    key: "google-analytics",
    label: "Google Analytics",
    icon: "BarChart3",
    metrics: [
      { key: "sessions", label: "Sessions", format: "number" },
      { key: "users", label: "Users", format: "number" },
      { key: "pageViews", label: "Page Views", format: "number" },
      { key: "bounceRate", label: "Bounce Rate", format: "percent" },
      { key: "avgSessionDuration", label: "Avg. Session Duration", format: "number" },
      { key: "conversions", label: "Conversions", format: "number" },
    ],
  },
  {
    key: "google-ads",
    label: "Google Ads",
    icon: "DollarSign",
    metrics: [
      { key: "spend", label: "Ad Spend", format: "currency" },
      { key: "clicks", label: "Clicks", format: "number" },
      { key: "impressions", label: "Impressions", format: "number" },
      { key: "ctr", label: "CTR", format: "percent" },
      { key: "conversions", label: "Conversions", format: "number" },
      { key: "costPerConversion", label: "Cost Per Conversion", format: "currency" },
    ],
  },
  {
    key: "meta-ads",
    label: "Meta Ads",
    icon: "Megaphone",
    metrics: [
      { key: "spend", label: "Ad Spend", format: "currency" },
      { key: "impressions", label: "Impressions", format: "number" },
      { key: "clicks", label: "Clicks", format: "number" },
      { key: "ctr", label: "CTR", format: "percent" },
      { key: "cpc", label: "Avg. CPC", format: "currency" },
      { key: "conversions", label: "Conversions", format: "number" },
      { key: "reach", label: "Reach", format: "number" },
    ],
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: "Share2",
    metrics: [
      { key: "followers", label: "Followers", format: "number" },
      { key: "pageViews", label: "Page Views", format: "number" },
      { key: "postEngagement", label: "Engagement", format: "number" },
      { key: "reach", label: "Reach", format: "number" },
      { key: "likes", label: "New Likes", format: "number" },
    ],
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: "Share2",
    metrics: [
      { key: "followers", label: "Followers", format: "number" },
      { key: "reach", label: "Reach", format: "number" },
      { key: "likes", label: "Likes", format: "number" },
      { key: "saves", label: "Saves", format: "number" },
      { key: "comments", label: "Comments", format: "number" },
    ],
  },
  {
    key: "youtube",
    label: "YouTube",
    icon: "Play",
    metrics: [
      { key: "views", label: "Views", format: "number" },
      { key: "watchTime", label: "Watch Time (hrs)", format: "number" },
      { key: "subscribers", label: "Subscribers", format: "number" },
      { key: "likes", label: "Likes", format: "number" },
      { key: "comments", label: "Comments", format: "number" },
    ],
  },
  {
    key: "callrail",
    label: "CallRail",
    icon: "Phone",
    metrics: [
      { key: "totalCalls", label: "Total Calls", format: "number" },
      { key: "answered", label: "Answered", format: "number" },
      { key: "missed", label: "Missed Calls", format: "number" },
      { key: "avgDuration", label: "Avg. Duration (min)", format: "number" },
      { key: "uniqueCallers", label: "Unique Callers", format: "number" },
      { key: "answerRate", label: "Answer Rate", format: "percent" },
    ],
  },
  {
    key: "email-marketing",
    label: "Email Marketing",
    icon: "Mail",
    metrics: [
      { key: "emailsSent", label: "Emails Sent", format: "number" },
      { key: "openRate", label: "Open Rate", format: "percent" },
      { key: "clickRate", label: "Click Rate", format: "percent" },
      { key: "bounces", label: "Bounces", format: "number" },
      { key: "unsubscribes", label: "Unsubscribes", format: "number" },
      { key: "newContacts", label: "New Contacts", format: "number" },
    ],
  },
  {
    key: "ringcentral",
    label: "RingCentral",
    icon: "Phone",
    metrics: [
      { key: "totalCalls", label: "Total Calls", format: "number" },
      { key: "answered", label: "Answered", format: "number" },
      { key: "missed", label: "Missed", format: "number" },
      { key: "avgDuration", label: "Avg. Duration", format: "number" },
      { key: "answerRate", label: "Answer Rate", format: "percent" },
    ],
  },
  {
    key: "gmb",
    label: "Google My Business",
    icon: "MapPin",
    metrics: [
      { key: "profileViews", label: "Profile Views", format: "number" },
      { key: "searchViews", label: "Search Views", format: "number" },
      { key: "phoneCalls", label: "Phone Calls", format: "number" },
      { key: "directionRequests", label: "Direction Requests", format: "number" },
      { key: "websiteClicks", label: "Website Clicks", format: "number" },
    ],
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: "Briefcase",
    metrics: [
      { key: "impressions", label: "Impressions", format: "number" },
      { key: "clicks", label: "Clicks", format: "number" },
      { key: "followers", label: "Followers", format: "number" },
      { key: "ctr", label: "CTR", format: "percent" },
    ],
  },
];

// Helper to find a data source and its metrics
export function getDataSource(key: string) {
  return dataSources.find((ds) => ds.key === key);
}

export function getMetricOptions(dataSourceKey: string) {
  return getDataSource(dataSourceKey)?.metrics || [];
}

// Generate next available position in the grid
export function getNextPosition(layouts: LayoutItem[]): { x: number; y: number } {
  if (layouts.length === 0) return { x: 0, y: 0 };
  const maxY = Math.max(...layouts.map((l) => l.y + l.h));
  return { x: 0, y: maxY };
}
