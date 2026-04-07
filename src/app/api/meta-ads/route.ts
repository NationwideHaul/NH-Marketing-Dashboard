import { NextRequest, NextResponse } from "next/server";
import {
  getMetaAdsCampaigns,
  getMetaAdsAccountInsights,
  getFacebookPageInsights,
  getFacebookPageData,
  getInstagramInsights,
  getInstagramProfile,
  getInstagramMedia,
} from "@/lib/api-clients/meta";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "ads"; // ads | facebook | instagram | ig-profile | ig-media
  const since = searchParams.get("since") || "";
  const until = searchParams.get("until") || "";

  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({
      platform: "meta",
      status: "mock",
      message: "META_ACCESS_TOKEN not configured. Showing mock data.",
    });
  }

  try {
    let data;

    if (type === "ads") {
      const adAccountId = process.env.META_AD_ACCOUNT_ID || "";
      data = await getMetaAdsAccountInsights(adAccountId, accessToken, since, until);
    } else if (type === "campaigns") {
      const adAccountId = process.env.META_AD_ACCOUNT_ID || "";
      data = await getMetaAdsCampaigns(adAccountId, accessToken, since, until);
    } else if (type === "facebook") {
      const pageId = process.env.META_PAGE_ID || "me";
      data = await getFacebookPageInsights(pageId, accessToken, since, until);
    } else if (type === "facebook-page") {
      const pageId = process.env.META_PAGE_ID || "me";
      data = await getFacebookPageData(pageId, accessToken);
    } else if (type === "instagram") {
      const igUserId = process.env.META_IG_USER_ID || "";
      data = await getInstagramInsights(igUserId, accessToken, since, until);
    } else if (type === "ig-profile") {
      const igUserId = process.env.META_IG_USER_ID || "";
      data = await getInstagramProfile(igUserId, accessToken);
    } else if (type === "ig-media") {
      const igUserId = process.env.META_IG_USER_ID || "";
      data = await getInstagramMedia(igUserId, accessToken);
    }

    return NextResponse.json({ platform: "meta", status: "live", data });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("Meta API error:", error.message);
    return NextResponse.json({ platform: "meta", status: "error", error: error.message }, { status: 500 });
  }
}
