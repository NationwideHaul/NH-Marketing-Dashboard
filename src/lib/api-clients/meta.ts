// Meta Marketing API client for Facebook + Instagram

const META_API_VERSION = "v21.0";
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

interface MetaApiOptions {
  accessToken: string;
  adAccountId?: string;
}

// ========== FACEBOOK PAGE INSIGHTS ==========
export async function getFacebookPageInsights(
  pageId: string,
  accessToken: string,
  since: string, // Unix timestamp
  until: string
) {
  const metrics = [
    "page_impressions",
    "page_impressions_unique",
    "page_engaged_users",
    "page_post_engagements",
    "page_fan_adds",
    "page_views_total",
    "page_actions_post_reactions_total",
  ].join(",");

  const url = `${META_BASE_URL}/${pageId}/insights?metric=${metrics}&period=day&since=${since}&until=${until}&access_token=${accessToken}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Facebook API error: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

// ========== FACEBOOK PAGE DATA ==========
export async function getFacebookPageData(
  pageId: string,
  accessToken: string
) {
  const fields = "id,name,fan_count,followers_count,posts.limit(5){message,created_time,full_picture,shares,likes.summary(true),comments.summary(true)}";

  const url = `${META_BASE_URL}/${pageId}?fields=${fields}&access_token=${accessToken}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Facebook API error: ${response.status}`);
  }
  return response.json();
}

// ========== INSTAGRAM BUSINESS INSIGHTS ==========
export async function getInstagramInsights(
  igUserId: string,
  accessToken: string,
  since: string,
  until: string
) {
  const metrics = [
    "impressions",
    "reach",
    "profile_views",
    "follower_count",
    "website_clicks",
  ].join(",");

  const url = `${META_BASE_URL}/${igUserId}/insights?metric=${metrics}&period=day&since=${since}&until=${until}&access_token=${accessToken}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Instagram API error: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

// ========== INSTAGRAM MEDIA ==========
export async function getInstagramMedia(
  igUserId: string,
  accessToken: string,
  limit: number = 25
) {
  const fields = "id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink";

  const url = `${META_BASE_URL}/${igUserId}/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Instagram API error: ${response.status}`);
  }
  return response.json();
}

// ========== INSTAGRAM PROFILE ==========
export async function getInstagramProfile(
  igUserId: string,
  accessToken: string
) {
  const fields = "id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url,website";

  const url = `${META_BASE_URL}/${igUserId}?fields=${fields}&access_token=${accessToken}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Instagram API error: ${response.status}`);
  }
  return response.json();
}

// ========== META ADS ==========
export async function getMetaAdsCampaigns(
  adAccountId: string,
  accessToken: string,
  since: string,
  until: string
) {
  const fields = "campaign_name,impressions,clicks,spend,cpc,ctr,actions,reach";
  const timeRange = encodeURIComponent(JSON.stringify({ since, until }));

  const url = `${META_BASE_URL}/${adAccountId}/insights?fields=${fields}&time_range=${timeRange}&level=campaign&access_token=${accessToken}&limit=50`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Meta Ads API error: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

export async function getMetaAdsAccountInsights(
  adAccountId: string,
  accessToken: string,
  since: string,
  until: string
) {
  const fields = "impressions,clicks,spend,cpc,ctr,reach,actions,cost_per_action_type";
  const timeRange = encodeURIComponent(JSON.stringify({ since, until }));

  const url = `${META_BASE_URL}/${adAccountId}/insights?fields=${fields}&time_range=${timeRange}&time_increment=1&limit=500&access_token=${accessToken}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Meta Ads API error: ${response.status} ${await response.text()}`);
  }
  const json = await response.json();

  // Paginate to collect all daily rows (Meta defaults to 25 per page)
  let allData = json.data || [];
  let nextUrl = json.paging?.next;
  while (nextUrl) {
    const nextRes = await fetch(nextUrl);
    if (!nextRes.ok) break;
    const nextJson = await nextRes.json();
    allData = allData.concat(nextJson.data || []);
    nextUrl = nextJson.paging?.next;
  }
  json.data = allData;
  return json;
}
