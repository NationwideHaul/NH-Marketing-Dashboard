import type { WidgetType, DataSourceOption } from "@/types/widget";

// Chart types available in the picker
export const chartTypes: { key: WidgetType; label: string; icon: string }[] = [
  { key: "stat", label: "Stat", icon: "#" },
  { key: "line-chart", label: "Line", icon: "📈" },
  { key: "area-chart", label: "Area", icon: "📊" },
  { key: "bar-chart", label: "Bar", icon: "▊" },
  { key: "pie-chart", label: "Donut", icon: "◕" },
  { key: "table", label: "Table", icon: "▤" },
  { key: "goal-tracker", label: "Goal", icon: "◎" },
];

// Default sizes for each widget type (12-col grid)
export const defaultWidgetSizes: Record<WidgetType, { w: number; h: number; minW: number; minH: number }> = {
  "stat": { w: 3, h: 2, minW: 2, minH: 2 },
  "line-chart": { w: 6, h: 5, minW: 3, minH: 3 },
  "bar-chart": { w: 6, h: 5, minW: 3, minH: 3 },
  "area-chart": { w: 6, h: 5, minW: 3, minH: 3 },
  "pie-chart": { w: 4, h: 5, minW: 3, minH: 3 },
  "table": { w: 8, h: 6, minW: 4, minH: 4 },
  "goal-tracker": { w: 3, h: 2, minW: 2, minH: 2 },
};

