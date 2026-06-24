import "server-only";
import { format, differenceInCalendarDays, subDays, eachDayOfInterval, parseISO } from "date-fns";
import { getCrmSupabase, leadSourceLabel, channelLabel } from "@/lib/supabase-crm";
import type { CRMSummaryResponse, CRMBrand } from "@/lib/api-clients/nationwide-haul-crm";

// Builds the CRMSummaryResponse the dashboard expects, but DIRECTLY from the
// CRM's Supabase (deals + contacts), so the numbers match the CRM exactly:
//   - leads          → deals in range (a routed deal = a lead)
//   - leads.bySource → grouped by contacts.lead_source (clean labels)
//   - leads.byType   → grouped by deals.channel (Phone Call / Info Submit / Manual)
//   - deals          → status='won' = closed-won, sum(value) = revenue
//   - funnel         → status-based approximation (no explicit MQL/SQL in the CRM)
// Read-only: only SELECTs against the CRM DB.

type DealRow = {
  created_at: string;
  status: string | null;
  value: number | null;
  channel: string | null;
  contact: { lead_source: string | null } | { lead_source: string | null }[] | null;
};

function leadSourceOf(row: DealRow): string | null {
  const c = Array.isArray(row.contact) ? row.contact[0] : row.contact;
  return c?.lead_source ?? null;
}

async function fetchDeals(
  start: string,
  end: string,
  brand: CRMBrand | undefined,
): Promise<DealRow[]> {
  const supabase = getCrmSupabase();
  if (!supabase) throw new Error("CRM Supabase not configured");
  let q = supabase
    .from("deals")
    .select("created_at, status, value, channel, contact:contacts(lead_source)")
    .gte("created_at", `${start}T00:00:00Z`)
    .lte("created_at", `${end}T23:59:59Z`);
  if (brand) q = q.eq("brand", brand);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as DealRow[];
}

function dealStats(rows: DealRow[]) {
  const won = rows.filter((r) => r.status === "won");
  const revenue = won.reduce((s, r) => s + Number(r.value ?? 0), 0);
  return { total: rows.length, closedWon: won.length, revenue };
}

export async function getCrmSummaryDirect(
  startDate: string,
  endDate: string,
  brand?: CRMBrand,
): Promise<CRMSummaryResponse> {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const days = Math.max(differenceInCalendarDays(end, start), 0) + 1;
  const prevEnd = subDays(start, 1);
  const prevStart = subDays(prevEnd, days - 1);
  const prevStartStr = format(prevStart, "yyyy-MM-dd");
  const prevEndStr = format(prevEnd, "yyyy-MM-dd");

  const [rows, prevRows] = await Promise.all([
    fetchDeals(startDate, endDate, brand),
    fetchDeals(prevStartStr, prevEndStr, brand),
  ]);

  // ---- leads (a routed deal = a lead) ----
  const bySource: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const byDay: Record<string, number> = {};
  for (const r of rows) {
    const src = leadSourceLabel(leadSourceOf(r));
    bySource[src] = (bySource[src] ?? 0) + 1;
    const type = channelLabel(r.channel);
    byType[type] = (byType[type] ?? 0) + 1;
    const day = (r.created_at || "").slice(0, 10);
    if (day) byDay[day] = (byDay[day] ?? 0) + 1;
  }
  // Dense daily series across the range (fill gaps with 0).
  const leadsTimeSeries = eachDayOfInterval({ start, end }).map((d) => {
    const key = format(d, "yyyy-MM-dd");
    return { date: key, value: byDay[key] ?? 0 };
  });

  const total = rows.length;
  const previousTotal = prevRows.length;
  const changePercent = previousTotal > 0 ? Math.round(((total - previousTotal) / previousTotal) * 1000) / 10 : null;

  // ---- deals / revenue ----
  const cur = dealStats(rows);
  const prev = dealStats(prevRows);
  const avgDealValue = cur.closedWon > 0 ? Math.round(cur.revenue / cur.closedWon) : 0;
  const closeRate = cur.total > 0 ? Math.round((cur.closedWon / cur.total) * 1000) / 10 / 100 : 0; // fraction (page multiplies ×100)
  const revenueChangePercent = prev.revenue > 0 ? Math.round(((cur.revenue - prev.revenue) / prev.revenue) * 1000) / 10 : null;

  // Revenue-by-day from won deals.
  const revByDay: Record<string, number> = {};
  for (const r of rows) {
    if (r.status !== "won") continue;
    const day = (r.created_at || "").slice(0, 10);
    if (day) revByDay[day] = (revByDay[day] ?? 0) + Number(r.value ?? 0);
  }
  const dealsTimeSeries = eachDayOfInterval({ start, end })
    .map((d) => format(d, "yyyy-MM-dd"))
    .filter((k) => revByDay[k] !== undefined)
    .map((k) => ({ date: k, value: revByDay[k] }));

  // ---- funnel (status-based; the CRM has no explicit MQL/SQL) ----
  const lost = rows.filter((r) => r.status === "lost").length;
  const mql = total - lost;        // made it past disqualification
  const closedDeals = cur.closedWon;
  const sql = closedDeals;          // reached closing (proxy)

  return {
    period: { start: startDate, end: endDate, days },
    leads: {
      total,
      previousTotal,
      changePercent: changePercent ?? 0,
      bySource,
      byType,
      byEquipmentType: {}, // not derived here (equipment lives in deal tags)
      timeSeries: leadsTimeSeries,
    },
    deals: {
      total: cur.total,
      closedWon: cur.closedWon,
      totalRevenue: cur.revenue,
      avgDealValue,
      closeRate,
      previousClosedWon: prev.closedWon,
      previousRevenue: prev.revenue,
      revenueChangePercent: revenueChangePercent ?? 0,
      timeSeries: dealsTimeSeries,
    },
    funnel: {
      totalLeads: total,
      mql,
      sql,
      closedDeals,
    },
  };
}
