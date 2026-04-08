import { NextRequest, NextResponse } from "next/server";
import { getMetaAdsCampaigns, getMetaAdsAccountInsights, getFacebookPageInsights, getFacebookPageData, getInstagramInsights, getInstagramProfile, getInstagramMedia } from "@/lib/api-clients/meta";
import { getAccountCredentials } from "@/lib/account-credentials";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "ads";
  const since = searchParams.get("since") || "";
  const until = searchParams.get("until") || "";
  const accountId = searchParams.get("accountId") || "nationwide-haul";

  const creds = getAccountCredentials(accountId);
  const accessToken = creds.metaAccessToken;

  if (!accessToken) {
    return NextResponse.json({ platform: "meta", status: "error", error: `Meta not configured for account: ${accountId}` });
  }

  try {
    let data;
    if (type === "ads" || type === "campaigns") {
      const adAccountId = creds.metaAdAccountId || "";
      data = type === "campaigns"
        ? await getMetaAdsCampaigns(adAccountId, accessToken, since, until)
        : await getMetaAdsAccountInsights(adAccountId, accessToken, since, until);
    } else if (type === "facebook") {
      data = await getFacebookPageInsights(creds.metaPageId || "me", accessToken, since, until);
    } else if (type === "facebook-page") {
      data = await getFacebookPageData(creds.metaPageId || "me", accessToken);
    } else if (type === "instagram") {
      data = await getInstagramInsights(creds.metaIgUserId || "", accessToken, since, until);
    } else if (type === "ig-profile") {
      data = await getInstagramProfile(creds.metaIgUserId || "", accessToken);
    } else if (type === "ig-media") {
      data = await getInstagramMedia(creds.metaIgUserId || "", accessToken);
    }
    return NextResponse.json({ platform: "meta", status: "live", accountId, data });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    return NextResponse.json({ platform: "meta", status: "error", error: error.message }, { status: 500 });
  }
}
