// Central registry of metric definitions shown in the (?) tooltips on each KPI tile.
// Keys can be either `${dataSource}:${metric}` for source-specific overrides,
// or just `${metric}` for generic fallbacks.

export type MetricDefinition = {
  title: string;
  definition: string;
  formula: string;
};

export const metricDefinitions: Record<string, MetricDefinition> = {
  // ========== ROI & Revenue (existing) ==========
  revenue: {
    title: "Total Revenue",
    definition: "The total income generated from all sales within the selected period.",
    formula: "Sum of all closed deal values",
  },
  closeRate: {
    title: "Close Rate (Lead-to-Sale)",
    definition: "The percentage of leads that convert into paying customers.",
    formula: "Closed Deals / Total Leads x 100",
  },
  aov: {
    title: "Average Order Value (AOV)",
    definition: "The average revenue per transaction or closed deal.",
    formula: "Total Revenue / Number of Orders",
  },
  adSpend: {
    title: "Total Advertising Spend",
    definition: "The combined amount spent across all advertising platforms (Google Ads, Meta Ads, etc.).",
    formula: "Google Ads Spend + Meta Ads Spend + Other Ad Spend",
  },
  totalSpend: {
    title: "Total Spend",
    definition: "All marketing spend across paid ads and other marketing channels.",
    formula: "Ad Spend + Other Marketing Spend",
  },
  roas: {
    title: "Return on Ad Spend (ROAS)",
    definition: "How much revenue you earn for every dollar spent on advertising. A ROAS of 10x means $10 revenue per $1 spent.",
    formula: "Revenue / Ad Spend",
  },
  mer: {
    title: "Marketing Efficiency Ratio (MER)",
    definition: "Measures overall marketing efficiency including all marketing costs (not just ads). Higher is better.",
    formula: "Total Revenue / Total Marketing Spend",
  },
  roi: {
    title: "Return on Investment (ROI)",
    definition: "The profit generated relative to the total marketing investment. Shows the net return as a percentage.",
    formula: "(Revenue - Total Spend) / Total Spend x 100",
  },
  cac: {
    title: "Customer Acquisition Cost (CAC)",
    definition: "The average cost to acquire one new customer. Lower is better.",
    formula: "Total Marketing Spend / Number of New Customers",
  },
  ltv: {
    title: "Lifetime Value (LTV)",
    definition: "The total revenue a customer generates over their entire relationship with the business.",
    formula: "AOV x Purchase Frequency x Customer Lifespan",
  },
  ltvCacRatio: {
    title: "LTV:CAC Ratio",
    definition: "Compares customer lifetime value to acquisition cost. Target should be 3:1 or higher.",
    formula: "LTV / CAC",
  },
  trafficGrowth: {
    title: "Traffic Growth",
    definition: "Month-over-month percentage change in website traffic.",
    formula: "(Current Sessions - Previous Sessions) / Previous Sessions x 100",
  },
  revenueGrowth: {
    title: "Revenue Growth",
    definition: "Month-over-month percentage change in total revenue.",
    formula: "(Current Revenue - Previous Revenue) / Previous Revenue x 100",
  },
  costEfficiency: {
    title: "Cost Efficiency",
    definition: "How efficiently your marketing budget is being used. Higher percentage means less waste.",
    formula: "Revenue-Generating Spend / Total Spend x 100",
  },
  profitMargin: {
    title: "Profit Margin",
    definition: "The percentage of revenue remaining after all marketing costs are deducted.",
    formula: "(Revenue - Total Marketing Spend) / Revenue x 100",
  },
  newCustomers: {
    title: "New Customers",
    definition: "Unique customers who made their first purchase in the selected period.",
    formula: "Count of first-time buyers in period",
  },
  conversionRate: {
    title: "Conversion Rate",
    definition: "Percentage of visitors or leads that complete a desired action.",
    formula: "Conversions / Total Visitors x 100",
  },

  // ========== Google Analytics ==========
  sessions: {
    title: "Sessions",
    definition: "The number of visits to your website. One visitor can have multiple sessions.",
    formula: "GA4 'sessions' metric (summed across the date range)",
  },
  users: {
    title: "Users",
    definition: "Unique people who visited your site during the selected period.",
    formula: "GA4 'totalUsers' metric (summed across the date range)",
  },
  newUsers: {
    title: "New Users",
    definition: "Users who visited your site for the first time in the selected period.",
    formula: "GA4 'newUsers' metric",
  },
  pageViews: {
    title: "Page Views",
    definition: "Total number of pages viewed. Repeated views of the same page are counted.",
    formula: "GA4 'screenPageViews' metric (summed)",
  },
  bounceRate: {
    title: "Bounce Rate",
    definition: "Percentage of sessions where the user left without interacting (single-page sessions).",
    formula: "GA4 'bounceRate' metric",
  },
  avgSessionDuration: {
    title: "Avg Session Duration",
    definition: "The average time a user spends on your site per session.",
    formula: "GA4 'averageSessionDuration' metric (in seconds)",
  },
  engagementRate: {
    title: "Engagement Rate",
    definition: "Percentage of engaged sessions (sessions that lasted 10+ seconds or had a conversion).",
    formula: "Engaged Sessions / Total Sessions x 100",
  },

  // ========== Google Ads ==========
  "google-ads:spend": {
    title: "Google Ads Spend",
    definition: "Total amount spent on Google Ads campaigns in the selected period.",
    formula: "Sum of daily cost_micros / 1,000,000 from Google Ads API",
  },
  "google-ads:clicks": {
    title: "Google Ads Clicks",
    definition: "Number of times your Google Ads were clicked.",
    formula: "Sum of metrics.clicks from Google Ads API",
  },
  "google-ads:impressions": {
    title: "Google Ads Impressions",
    definition: "Number of times your Google Ads were shown.",
    formula: "Sum of metrics.impressions from Google Ads API",
  },
  "google-ads:ctr": {
    title: "Google Ads CTR",
    definition: "Click-through rate — the percentage of people who clicked after seeing the ad.",
    formula: "Total Clicks / Total Impressions x 100",
  },
  "google-ads:cpc": {
    title: "Google Ads CPC",
    definition: "Average cost per click on Google Ads.",
    formula: "Total Spend / Total Clicks",
  },
  "google-ads:conversions": {
    title: "Google Ads Conversions",
    definition: "Tracked conversion events from your Google Ads campaigns (form fills, calls, purchases).",
    formula: "Sum of metrics.conversions from Google Ads API",
  },
  costPerConversion: {
    title: "Cost Per Conversion",
    definition: "How much you pay on average for each conversion.",
    formula: "Total Spend / Total Conversions",
  },
  searchImpressionShare: {
    title: "Search Impression Share",
    definition: "Percentage of times your ad appeared on relevant searches vs. total eligible searches.",
    formula: "Impressions / Eligible Impressions x 100",
  },

  // ========== Meta Ads ==========
  "meta-ads:spend": {
    title: "Amount Spent (Meta Ads)",
    definition: "Total spend across all Meta (Facebook + Instagram) paid campaigns in the selected period.",
    formula: "Sum of daily 'spend' from Meta Ads Insights API",
  },
  "meta-ads:impressions": {
    title: "Impressions (Meta Ads)",
    definition: "Total times your Meta ads were shown (includes repeat views).",
    formula: "Sum of daily 'impressions' from Meta Ads Insights API",
  },
  "meta-ads:reach": {
    title: "Reach (Meta Ads)",
    definition: "Number of unique people who saw your ads at least once.",
    formula: "Sum of daily 'reach' from Meta Ads Insights API",
  },
  "meta-ads:clicks": {
    title: "Clicks (Meta Ads)",
    definition: "Number of clicks on your Meta ads (any type of click).",
    formula: "Sum of daily 'clicks' from Meta Ads Insights API",
  },
  "meta-ads:ctr": {
    title: "CTR (Meta Ads)",
    definition: "Click-through rate across your Meta ads.",
    formula: "Total Clicks / Total Impressions x 100",
  },
  "meta-ads:cpc": {
    title: "CPC (Meta Ads)",
    definition: "Average cost per click on Meta ads.",
    formula: "Total Spend / Total Clicks",
  },
  "meta-ads:conversions": {
    title: "Leads (Meta Ads)",
    definition: "Lead events generated by your Meta ads (lead form submissions, registrations).",
    formula: "Sum of 'lead' action_type values from daily actions arrays",
  },
  "meta-ads:costPerLead": {
    title: "Cost Per Lead (Meta Ads)",
    definition: "Average spend required to generate one lead from Meta ads.",
    formula: "Total Meta Spend / Total Meta Leads",
  },
  cpm: {
    title: "CPM",
    definition: "Cost per thousand impressions — how much you pay to reach 1,000 people.",
    formula: "Total Spend / Impressions x 1,000",
  },

  // Generic fallbacks (used when no dataSource-specific key exists)
  spend: {
    title: "Spend",
    definition: "Total amount spent in the selected period.",
    formula: "Sum of daily spend from the platform's API",
  },
  impressions: {
    title: "Impressions",
    definition: "Total times content was shown (includes repeat views).",
    formula: "Sum of daily impressions",
  },
  clicks: {
    title: "Clicks",
    definition: "Total clicks in the selected period.",
    formula: "Sum of daily clicks",
  },
  ctr: {
    title: "CTR (Click-Through Rate)",
    definition: "Percentage of people who clicked after seeing the content.",
    formula: "Clicks / Impressions x 100",
  },
  cpc: {
    title: "CPC (Cost Per Click)",
    definition: "Average amount paid per click.",
    formula: "Spend / Clicks",
  },
  conversions: {
    title: "Conversions",
    definition: "Users who completed a desired action (form, purchase, call).",
    formula: "Platform-specific conversion tracking",
  },
  costPerLead: {
    title: "Cost Per Lead",
    definition: "Average spend required to generate one lead.",
    formula: "Total Spend / Total Leads",
  },
  reach: {
    title: "Reach",
    definition: "Number of unique people who saw your content.",
    formula: "Platform 'reach' metric (summed or deduplicated by the API)",
  },

  // ========== YouTube ==========
  "youtube:views": {
    title: "YouTube Views",
    definition: "Total views across your channel's videos in the selected period.",
    formula: "Sum of daily 'views' from YouTube Analytics API",
  },
  subscribers: {
    title: "Subscribers",
    definition: "Net subscribers gained in the selected period.",
    formula: "Sum of daily 'subscribersGained' from YouTube Analytics",
  },
  watchTime: {
    title: "Watch Time",
    definition: "Total minutes viewers spent watching your content.",
    formula: "Sum of 'estimatedMinutesWatched' from YouTube Analytics",
  },
  estimatedMinutesWatched: {
    title: "Estimated Minutes Watched",
    definition: "Total minutes viewers watched your videos.",
    formula: "YouTube Analytics 'estimatedMinutesWatched'",
  },
  "youtube:likes": {
    title: "YouTube Likes",
    definition: "Total likes across your videos in the selected period.",
    formula: "Sum of 'likes' from YouTube Analytics",
  },
  "youtube:impressions": {
    title: "YouTube Impressions",
    definition: "Times your video thumbnails were shown on YouTube.",
    formula: "YouTube Analytics impression count",
  },
  impressionsCtr: {
    title: "Impressions CTR",
    definition: "Percentage of impressions that resulted in a view.",
    formula: "Views / Impressions x 100",
  },
  avgViewDuration: {
    title: "Avg View Duration",
    definition: "Average time viewers spent watching per view.",
    formula: "Watch Time / Views",
  },
  videosPublished: {
    title: "Videos Published",
    definition: "Number of videos uploaded in the selected period.",
    formula: "Count of videos with publishedAt in range",
  },

  // ========== Facebook Page ==========
  "facebook:followers": {
    title: "Facebook Followers",
    definition: "Total followers of your Facebook Page.",
    formula: "Graph API 'followers_count' (fallback: fan_count)",
  },
  "facebook:pageViews": {
    title: "Page Views (Facebook)",
    definition: "Views of your Facebook Page in the selected period.",
    formula: "Graph API 'were_here_count' / page insights",
  },
  "facebook:reach": {
    title: "Reach (Facebook)",
    definition: "Unique people who saw content from your Facebook Page.",
    formula: "Graph API 'talking_about_count' / page insights",
  },
  "facebook:likes": {
    title: "Facebook Likes",
    definition: "Total likes across recent posts.",
    formula: "Sum of likes.summary.total_count across last 10 posts",
  },
  postEngagement: {
    title: "Post Engagement",
    definition: "Total interactions (likes + comments + shares) across recent posts.",
    formula: "Likes + Comments + Shares",
  },
  posts: {
    title: "Posts",
    definition: "Number of posts published in the selected period.",
    formula: "Count of posts from /posts endpoint",
  },

  // ========== Instagram ==========
  "instagram:followers": {
    title: "Instagram Followers",
    definition: "Total followers of your Instagram business account.",
    formula: "Graph API 'followers_count'",
  },
  "instagram:reach": {
    title: "Reach (Instagram)",
    definition: "Unique accounts that saw your Instagram content.",
    formula: "Instagram Insights 'reach' metric",
  },
  "instagram:likes": {
    title: "Instagram Likes",
    definition: "Total likes across recent posts/reels.",
    formula: "Sum of 'like_count' across media items",
  },
  saves: {
    title: "Saves",
    definition: "Times your content was saved by users.",
    formula: "Instagram Insights 'saves' / media insights",
  },
  comments: {
    title: "Comments",
    definition: "Total comments received across recent content.",
    formula: "Sum of 'comments_count' across media items",
  },
  mediaCount: {
    title: "Media Count",
    definition: "Total pieces of content on the Instagram account.",
    formula: "Graph API 'media_count'",
  },
  profileViews: {
    title: "Profile Views",
    definition: "Times your Instagram profile was viewed.",
    formula: "Instagram Insights 'profile_views'",
  },

  // ========== CallRail ==========
  totalCalls: {
    title: "Total Calls",
    definition: "All inbound calls tracked through CallRail in the selected period.",
    formula: "Count of calls from CallRail calls API",
  },
  answered: {
    title: "Answered Calls",
    definition: "Calls that were answered by a human (not sent to voicemail).",
    formula: "Count of calls where answered = true",
  },
  missed: {
    title: "Missed Calls",
    definition: "Calls that were not answered.",
    formula: "Total Calls - Answered Calls",
  },
  firstTimeCalls: {
    title: "First-Time Callers",
    definition: "Calls from phone numbers that haven't called before (new leads).",
    formula: "Count of calls where first_call = true",
  },
  avgDuration: {
    title: "Avg Call Duration",
    definition: "Average length of a tracked call.",
    formula: "Total Call Seconds / Total Calls",
  },
  answerRate: {
    title: "Answer Rate",
    definition: "Percentage of calls that were answered.",
    formula: "Answered Calls / Total Calls x 100",
  },

  // ========== Email Marketing (GHL) ==========
  emailsSent: {
    title: "Emails Sent",
    definition: "Total emails delivered via Go High Level campaigns.",
    formula: "Sum of campaign sends in the selected period",
  },
  openRate: {
    title: "Open Rate",
    definition: "Percentage of delivered emails that were opened.",
    formula: "Unique Opens / Delivered Emails x 100",
  },
  clickRate: {
    title: "Click Rate",
    definition: "Percentage of delivered emails where a link was clicked.",
    formula: "Unique Clicks / Delivered Emails x 100",
  },
  bounces: {
    title: "Bounces",
    definition: "Emails that failed to deliver (hard and soft bounces).",
    formula: "Count of bounced emails",
  },
  unsubscribes: {
    title: "Unsubscribes",
    definition: "Recipients who opted out of future emails.",
    formula: "Count of unsubscribe events",
  },
  newContacts: {
    title: "New Contacts",
    definition: "Contacts added to your GHL list in the selected period.",
    formula: "GHL contacts where dateAdded is in range",
  },

  // ========== Google My Business ==========
  "gmb:profileViews": {
    title: "Profile Views (GMB)",
    definition: "Times your Google Business Profile was viewed.",
    formula: "GBP 'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH' + '..._MAPS' metrics",
  },
  searchViews: {
    title: "Search Views",
    definition: "Times your profile appeared in Google Search.",
    formula: "GBP 'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH' + MOBILE_SEARCH",
  },
  mapViews: {
    title: "Map Views",
    definition: "Times your profile appeared on Google Maps.",
    formula: "GBP 'BUSINESS_IMPRESSIONS_DESKTOP_MAPS' + MOBILE_MAPS",
  },
  phoneCalls: {
    title: "Phone Calls (GMB)",
    definition: "Calls placed directly from your Google Business Profile.",
    formula: "GBP 'CALL_CLICKS' metric",
  },
  directionRequests: {
    title: "Direction Requests",
    definition: "Times users asked for directions to your location.",
    formula: "GBP 'BUSINESS_DIRECTION_REQUESTS' metric",
  },
  websiteClicks: {
    title: "Website Clicks (GMB)",
    definition: "Clicks to your website from your Google Business Profile.",
    formula: "GBP 'WEBSITE_CLICKS' metric",
  },

  // ========== LinkedIn ==========
  "linkedin:impressions": {
    title: "LinkedIn Impressions",
    definition: "Times your LinkedIn organization content was shown.",
    formula: "LinkedIn Marketing API organizationalEntityShareStatistics",
  },
  "linkedin:clicks": {
    title: "LinkedIn Clicks",
    definition: "Clicks on your LinkedIn organization content.",
    formula: "LinkedIn API shareStatistics clickCount",
  },
  "linkedin:followers": {
    title: "LinkedIn Followers",
    definition: "Organization followers on LinkedIn.",
    formula: "LinkedIn organizationalEntityFollowerStatistics",
  },
  "linkedin:ctr": {
    title: "LinkedIn CTR",
    definition: "Click-through rate of your LinkedIn content.",
    formula: "Clicks / Impressions x 100",
  },

  // ========== CRM (Nationwide Haul) ==========
  totalLeads: {
    title: "Total Leads",
    definition: "All leads captured across CRM in the selected period.",
    formula: "Count of leads from Nationwide Haul CRM",
  },
  closedWon: {
    title: "Closed Won",
    definition: "Deals marked as won in the CRM pipeline.",
    formula: "Count of deals with stage = closed_won",
  },
  totalRevenue: {
    title: "Total Revenue",
    definition: "Sum of closed-won deal values from CRM.",
    formula: "Sum of deal.amount where stage = closed_won",
  },
  avgDealValue: {
    title: "Average Deal Value",
    definition: "Average revenue per closed-won deal.",
    formula: "Total Revenue / Number of Closed-Won Deals",
  },
  mql: {
    title: "MQLs (Marketing Qualified Leads)",
    definition: "Leads that meet marketing-qualified criteria.",
    formula: "Leads tagged as MQL in CRM",
  },
  sql: {
    title: "SQLs (Sales Qualified Leads)",
    definition: "Leads that meet sales-qualified criteria and have been contacted.",
    formula: "Leads tagged as SQL in CRM",
  },
  closedDeals: {
    title: "Closed Deals",
    definition: "Deals finalized (won or lost) in the selected period.",
    formula: "Count of deals moved to a terminal stage",
  },

  // Misc / custom fields used in specific pages
  views: {
    title: "Views",
    definition: "Total content views in the selected period.",
    formula: "Platform-specific view count",
  },
  followers: {
    title: "Followers",
    definition: "Total followers on the selected platform.",
    formula: "Platform follower count",
  },
  likes: {
    title: "Likes",
    definition: "Total likes across recent content.",
    formula: "Sum of likes across media / posts",
  },
  infoSubmits: {
    title: "Info Submits",
    definition: "Form submissions on the website (excluding non-lead events).",
    formula: "GA4 event 'generate_lead' or equivalent",
  },
  bannerClicks: {
    title: "Banner Clicks",
    definition: "Clicks on promotional banners on the site.",
    formula: "GA4 custom event tracking",
  },
  replied: {
    title: "Replied",
    definition: "Recipients who replied to an email campaign.",
    formula: "Count of manual replies logged in CRM",
  },
  socialEngagement: {
    title: "Social Engagement",
    definition: "Aggregate interactions across all social platforms.",
    formula: "Sum of likes + comments + shares across Facebook, Instagram, LinkedIn",
  },
};

// Lookup a metric definition — tries `${dataSource}:${metric}` first, then falls back to `${metric}`.
export function getMetricDefinition(
  metric: string | undefined,
  dataSource?: string,
): MetricDefinition | undefined {
  if (!metric) return undefined;
  if (dataSource) {
    const scoped = metricDefinitions[`${dataSource}:${metric}`];
    if (scoped) return scoped;
  }
  return metricDefinitions[metric];
}
