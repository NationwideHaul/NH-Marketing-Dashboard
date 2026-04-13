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

// Fetch Facebook page data + posts (uses /posts endpoint which works with current permissions)
async function getFacebookData(pageId: string, pageToken: string, since: string, until: string) {
  // 1. Page basic data
  const pageFields = "id,name,fan_count,followers_count,talking_about_count,were_here_count";
  const pageRes = await fetch(`${META_BASE_URL}/${pageId}?fields=${pageFields}&access_token=${pageToken}`);
  const pageData = pageRes.ok ? await pageRes.json() : {};

  // 2. Posts via /posts endpoint (works without "Page Public Content Access" feature)
  //    Note: likes/comments/shares subfields require the feature — fetch basic post data
  let posts: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    const sinceParam = since ? `&since=${since}` : "";
    const untilParam = until ? `&until=${until}` : "";
    // Try with engagement fields first, fallback to basic
    const engagementFields = "id,message,created_time,full_picture,shares,likes.summary(true),comments.summary(true)";
    const basicFields = "id,message,created_time,full_picture";

    let postsUrl = `${META_BASE_URL}/${pageId}/posts?fields=${engagementFields}&limit=10${sinceParam}${untilParam}&access_token=${pageToken}`;
    let postsRes = await fetch(postsUrl);
    let postsData = await postsRes.json();

    if (postsData.error) {
      // Fallback to basic fields without engagement
      postsUrl = `${META_BASE_URL}/${pageId}/posts?fields=${basicFields}&limit=10${sinceParam}${untilParam}&access_token=${pageToken}`;
      postsRes = await fetch(postsUrl);
      postsData = await postsRes.json();
    }
    posts = postsData.data || [];
  } catch { /* endpoint not available */ }

  // 3. Calculate engagement from posts if available
  let totalLikes = 0, totalComments = 0, totalShares = 0;
  for (const post of posts) {
    totalLikes += post.likes?.summary?.total_count || 0;
    totalComments += post.comments?.summary?.total_count || 0;
    totalShares += post.shares?.count || 0;
  }

  return {
    followers: pageData.followers_count || pageData.fan_count || 0,
    fans: pageData.fan_count || 0,
    talkingAbout: pageData.talking_about_count || 0,
    totalLikes,
    totalComments,
    totalShares,
    interactions: totalLikes + totalComments + totalShares,
    postCount: posts.length,
    posts: posts.slice(0, 10).map((p: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      id: p.id,
      message: p.message?.substring(0, 200),
      createdTime: p.created_time,
      image: p.full_picture,
      likes: p.likes?.summary?.total_count || 0,
      comments: p.comments?.summary?.total_count || 0,
      shares: p.shares?.count || 0,
    })),
    reach: pageData.talking_about_count || 0,
    views: pageData.were_here_count || 0,
  };
}

// Fetch Instagram data — profile + media (try via page's instagram_business_account)
async function getInstagramData(igUserId: string, accessToken: string, pageId: string, pageToken: string) {
  // 1. Profile (always works)
  const profile = await getInstagramProfile(igUserId, accessToken);

  // 2. Try to get media via multiple methods
  let media: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any

  // Method A: Direct IG media endpoint
  try {
    const mediaFields = "id,caption,media_type,timestamp,like_count,comments_count,permalink,thumbnail_url,media_url";
    const mediaRes = await fetch(`${META_BASE_URL}/${igUserId}/media?fields=${mediaFields}&limit=10&access_token=${accessToken}`);
    const mediaData = await mediaRes.json();
    if (mediaData.data) media = mediaData.data;
  } catch { /* no permission */ }

  // Method B: Via page's instagram_business_account (sometimes works with page token)
  if (media.length === 0 && pageId) {
    try {
      const viaPageRes = await fetch(`${META_BASE_URL}/${pageId}?fields=instagram_business_account{media.limit(10){id,caption,media_type,timestamp,like_count,comments_count,permalink,thumbnail_url}}&access_token=${pageToken}`);
      const viaPageData = await viaPageRes.json();
      if (viaPageData.instagram_business_account?.media?.data) {
        media = viaPageData.instagram_business_account.media.data;
      }
    } catch { /* no permission */ }
  }

  // 3. Try insights
  let insights: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    const insightsRes = await fetch(`${META_BASE_URL}/${igUserId}/insights?metric=impressions,reach,profile_views,follower_count&period=day&since=${Math.floor(Date.now() / 1000) - 86400 * 7}&until=${Math.floor(Date.now() / 1000)}&access_token=${accessToken}`);
    const insightsData = await insightsRes.json();
    if (insightsData.data) insights = insightsData.data;
  } catch { /* no permission */ }

  return {
    followers: profile.followers_count || 0,
    follows: profile.follows_count || 0,
    mediaCount: profile.media_count || 0,
    username: profile.username || "",
    name: profile.name || "",
    biography: profile.biography || "",
    website: profile.website || "",
    profilePicture: profile.profile_picture_url || "",
    // Engagement from media posts
    media: media.map((m: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      id: m.id,
      caption: m.caption?.substring(0, 200),
      mediaType: m.media_type,
      timestamp: m.timestamp,
      likes: m.like_count || 0,
      comments: m.comments_count || 0,
      permalink: m.permalink,
      thumbnail: m.thumbnail_url || m.media_url,
    })),
    // Insights (if available)
    reach: insights?.find((i: any) => i.name === "reach")?.values?.reduce((s: number, v: any) => s + (v.value || 0), 0) || 0, // eslint-disable-line @typescript-eslint/no-explicit-any
    impressions: insights?.find((i: any) => i.name === "impressions")?.values?.reduce((s: number, v: any) => s + (v.value || 0), 0) || 0, // eslint-disable-line @typescript-eslint/no-explicit-any
    profileViews: insights?.find((i: any) => i.name === "profile_views")?.values?.reduce((s: number, v: any) => s + (v.value || 0), 0) || 0, // eslint-disable-line @typescript-eslint/no-explicit-any
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
      data = await getInstagramData(igUserId, accessToken, pageId, pageToken);
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
