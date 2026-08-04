import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

// Manual email-marketing RATES persistence (open/click/reply/bounce rate as %),
// backed by the dashboard's Supabase. Server-side only; gated by auth middleware.
// Returns status "unconfigured" so the client falls back to localStorage.
//
// Wire shape (client): { "YYYY-MM": { openRate, clickRate, replyRate, bounceRate } }.

type EmailLog = { openRate: number; clickRate: number; replyRate: number; bounceRate: number };

export async function GET(request: NextRequest) {
  const accountId = request.nextUrl.searchParams.get("accountId");
  if (!accountId) return NextResponse.json({ error: "accountId required" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ status: "unconfigured", logs: null });

  const { data, error } = await supabase
    .from("email_logs")
    .select("month, open_rate, click_rate, reply_rate, bounce_rate")
    .eq("account_id", accountId);

  if (error) return NextResponse.json({ status: "error", error: error.message }, { status: 500 });

  const logs: Record<string, EmailLog> = {};
  for (const r of data ?? []) {
    logs[r.month] = {
      openRate: r.open_rate, clickRate: r.click_rate, replyRate: r.reply_rate, bounceRate: r.bounce_rate,
    };
  }
  return NextResponse.json({ status: "ok", logs });
}

export async function PUT(request: NextRequest) {
  const accountId = request.nextUrl.searchParams.get("accountId");
  if (!accountId) return NextResponse.json({ error: "accountId required" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ status: "unconfigured" }, { status: 503 });

  let body: { logs?: Record<string, EmailLog> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const logs = body?.logs ?? {};

  const del = await supabase.from("email_logs").delete().eq("account_id", accountId);
  if (del.error) return NextResponse.json({ status: "error", error: del.error.message }, { status: 500 });

  const rows = Object.entries(logs).map(([month, m]) => ({
    account_id: accountId,
    month,
    open_rate: m.openRate ?? 0,
    click_rate: m.clickRate ?? 0,
    reply_rate: m.replyRate ?? 0,
    bounce_rate: m.bounceRate ?? 0,
  }));
  if (rows.length > 0) {
    const ins = await supabase.from("email_logs").insert(rows);
    if (ins.error) return NextResponse.json({ status: "error", error: ins.error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" });
}
