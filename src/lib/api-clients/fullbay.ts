// FullBay API client for NHTTR service/repair revenue data.
//
// Auth (per https://gist.github.com/EpikaNick/38f2ac3ee83bd7f84f5f991ffb43e5a1):
//   Each request passes two query params:
//     key   = NHTTR_FULLBAY env value
//     token = sha1(key + todayYmd + publicIP)
// FullBay derives the same token on its end using the caller's outbound IP,
// which must be pre-approved. We prefer a fixed FULLBAY_IP override (static
// egress) and fall back to ipify discovery when not set.

import crypto from "crypto";
import { getCredential } from "@/lib/credential-store";

const FB_BASE_URL = "https://app.fullbay.com/services";

let cachedIP: { ip: string; fetchedAt: number } | null = null;
const IP_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function getPublicIP(): Promise<string> {
  const { value: override } = await getCredential("FULLBAY_IP");
  if (override) return override;
  if (cachedIP && Date.now() - cachedIP.fetchedAt < IP_CACHE_TTL_MS) return cachedIP.ip;
  const r = await fetch("https://api.ipify.org?format=text");
  if (!r.ok) throw new Error(`Failed to resolve outbound IP (ipify ${r.status})`);
  const ip = (await r.text()).trim();
  cachedIP = { ip, fetchedAt: Date.now() };
  return ip;
}

function todayYmd(): string {
  // FullBay expects the server's "today" date. We use UTC; if FullBay is
  // strict on a specific timezone we can swap in Intl.DateTimeFormat.
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function buildAuthParams(): Promise<{ key: string; token: string }> {
  const { value: key } = await getCredential("NHTTR_FULLBAY");
  if (!key) throw new Error("NHTTR_FULLBAY not configured");
  const ip = await getPublicIP();
  const token = crypto.createHash("sha1").update(key + todayYmd() + ip).digest("hex");
  return { key, token };
}

async function callFullbay<T>(endpoint: string, extraParams: Record<string, string>): Promise<T> {
  const auth = await buildAuthParams();
  const params = new URLSearchParams({ ...auth, ...extraParams });
  const url = `${FB_BASE_URL}/${endpoint}?${params}`;
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`FullBay API error ${response.status}: ${body.slice(0, 200)}`);
  }
  return response.json() as Promise<T>;
}

// FullBay caps each date-range query at 7 days. Walk the range in 7-day
// windows and merge the arrays.
function* windowsOf7Days(startDate: string, endDate: string): Generator<{ start: string; end: string }> {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  let cursor = new Date(start);
  while (cursor <= end) {
    const windowEnd = new Date(cursor);
    windowEnd.setUTCDate(windowEnd.getUTCDate() + 6);
    const clampedEnd = windowEnd > end ? end : windowEnd;
    yield {
      start: cursor.toISOString().slice(0, 10),
      end: clampedEnd.toISOString().slice(0, 10),
    };
    cursor = new Date(clampedEnd);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
}

export interface FullbayInvoice {
  invoiceId?: string | number;
  invoiceNumber?: string;
  invoiceDate?: string;
  customer?: string;
  subtotal?: string | number;
  total?: string | number;
  totalAmount?: string | number;
  [key: string]: unknown;
}

export async function getInvoices(startDate: string, endDate: string): Promise<FullbayInvoice[]> {
  const all: FullbayInvoice[] = [];
  for (const w of windowsOf7Days(startDate, endDate)) {
    const chunk = await callFullbay<FullbayInvoice[] | { invoices?: FullbayInvoice[] }>(
      "getInvoices.php",
      { startDate: w.start, endDate: w.end },
    );
    const rows = Array.isArray(chunk) ? chunk : chunk.invoices ?? [];
    all.push(...rows);
  }
  return all;
}

function parseAmount(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[$,]/g, ""));
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

export interface FullbayRevenueSummary {
  period: { start: string; end: string };
  totalRevenue: number;
  invoiceCount: number;
  avgInvoiceValue: number;
  timeSeries: { date: string; value: number }[];
}

export async function getRevenueSummary(startDate: string, endDate: string): Promise<FullbayRevenueSummary> {
  const invoices = await getInvoices(startDate, endDate);
  let totalRevenue = 0;
  const byDate: Record<string, number> = {};

  for (const inv of invoices) {
    const amount = parseAmount(inv.total ?? inv.totalAmount ?? inv.subtotal);
    totalRevenue += amount;
    const date = typeof inv.invoiceDate === "string" ? inv.invoiceDate.slice(0, 10) : "";
    if (date) byDate[date] = (byDate[date] || 0) + amount;
  }

  const timeSeries = Object.entries(byDate)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  return {
    period: { start: startDate, end: endDate },
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    invoiceCount: invoices.length,
    avgInvoiceValue: invoices.length > 0 ? Math.round((totalRevenue / invoices.length) * 100) / 100 : 0,
    timeSeries,
  };
}
