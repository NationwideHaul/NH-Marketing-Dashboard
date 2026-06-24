import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only READ access to the CRM's own Supabase database, so the dashboard
// can read the CRM's clean attribution data directly (deals.brand,
// deals.channel, contacts.lead_source) instead of going through the CRM's
// /api/marketing/summary endpoint, which still reports the old raw
// email_leads.parsed_data.source_platform field.
//
// IMPORTANT: read-only by convention — only SELECT queries belong here. The CRM
// database is owned by the CRM project; the dashboard must never write to it.
// Uses the CRM's SECRET key, so this must stay server-side (the `server-only`
// import turns a client-component import into a build error).
//
// Returns null when env vars aren't configured, so callers can fall back.
let client: SupabaseClient | null | undefined;

export function getCrmSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;

  const url = process.env.CRM_SUPABASE_URL;
  const secret = process.env.CRM_SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    client = null;
    return client;
  }

  client = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export function isCrmSupabaseConfigured(): boolean {
  return Boolean(process.env.CRM_SUPABASE_URL && process.env.CRM_SUPABASE_SECRET_KEY);
}

// Maps the CRM's lead_source slugs (contacts.lead_source) to the dashboard's
// inventory platform names. Slugs that aren't inventory platforms (pipedrive,
// referral, phone-inquiry, etc.) return null and are dropped.
const LEAD_SOURCE_TO_PLATFORM: Record<string, string> = {
  "nfi-website": "NFI Website",
  "nh-website": "NH Website",
  "truckpaper": "TruckPaper",
  "commercialtrucktrader": "Commercial Truck Trader",
  "mylittlesalesman": "My Little Salesman",
  "cherrytrader": "Cherry Trader",
};

export function leadSourceToPlatform(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return LEAD_SOURCE_TO_PLATFORM[slug.toLowerCase().trim()] ?? null;
}

// Human labels for the CRM's lead_source slugs (contacts.lead_source).
const LEAD_SOURCE_LABELS: Record<string, string> = {
  "truckpaper": "TruckPaper",
  "mylittlesalesman": "My Little Salesman",
  "cherrytrader": "Cherry Trader",
  "commercialtrucktrader": "Commercial Truck Trader",
  "nh-website": "NH Website",
  "nfi-website": "NFI Website",
  "google-ads": "Google Ads",
  "meta-ads": "Meta Ads",
  "social-media": "Social Media",
  "referral": "Referral",
  "trade-show": "Trade Show",
  "cold-outreach": "Cold Outreach",
  "email-marketing": "Email Marketing",
  "phone-call": "Phone Call",
  "phone-inquiry": "Phone Inquiry",
  "pipedrive": "Pipedrive",
  "other": "Other",
};

export function leadSourceLabel(slug: string | null | undefined): string {
  const s = (slug ?? "").toLowerCase().trim();
  if (!s) return "Direct/Other";
  if (LEAD_SOURCE_LABELS[s]) return LEAD_SOURCE_LABELS[s];
  // Fallback: title-case the slug (e.g. "some-source" → "Some Source")
  return s.split(/[-_\s]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// Human labels for the CRM's deal.channel slugs.
const CHANNEL_LABELS: Record<string, string> = {
  "phone-call": "Phone Call",
  "info-submit": "Info Submit",
  "manual": "Manual",
};

export function channelLabel(slug: string | null | undefined): string {
  const s = (slug ?? "").toLowerCase().trim();
  return CHANNEL_LABELS[s] ?? (s ? s : "Unknown");
}
