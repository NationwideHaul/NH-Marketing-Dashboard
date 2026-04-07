import type { ChartConfig } from "@/types/chart";

export const chartConfigs: Record<string, ChartConfig[]> = {
  "google-analytics": [
    { title: "Sessions & Users", metricKey: "sessions", defaultType: "line", supportedTypes: ["line", "area", "bar"], format: "number" },
    { title: "Page Views", metricKey: "pageViews", defaultType: "area", supportedTypes: ["area", "line", "bar"], format: "number" },
    { title: "Bounce Rate", metricKey: "bounceRate", defaultType: "line", supportedTypes: ["line", "area"], format: "percent" },
    { title: "Conversions", metricKey: "conversions", defaultType: "bar", supportedTypes: ["bar", "line", "area"], format: "number" },
  ],
  "google-ads": [
    { title: "Ad Spend", metricKey: "spend", defaultType: "area", supportedTypes: ["area", "line", "bar"], format: "currency" },
    { title: "Clicks", metricKey: "clicks", defaultType: "line", supportedTypes: ["line", "bar", "area"], format: "number" },
    { title: "Impressions", metricKey: "impressions", defaultType: "area", supportedTypes: ["area", "line", "bar"], format: "number" },
    { title: "CTR", metricKey: "ctr", defaultType: "line", supportedTypes: ["line", "area"], format: "percent" },
  ],
  gmb: [
    { title: "Profile Views", metricKey: "profileViews", defaultType: "line", supportedTypes: ["line", "area", "bar"], format: "number" },
    { title: "Search vs Map Views", metricKey: "searchViews", defaultType: "area", supportedTypes: ["area", "line", "bar"], format: "number" },
    { title: "Phone Calls", metricKey: "phoneCalls", defaultType: "bar", supportedTypes: ["bar", "line"], format: "number" },
    { title: "Website Clicks", metricKey: "websiteClicks", defaultType: "bar", supportedTypes: ["bar", "line", "area"], format: "number" },
  ],
  facebook: [
    { title: "Audience Growth", metricKey: "followers", defaultType: "line", supportedTypes: ["line", "area"], format: "number" },
    { title: "Post Engagement", metricKey: "postEngagement", defaultType: "bar", supportedTypes: ["bar", "line", "area"], format: "number" },
    { title: "Reach", metricKey: "reach", defaultType: "area", supportedTypes: ["area", "line", "bar"], format: "number" },
    { title: "New Page Likes", metricKey: "likes", defaultType: "bar", supportedTypes: ["bar", "pie", "line"], format: "number" },
  ],
  instagram: [
    { title: "Followers", metricKey: "followers", defaultType: "line", supportedTypes: ["line", "area"], format: "number" },
    { title: "Reach", metricKey: "reach", defaultType: "area", supportedTypes: ["area", "line", "bar"], format: "number" },
    { title: "Views", metricKey: "views", defaultType: "line", supportedTypes: ["line", "area", "bar"], format: "number" },
    { title: "Engagement", metricKey: "likes", defaultType: "bar", supportedTypes: ["bar", "line"], format: "number" },
  ],
  youtube: [
    { title: "Views", metricKey: "views", defaultType: "bar", supportedTypes: ["bar", "line", "area"], format: "number" },
    { title: "Watch Time", metricKey: "watchTime", defaultType: "area", supportedTypes: ["area", "line", "bar"], format: "number" },
    { title: "Likes", metricKey: "likes", defaultType: "bar", supportedTypes: ["bar", "line"], format: "number" },
    { title: "Subscribers", metricKey: "subscribers", defaultType: "line", supportedTypes: ["line", "area"], format: "number" },
  ],
  "meta-ads": [
    { title: "Ad Spend", metricKey: "spend", defaultType: "area", supportedTypes: ["area", "line", "bar"], format: "currency" },
    { title: "Average CPC", metricKey: "cpc", defaultType: "line", supportedTypes: ["line", "area"], format: "currency" },
    { title: "Clicks", metricKey: "clicks", defaultType: "bar", supportedTypes: ["bar", "line", "pie"], format: "number" },
    { title: "Reach", metricKey: "reach", defaultType: "area", supportedTypes: ["area", "line", "bar", "pie"], format: "number" },
  ],
  ringcentral: [
    { title: "Call Volume", metricKey: "totalCalls", defaultType: "bar", supportedTypes: ["bar", "line", "area"], format: "number" },
    { title: "Answer Rate", metricKey: "answerRate", defaultType: "line", supportedTypes: ["line", "area"], format: "percent" },
    { title: "Missed Calls", metricKey: "missed", defaultType: "bar", supportedTypes: ["bar", "line"], format: "number" },
    { title: "Avg. Duration", metricKey: "avgDuration", defaultType: "line", supportedTypes: ["line", "area"], format: "number" },
  ],
  "go-high-level": [
    { title: "Emails Sent", metricKey: "emailsSent", defaultType: "bar", supportedTypes: ["bar", "line", "area"], format: "number" },
    { title: "Open Rate", metricKey: "openRate", defaultType: "line", supportedTypes: ["line", "area"], format: "percent" },
    { title: "Click Rate", metricKey: "clickRate", defaultType: "line", supportedTypes: ["line", "area"], format: "percent" },
    { title: "New Contacts", metricKey: "newContacts", defaultType: "bar", supportedTypes: ["bar", "line"], format: "number" },
  ],
  linkedin: [
    { title: "Impressions", metricKey: "impressions", defaultType: "area", supportedTypes: ["area", "line", "bar"], format: "number" },
    { title: "Clicks", metricKey: "clicks", defaultType: "bar", supportedTypes: ["bar", "line", "area"], format: "number" },
    { title: "Follower Growth", metricKey: "followers", defaultType: "line", supportedTypes: ["line", "area"], format: "number" },
    { title: "Ad Spend", metricKey: "adSpend", defaultType: "area", supportedTypes: ["area", "line", "bar"], format: "currency" },
  ],
};
