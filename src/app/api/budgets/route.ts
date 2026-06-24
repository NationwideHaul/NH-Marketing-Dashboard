import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { BudgetRow } from "@/lib/budget-data";

// Budgets persistence backed by Supabase. Server-side only; this route is
// already gated by the auth middleware. When Supabase isn't configured it
// returns status "unconfigured" so the client falls back to localStorage.

export async function GET(request: NextRequest) {
  const accountId = request.nextUrl.searchParams.get("accountId");
  if (!accountId) return NextResponse.json({ error: "accountId required" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ status: "unconfigured", budgets: null });

  const { data, error } = await supabase
    .from("budgets")
    .select("platform, budget, spent, category")
    .eq("account_id", accountId)
    .order("platform");

  if (error) return NextResponse.json({ status: "error", error: error.message }, { status: 500 });
  return NextResponse.json({ status: "ok", budgets: data });
}

export async function PUT(request: NextRequest) {
  const accountId = request.nextUrl.searchParams.get("accountId");
  if (!accountId) return NextResponse.json({ error: "accountId required" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ status: "unconfigured" }, { status: 503 });

  let body: { budgets?: BudgetRow[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const rows = Array.isArray(body?.budgets) ? body.budgets : [];

  // Replace the account's rows wholesale — matches the client's
  // save-the-whole-array model and handles deleted rows cleanly.
  const del = await supabase.from("budgets").delete().eq("account_id", accountId);
  if (del.error) return NextResponse.json({ status: "error", error: del.error.message }, { status: 500 });

  if (rows.length > 0) {
    const insertRows = rows.map((r) => ({
      account_id: accountId,
      platform: r.platform,
      budget: r.budget,
      spent: r.spent,
      category: r.category,
    }));
    const ins = await supabase.from("budgets").insert(insertRows);
    if (ins.error) return NextResponse.json({ status: "error", error: ins.error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" });
}
