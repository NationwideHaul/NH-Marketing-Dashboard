import { NextResponse } from "next/server";

export async function GET() {
  // TODO: Connect to RingCentral API
  return NextResponse.json({
    platform: "ringcentral",
    metrics: {
      totalCalls: 156,
      answered: 132,
      missed: 24,
      avgDuration: 4.2,
      uniqueCallers: 98,
      answerRate: 84.6,
    },
    status: "mock",
  });
}
