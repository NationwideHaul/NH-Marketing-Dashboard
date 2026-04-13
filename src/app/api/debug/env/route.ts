import { NextResponse } from "next/server";

// TEMPORARY: Reproduce the Meta Ads call and return the URL + response
export async function GET() {
  const tok = (process.env.META_ACCESS_TOKEN || "").trim();
  const acct = (process.env.META_AD_ACCOUNT_ID || "").trim();
  const since = "2026-03-14";
  const until = "2026-04-13";
  const fields = "impressions,clicks,spend,cpc,ctr,reach,actions,cost_per_action_type";
  const timeRange = encodeURIComponent(JSON.stringify({ since, until }));
  const url = `https://graph.facebook.com/v21.0/${acct}/insights?fields=${fields}&time_range=${timeRange}&time_increment=1&access_token=${tok}`;

  let apiResponse = "";
  try {
    const r = await fetch(url);
    apiResponse = `${r.status} ${(await r.text()).slice(0, 500)}`;
  } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    apiResponse = `fetch threw: ${e.message}`;
  }

  return NextResponse.json({
    urlWithoutToken: url.replace(tok, "TOKEN"),
    urlLength: url.length,
    tokenLen: tok.length,
    acctValue: acct,
    acctCharCodes: Array.from(acct).map((c) => c.charCodeAt(0)),
    apiResponse,
  });
}
