import { NextResponse } from "next/server";

export async function GET() {
  // TODO: Connect to LinkedIn Marketing API
  return NextResponse.json({
    platform: "linkedin",
    metrics: {
      impressions: 55000,
      clicks: 1400,
      ctr: 2.55,
      followers: 245,
      adSpend: 4050,
      leads: 38,
    },
    status: "mock",
  });
}
