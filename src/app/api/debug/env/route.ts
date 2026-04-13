import { NextResponse } from "next/server";

// TEMPORARY: Check if env vars are loaded
export async function GET() {
  const tok = process.env.META_ACCESS_TOKEN || "";
  const acct = process.env.META_AD_ACCOUNT_ID || "";
  return NextResponse.json({
    metaAccessToken: tok ? `${tok.slice(0, 8)}...${tok.slice(-6)} (len=${tok.length})` : "NOT SET",
    metaAccessTokenHasWhitespace: /^\s|\s$/.test(tok),
    metaAdAccountId: acct || "NOT SET",
    metaAdAccountIdLen: acct.length,
    metaAdAccountIdHasWhitespace: /^\s|\s$/.test(acct),
    metaAdAccountIdCharCodes: Array.from(acct).slice(0, 5).map((c) => c.charCodeAt(0)),
  });
}
