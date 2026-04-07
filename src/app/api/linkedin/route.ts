import { NextRequest, NextResponse } from "next/server";
import { getOrganization, getFollowerStats, getPageStats } from "@/lib/api-clients/linkedin";

export async function GET(request: NextRequest) {
  const orgId = process.env.LINKEDIN_ORGANIZATION_ID;

  if (!process.env.LINKEDIN_ACCESS_TOKEN || !orgId) {
    return NextResponse.json({
      platform: "linkedin",
      status: "mock",
      message: "LinkedIn credentials not configured. Showing mock data.",
    });
  }

  try {
    const [org, followers] = await Promise.all([
      getOrganization(orgId),
      getFollowerStats(orgId),
    ]);

    return NextResponse.json({
      platform: "linkedin",
      status: "live",
      data: { organization: org, followers },
    });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("LinkedIn API error:", error.message);
    return NextResponse.json({ platform: "linkedin", status: "error", error: error.message }, { status: 500 });
  }
}
