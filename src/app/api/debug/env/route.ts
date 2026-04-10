import { NextResponse } from "next/server";

// TEMPORARY: Check if env vars are loaded
export async function GET() {
  return NextResponse.json({
    dashboardEmail: process.env.DASHBOARD_EMAIL ? "SET: " + process.env.DASHBOARD_EMAIL : "NOT SET",
    dashboardPassword: process.env.DASHBOARD_PASSWORD ? "SET (" + process.env.DASHBOARD_PASSWORD.length + " chars)" : "NOT SET",
  });
}
