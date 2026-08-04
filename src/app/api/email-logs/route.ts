import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

// Manual email-marketing stats persistence, backed by the dashboard's Supabase.
// Server-side only; gated by the auth middleware. Returns status "unconfigured"
// so the client falls back to localStorage when Supabase isn't set up.
//
// Wire shape (client): { "YYYY-MM": { delivered, opened, clicked, replied,
// bounced, unsubscribed, spamComplaints } }. DB uses spam_complaints.

type EmailLog = {
  delivered: number; opened: number; clicked: number; replied: number;
  bounced: number; unsubscribed: number; spamComplaints: number;
};

export async function GET(request: NextRequest) {
  const accountId = request.nextUrl.searchParams.get("accountId");
  if (!accountId) return NextResponse.json({ error: "accountId required" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ status: "unconfigured", logs: null });

  const { data, error } = await supabase
    .from("email_logs")
    .select("month, delivered, opened, clicked, replied, bounced, unsubscribed, spam_complaints")
    .eq("account_id", accountId);

  if (error) return NextResponse.json({ status: "error", error: error.message }, { status: 500 });

  const logs: Record<string, EmailLog> = {};
  for (const r of data ?? []) {
    logs[r.month] = {
      delivered: r.delivered, opened: r.opened, clicked: r.clicked, replied: r.replied,
      bounced: r.bounced, unsubscribed: r.unsubscribed, spamComplaints: r.spam_complaints,
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

  // Replace the account's rows wholesale.
  const del = await supabase.from("email_logs").delete().eq("account_id", accountId);
  if (del.error) return NextResponse.json({ status: "error", error: del.error.message }, { status: 500 });

  const rows = Object.entries(logs).map(([month, m]) => ({
    account_id: accountId,
    month,
    delivered: m.delivered ?? 0,
    opened: m.opened ?? 0,
    clicked: m.clicked ?? 0,
    replied: m.replied ?? 0,
    bounced: m.bounced ?? 0,
    unsubscribed: m.unsubscribed ?? 0,
    spam_complaints: m.spamComplaints ?? 0,
  }));
  if (rows.length > 0) {
    const ins = await supabase.from("email_logs").insert(rows);
    if (ins.error) return NextResponse.json({ status: "error", error: ins.error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" });
}
