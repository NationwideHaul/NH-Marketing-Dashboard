import { NextRequest, NextResponse } from "next/server";
import {
  getConnectionStatuses,
  getPerAccountConnectionStatuses,
  isKvEnabled,
} from "@/lib/connections";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("accountId") || "";
  const [global, perAccount] = await Promise.all([
    getConnectionStatuses(),
    accountId ? getPerAccountConnectionStatuses(accountId) : Promise.resolve([]),
  ]);
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    kvEnabled: isKvEnabled(),
    accountId,
    connections: global,
    perAccount,
  });
}
