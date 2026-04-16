import { NextResponse } from "next/server";
import { getConnectionStatuses, isKvEnabled } from "@/lib/connections";

export const dynamic = "force-dynamic";

export async function GET() {
  const statuses = await getConnectionStatuses();
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    kvEnabled: isKvEnabled(),
    connections: statuses,
  });
}