// All data sources with their FULL available metrics
export const dataSources: DataSourceOption[] = [
  {
    key: "google-analytics",
    label: "Google Analytics 4",
    icon: "📊",
    metrics: [
      { key: "sessions", label: "Sessions", format: "number", category: "Traffic" },
      { key: "users", label: "Users", format: "number", category: "Traffic" },
      { key: "newUsers", label: "New Users", format: "number", category: "Traffic" },
      { key: "pageViews", label: "Pageviews", format: "number", category: "Traffic" },
      { key: "bounceRate", label: "Bounce Rate", format: "percent", category: "Engagement" },
      { key: "avgSessionDuration", label: "Avg. Session Duration", format: "number", category: "Engagement" },
      { key: "conversions", label: "Conversions", format: "number", category: "Conversions" },
      { key: "engagementRate", label: "Engagement Rate", format: "percent", category: "Engagement" },
    ],
  },
  {
    key: "google-ads",
    label: "Google Ads",
    icon: "💰",
    metrics: [
      { key: "spend", label: "Cost (Spend)", format: "currency", category: "Spend" },
      { key: "clicks", label: "Clicks", format: "number", category: "Traffic" },
      { key: "impressions", label: "Impressions", format: "number", category: "Reach" },
      { key: "ctr", label: "CTR", format: "percent", category: "Performance" },
      { key: "cpc", label: "Avg. CPC", format: "currency", category: "Spend" },
      { key: "conversions", label: "Conversions", format: "number", category: "Conversions" },
      { key: "costPerConversion", label: "Cost Per Conversion", format: "currency", category: "Spend" },
      { key: "searchImpressionShare", label: "Search Impression Share", format: "percent", category: "Reach" },
    ],
  },
  {
    key: "meta-ads",
    label: "Meta Ads",
    icon: "📢",
    metrics: [
      { key: "spend", label: "Amount Spent", format: "currency", category: "Spend" },
      { key: "impressions", label: "Impressions", format: "number", category: "Reach" },
      { key: "reach", label: "Reach", format: "number", category: "Reach" },
      { key: "clicks", label: "Clicks", format: "number", category: "Traffic" },
      { key: "ctr", label: "CTR", format: "percent", category: "Performance" },
      { key: "cpc", label: "CPC", format: "currency", category: "Spend" },
      { key: "cpm", label: "CPM", format: "currency", category: "Spend" },
      { key: "conversions", label: "Leads", format: "number", category: "Conversions" },
      { key: "costPerLead", label: "Cost Per Lead", format: "currency", category: "Spend" },
    ],
  },
  {
    key: "youtube",
    label: "YouTube",
    icon: "▶️",
    metrics: [
      { key: "views", label: "Views", format: "number", category: "Traffic" },
      { key: "subscribers", label: "Total Subscribers", format: "number", category: "Audience" },
      { key: "watchTime", label: "Watch Time (hours)", format: "number", category: "Engagement" },
      { key: "likes", label: "Likes", format: "number", category: "Engagement" },
      { key: "comments", label: "Comments", format: "number", category: "Engagement" },
      { key: "videosPublished", label: "Videos Published", format: "number", category: "Content" },
      { key: "avgViewDuration", label: "Avg. View Duration", format: "number", category: "Engagement" },
      { key: "estimatedMinutesWatched", label: "Est. Minutes Watched", format: "number", category: "Engagement" },
      { key: "impressions", label: "Impressions", format: "number", category: "Reach" },
      { key: "impressionsCtr", label: "Impressions CTR", format: "percent", category: "Performance" },
    ],
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: "👍",
    metrics: [
      { key: "followers", label: "Page Followers", format: "number", category: "Audience" },
      { key: "pageViews", label: "Page Views", format: "number", category: "Traffic" },
      { key: "postEngagement", label: "Post Engagement", format: "number", category: "Engagement" },
      { key: "reach", label: "Reach", format: "number", category: "Reach" },
      { key: "likes", label: "New Page Likes", format: "number", category: "Audience" },
      { key: "posts", label: "Posts Published", format: "number", category: "Content" },
    ],
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: "📷",
    metrics: [
      { key: "followers", label: "Followers", format: "number", category: "Audience" },
      { key: "reach", label: "Reach", format: "number", category: "Reach" },
      { key: "likes", label: "Likes", format: "number", category: "Engagement" },
      { key: "saves", label: "Saves", format: "number", category: "Engagement" },
      { key: "comments", label: "Comments", format: "number", category: "Engagement" },
      { key: "posts", label: "Posts Published", format: "number", category: "Content" },
    ],
  },
  {
    key: "callrail",
    label: "CallRail",
    icon: "📞",
    metrics: [
      { key: "totalCalls", label: "Total Calls", format: "number", category: "Calls" },
      { key: "answered", label: "Answered Calls", format: "number", category: "Calls" },
      { key: "missed", label: "Missed Calls", format: "number", category: "Calls" },
      { key: "firstTimeCalls", label: "First-Time Callers", format: "number", category: "Calls" },
      { key: "avgDuration", label: "Avg. Call Duration", format: "number", category: "Performance" },
      { key: "answerRate", label: "Answer Rate", format: "percent", category: "Performance" },
    ],
  },
  {
    key: "ringcentral",
    label: "RingCentral",
    icon: "☎️",
    metrics: [
      { key: "totalCalls", label: "Total Calls", format: "number", category: "Calls" },
      { key: "answered", label: "Answered", format: "number", category: "Calls" },
      { key: "missed", label: "Missed", format: "number", category: "Calls" },
      { key: "avgDuration", label: "Avg. Duration", format: "number", category: "Performance" },
      { key: "answerRate", label: "Answer Rate", format: "percent", category: "Performance" },
    ],
  },
  {
    key: "email-marketing",
    label: "Email Marketing (GHL)",
    icon: "✉️",
    metrics: [
      { key: "emailsSent", label: "Emails Sent", format: "number", category: "Activity" },
      { key: "openRate", label: "Open Rate", format: "percent", category: "Performance" },
      { key: "clickRate", label: "Click Rate", format: "percent", category: "Performance" },
      { key: "bounces", label: "Bounces", format: "number", category: "Deliverability" },
      { key: "unsubscribes", label: "Unsubscribes", format: "number", category: "Deliverability" },
      { key: "newContacts", label: "New Contacts", format: "number", category: "Growth" },
    ],
  },
  {
    key: "gmb",
    label: "Google My Business",
    icon: "📍",
    metrics: [
      { key: "profileViews", label: "Profile Views", format: "number", category: "Traffic" },
      { key: "searchViews", label: "Search Views", format: "number", category: "Traffic" },
      { key: "mapViews", label: "Map Views", format: "number", category: "Traffic" },
      { key: "phoneCalls", label: "Phone Calls", format: "number", category: "Actions" },
      { key: "directionRequests", label: "Direction Requests", format: "number", category: "Actions" },
      { key: "websiteClicks", label: "Website Clicks", format: "number", category: "Actions" },
    ],
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: "💼",
    metrics: [
      { key: "impressions", label: "Impressions", format: "number", category: "Reach" },
      { key: "clicks", label: "Clicks", format: "number", category: "Traffic" },
      { key: "followers", label: "Followers", format: "number", category: "Audience" },
      { key: "ctr", label: "CTR", format: "percent", category: "Performance" },
    ],
  },
];

export function getDataSource(key: string) {
  return dataSources.find((ds) => ds.key === key);
}

export function getMetricOptions(dataSourceKey: string) {
  return getDataSource(dataSourceKey)?.metrics || [];
}

export function getNextPosition(layouts: any[]): { x: number; y: number } { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!layouts || layouts.length === 0) return { x: 0, y: 0 };
  const maxY = Math.max(...layouts.map((l: any) => l.y + l.h)); // eslint-disable-line @typescript-eslint/no-explicit-any
  return { x: 0, y: maxY };
}
