import { NextResponse } from "next/server";

export async function GET() {
  // TODO: Connect to Go High Level API
  return NextResponse.json({
    platform: "go-high-level",
    metrics: {
      emailsSent: 4200,
      openRate: 24.8,
      clickRate: 3.6,
      bounces: 42,
      unsubscribes: 8,
      newContacts: 156,
    },
    status: "mock",
  });
}
