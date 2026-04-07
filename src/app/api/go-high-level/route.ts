import { NextResponse } from "next/server";
import { getLocationStats, getContacts, getCampaigns } from "@/lib/api-clients/gohighlevel";

export async function GET() {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;

  if (!apiKey || !locationId) {
    return NextResponse.json({
      platform: "go-high-level",
      status: "mock",
      message: "GHL credentials not configured. Showing mock data.",
    });
  }

  try {
    const stats = await getLocationStats(locationId);
    return NextResponse.json({ platform: "go-high-level", status: "live", data: stats });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("GHL API error:", error.message);
    return NextResponse.json({ platform: "go-high-level", status: "error", error: error.message }, { status: 500 });
  }
}
