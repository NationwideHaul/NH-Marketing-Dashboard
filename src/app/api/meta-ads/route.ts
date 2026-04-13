import { NextRequest, NextResponse } from "next/server";
import { getMetaAdsCampaigns, getMetaAdsAccountInsights, getInstagramProfile } from "@/lib/api-clients/meta";
import { getAccountCredentials } from "@/lib/account-credentials";

const META_API_VERSION = "v21.0";
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

// Helper: get Page Access Token via /me/accounts (most reliable method)
async function getPageAccessToken(pageId: string, systemToken: string): Promise<string> {
  try {
    const url = `${META_BASE_URL}/me/accounts?access_token=${systemToken}`;
    const res = await fetch(url);
    if (!res.ok) return systemToken;
    const data = await res.json();
    const page = data.data?.find((p: any) => p.id === pageId); // eslint-disable-line @typescript-eslint/no-explicit-any
    return page?.access_token || systemToken;
  } catch {
    return systemToken;
  }
}

// Fetch Facebook page data using Page Insights API
async function getFacebookData(pageId: string, pageToken: string, since: string, until: string) {
  // 1. Page basics (followers)
  const pageFields = "id,name,fan_count,followers_count";
  const pageRes = await fetch(`${META_BASE_URL}/${pageId}?fields=${pageFields}&access_token=${pageToken}`);
  const pageData = pageRes.ok ? await pageRes.json() : {};

  // 2. Page Insights — daily reach, engagement, views
  const sinceParam = since ? `&since=${since}` : "";
  const untilParam = until ? `&until=${until}` : "";
  const metrics = "page_impressions_unique,page_post_engagements,page_views_total";
  const insightsUrl = `${META_BASE_URL}/${pageId}/insights?metric=${metrics}&period=day${sinceParam}${untilParam}&access_token=${pageToken}`;
  let insightsData: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    const r = await fetch(insightsUrl);
    insightsData = await r.json();
  } catch { /* no permission */ }

  const getMetric = (name: string) =>
    insightsData.data?.find((m: any) => m.name === name); // eslint-disable-line @typescript-eslint/no-explicit-any
  const sumMetric = (name: string) => {
    const m = getMetric(name);
    return (m?.values || []).reduce(
      (s: number, v: any) => s + (v.value || 0), // eslint-disable-line @typescript-eslint/no-explicit-any
      0
    );
  };
  const seriesOf = (name: string) => {
    const m = getMetric(name);
    return (m?.values || []).map((v: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      date: (v.end_time || "").split("T")[0],
      value: v.value || 0,
    }));
  };

  // 3. Posts with engagement (requires pages_read_user_content)
  let posts: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    const engagementFields = "id,message,created_time,full_picture,permalink_url,shares,likes.summary(true),comments.summary(true)";
    const postsUrl = `${META_BASE_URL}/${pageId}/posts?fields=${engagementFields}&limit=20${sinceParam}${untilParam}&access_token=${pageToken}`;
    const postsRes = await fetch(postsUrl);
    const postsPayload = await postsRes.json();
    if (!postsPayload.error) posts = postsPayload.data || [];
  } catch { /* no permission */ }

  let totalLikes = 0, totalComments = 0, totalShares = 0;
  for (const post of posts) {
    totalLikes += post.likes?.summary?.total_count || 0;
    totalComments += post.comments?.summary?.total_count || 0;
    totalShares += post.shares?.count || 0;
  }

  const reach = sumMetric("page_impressions_unique");
  const engagement = sumMetric("page_post_engagements");
  const pageViews = sumMetric("page_views_total");

  return {
    followers: pageData.followers_count || pageData.fan_count || 0,
    fans: pageData.fan_count || 0,
    reach,
    views: pageViews,
    pageViews,
    interactions: engagement || totalLikes + totalComments + totalShares,
    postEngagement: engagement || totalLikes + totalComments + totalShares,
    totalLikes,
    totalComments,
    totalShares,
    likes: totalLikes,
    comments: totalComments,
    shares: totalShares,
    postCount: posts.length,
    posts: posts.slice(0, 10).map((p: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      id: p.id,
      message: p.message?.substring(0, 200),
      createdTime: p.created_time,
      image: p.full_picture,
      permalink: p.permalink_url,
      likes: p.likes?.summary?.total_count || 0,
      comments: p.comments?.summary?.total_count || 0,
      shares: p.shares?.count || 0,
      engagement:
        (p.likes?.summary?.total_count || 0) +
        (p.comments?.summary?.total_count || 0) +
        (p.shares?.count || 0),
    })),
    // Daily time series for charts
    reachTimeSeries: seriesOf("page_impressions_unique"),
    engagementTimeSeries: seriesOf("page_post_engagements"),
    viewsTimeSeries: seriesOf("page_views_total"),
  };
}

