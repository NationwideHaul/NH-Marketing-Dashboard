import { NextRequest, NextResponse } from "next/server";
import { brandForAccount } from "@/lib/api-clients/nationwide-haul-crm";
import { getCrmSupabase, leadSourceToPlatform } from "@/lib/supabase-crm";
import { format, subMonths, parseISO, eachMonthOfInterval } from "date-fns";

/**
 * GET /api/inventory-platform-leads?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&accountId=...
 *
 * Reads info-submit counts per inventory platform DIRECTLY from the CRM's
 * Supabase, using the clean attribution columns:
 *   - deals.brand     → which line of business (NFI vs NH)
 *   - deals.channel    → 'info-submit' is the true "info submit" axis
 *   - contacts.lead_source → the clean first-touch source ("nfi-website", …)
 *
 * This replaces the old path through the CRM's /api/marketing/summary endpoint,
 * which reported the stale raw email_leads.parsed_data.source_platform field and
 * never exposed channel. Returns monthly buckets of { platform: count }.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const endDateStr = searchParams.get("endDate") || format(new Date(), "yyyy-MM-dd");
  const startDateStr = searchParams.get("startDate") || format(subMonths(new Date(), 6), "yyyy-MM-dd");
  const brand = brandForAccount(searchParams.get("accountId"));

  const supabase = getCrmSupabase();
  if (!supabase) {
    return NextResponse.json({ status: "error", message: "CRM Supabase not configured.", data: null });
  }
  if (!brand) {
    // Only NFI / NH segment by brand; nothing to read for other accounts.
    return NextResponse.json({ status: "live", data: [] });
  }

  try {
    const startDate = parseISO(startDateStr);
    const endDate = parseISO(endDateStr);

    // Pull every info-submit deal for this brand in range, with its contact's
    // clean lead source. One query, then bucket by month in JS.
    const { data, error } = await supabase
      .from("deals")
      .select("created_at, contact:contacts(lead_source)")
      .eq("brand", brand)
      .eq("channel", "info-submit")
      .gte("created_at", `${startDateStr}T00:00:00Z`)
      .lte("created_at", `${endDateStr}T23:59:59Z`);

    if (error) throw new Error(error.message);

    // monthKey (yyyy-MM) → { platform: count }
    const byMonth: Record<string, Record<string, number>> = {};
    const debug = searchParams.get("debug") === "1";
    const sourcesSeen: Record<string, number> = {};

    for (const row of (data ?? []) as Array<{ created_at: string; contact: { lead_source: string | null } | { lead_source: string | null }[] | null }>) {
      const c = Array.isArray(row.contact) ? row.contact[0] : row.contact;
      const slug = c?.lead_source ?? null;
      if (debug && slug) sourcesSeen[slug] = (sourcesSeen[slug] || 0) + 1;
      const platform = leadSourceToPlatform(slug);
      if (!platform) continue;
      const monthKey = (row.created_at || "").slice(0, 7); // yyyy-MM
      if (!monthKey) continue;
      (byMonth[monthKey] ??= {})[platform] = (byMonth[monthKey][platform] ?? 0) + 1;
    }

    // Emit one entry per calendar month in range (so the chart has stable buckets).
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    const result = months.map((m) => {
      const monthKey = format(m, "yyyy-MM");
      return {
        month: format(m, "MMM yy"),
        monthKey,
        byPlatform: byMonth[monthKey] ?? {},
      };
    });

    return NextResponse.json({
      status: "live",
      data: result,
      ...(debug ? { debug: { sourcesSeen } } : {}),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Inventory platform leads (CRM direct) error:", message);
    return NextResponse.json({ status: "error", error: message, data: null }, { status: 500 });
  }
}
