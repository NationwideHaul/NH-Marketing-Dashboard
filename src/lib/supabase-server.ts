import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client for the dashboard's own editable data
// (budgets, etc.). Uses the SECRET key, so it must never be imported into a
// client component — the `server-only` guard above turns that into a build
// error. All Supabase access goes through API routes that are already gated by
// the auth middleware, so the secret key never reaches the browser.
//
// Returns null when env vars aren't configured, so callers can gracefully fall
// back to localStorage and the app keeps working without Supabase.
let client: SupabaseClient | null | undefined;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (client !== undefined) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    client = null;
    return client;
  }

  client = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}
