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
