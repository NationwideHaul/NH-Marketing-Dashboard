import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// TEMPORARY: Get the current Google refresh token to store it permanently
// DELETE THIS FILE after getting the token
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" });
  }
  return NextResponse.json({
    hasAccessToken: !!session.accessToken,
    hasRefreshToken: !!(session as any).refreshToken, // eslint-disable-line @typescript-eslint/no-explicit-any
    refreshToken: (session as any).refreshToken, // eslint-disable-line @typescript-eslint/no-explicit-any
  });
}