// Fetch Instagram profile + media + insights
async function getInstagramData(igUserId: string, accessToken: string, pageId: string, pageToken: string, since: string, until: string) { // eslint-disable-line @typescript-eslint/no-unused-vars
  // 1. Profile
  const profile = await getInstagramProfile(igUserId, accessToken);

  // 2. Media (requires instagram_basic)
  let media: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    const mediaFields = "id,caption,media_type,timestamp,like_count,comments_count,permalink,thumbnail_url,media_url";
    const mediaRes = await fetch(`${META_BASE_URL}/${igUserId}/media?fields=${mediaFields}&limit=20&access_token=${accessToken}`);
    const mediaData = await mediaRes.json();
    if (mediaData.data) media = mediaData.data;
  } catch { /* no permission */ }

  // 3. Insights (requires instagram_manage_insights)
  //    Uses Unix timestamps. Default to last 30 days if dates not provided.
  const toUnix = (ymd: string) => Math.floor(new Date(`${ymd}T00:00:00Z`).getTime() / 1000);
  const sinceTs = since ? toUnix(since) : Math.floor(Date.now() / 1000) - 86400 * 30;
  const untilTs = until ? toUnix(until) : Math.floor(Date.now() / 1000);
  let insights: any[] | null = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    const insightsRes = await fetch(`${META_BASE_URL}/${igUserId}/insights?metric=reach&metric_type=total_value&period=day&since=${sinceTs}&until=${untilTs}&access_token=${accessToken}`);
    const insightsData = await insightsRes.json();
    if (insightsData.data) insights = insightsData.data;
  } catch { /* no permission */ }

  const totalLikes = media.reduce((s, m) => s + (m.like_count || 0), 0);
  const totalComments = media.reduce((s, m) => s + (m.comments_count || 0), 0);

  const findInsight = (name: string) =>
    insights?.find((i: any) => i.name === name); // eslint-disable-line @typescript-eslint/no-explicit-any
  const sumInsight = (name: string) => {
    const m = findInsight(name);
    if (m?.total_value?.value !== undefined) return m.total_value.value;
    return (m?.values || []).reduce(
      (s: number, v: any) => s + (v.value || 0), // eslint-disable-line @typescript-eslint/no-explicit-any
      0
    );
  };
  const seriesOf = (name: string) => {
    const m = findInsight(name);
    return (m?.values || []).map((v: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      date: (v.end_time || "").split("T")[0],
      value: v.value || 0,
    }));
  };

  return {
    followers: profile.followers_count || 0,
    follows: profile.follows_count || 0,
    mediaCount: profile.media_count || 0,
    username: profile.username || "",
    name: profile.name || "",
    biography: profile.biography || "",
    website: profile.website || "",
    profilePicture: profile.profile_picture_url || "",
    // Engagement aggregated from media
    likes: totalLikes,
    totalLikes,
    comments: totalComments,
    totalComments,
    interactions: totalLikes + totalComments,
    postEngagement: totalLikes + totalComments,
    postCount: media.length,
    media: media.slice(0, 10).map((m: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      id: m.id,
      caption: m.caption?.substring(0, 200),
      mediaType: m.media_type,
      timestamp: m.timestamp,
      likes: m.like_count || 0,
      comments: m.comments_count || 0,
      permalink: m.permalink,
      thumbnail: m.thumbnail_url || m.media_url,
    })),
    // Daily insights for charts
    reach: sumInsight("reach"),
    reachTimeSeries: seriesOf("reach"),
    // Saves is not available at account level any more — leave null so widget can show N/A
    saves: null,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "ads";
  const since = searchParams.get("since") || searchParams.get("startDate") || "";
  const until = searchParams.get("until") || searchParams.get("endDate") || "";
  const accountId = searchParams.get("accountId") || "nationwide-haul";

  const creds = getAccountCredentials(accountId);
  const accessToken = creds.metaAccessToken;

  if (!accessToken) {
    return NextResponse.json({ platform: "meta", status: "error", error: `Meta not configured for account: ${accountId}` });
  }

  try {
    let data;
    const pageId = creds.metaPageId || "";
    const pageToken = pageId ? await getPageAccessToken(pageId, accessToken) : accessToken;

    if (type === "ads" || type === "campaigns") {
      const adAccountId = creds.metaAdAccountId || "";
      data = type === "campaigns"
        ? await getMetaAdsCampaigns(adAccountId, accessToken, since, until)
        : await getMetaAdsAccountInsights(adAccountId, accessToken, since, until);
    } else if (type === "facebook" || type === "facebook-page") {
      data = await getFacebookData(pageId, pageToken, since, until);
    } else if (type === "instagram" || type === "ig-profile" || type === "ig-media") {
      const igUserId = creds.metaIgUserId || "";
      data = await getInstagramData(igUserId, accessToken, pageId, pageToken, since, until);
    }
    return NextResponse.json({ platform: "meta", status: "live", accountId, data });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    return NextResponse.json({
      platform: "meta",
      status: "error",
      error: error.message,
      debug: {
        type,
        since,
        until,
        adAccountId: creds.metaAdAccountId,
        accessTokenLen: accessToken?.length,
        accessTokenStart: accessToken?.slice(0, 8),
      },
    }, { status: 500 });
  }
}
