// Server-only credential store.
//
// Reads: KV first, Vercel env var fallback. If KV is not configured, acts as a
// pass-through to process.env — dashboard keeps working exactly like before.
//
// Writes: only to KV. process.env is immutable and untouched.
//
// Graceful degradation: if the Upstash env vars are missing, `isKvEnabled()`
// returns false and all write operations throw a typed error with a clear
// setup message.

import { Redis } from "@upstash/redis";

const KEY_PREFIX = "cred:";

let cachedClient: Redis | null = null;
let kvChecked = false;
let kvEnabled = false;

function detectKv(): Redis | null {
  if (kvChecked) return cachedClient;
  kvChecked = true;

  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    "";
  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    "";

  if (!url.trim() || !token.trim()) {
    kvEnabled = false;
    cachedClient = null;
    return null;
  }

  try {
    cachedClient = new Redis({ url: url.trim(), token: token.trim() });
    kvEnabled = true;
    return cachedClient;
  } catch {
    kvEnabled = false;
    cachedClient = null;
    return null;
  }
}

export function isKvEnabled(): boolean {
  detectKv();
  return kvEnabled;
}

export class KvNotConfiguredError extends Error {
  constructor() {
    super(
      "Credential editing requires a KV store. Create an Upstash Redis database in Vercel → Storage and link it to this project."
    );
    this.name = "KvNotConfiguredError";
  }
}

function trim(v: string | undefined): string {
  return typeof v === "string" ? v.trim() : "";
}

export type CredentialSource = "kv" | "env" | "missing";

export interface ResolvedCredential {
  value: string;
  source: CredentialSource;
}

/**
 * Resolve a credential by env var name.
 * Order: KV override (set from Settings UI) → process.env (Vercel env var).
 */
export async function getCredential(envVarName: string): Promise<ResolvedCredential> {
  const client = detectKv();
  if (client) {
    try {
      const kvValue = await client.get<string>(`${KEY_PREFIX}${envVarName}`);
      if (kvValue && typeof kvValue === "string" && kvValue.trim()) {
        return { value: kvValue.trim(), source: "kv" };
      }
    } catch (err) {
      // If KV read fails, silently fall back to env so the dashboard keeps
      // running. Logged once; callers shouldn't need to handle this.
      console.warn(`[credential-store] KV read failed for ${envVarName}:`, (err as Error).message);
    }
  }

  const envValue = trim(process.env[envVarName]);
  if (envValue) return { value: envValue, source: "env" };

  return { value: "", source: "missing" };
}

/**
 * Batch lookup — useful for the Settings status endpoint.
 */
export async function getCredentials(
  envVarNames: string[]
): Promise<Record<string, ResolvedCredential>> {
  const entries = await Promise.all(
    envVarNames.map(async (name) => [name, await getCredential(name)] as const)
  );
  return Object.fromEntries(entries);
}

/**
 * Resolve the FIRST env var name that produces a value (KV or env).
 * Used for per-account fallbacks (e.g. GHL_API_KEY → GHL_API_KEY_NATIONWIDE_HAUL).
 */
export async function getCredentialFromList(
  envVarNames: string[]
): Promise<ResolvedCredential & { matchedEnvVar?: string }> {
  for (const name of envVarNames) {
    const r = await getCredential(name);
    if (r.source !== "missing") return { ...r, matchedEnvVar: name };
  }
  return { value: "", source: "missing" };
}

/**
 * Save a credential to KV. Does not touch process.env.
 * Throws KvNotConfiguredError if KV isn't set up.
 */
export async function setCredential(envVarName: string, value: string): Promise<void> {
  const client = detectKv();
  if (!client) throw new KvNotConfiguredError();
  const trimmed = value.trim();
  if (!trimmed) {
    await client.del(`${KEY_PREFIX}${envVarName}`);
    return;
  }
  await client.set(`${KEY_PREFIX}${envVarName}`, trimmed);
}

/**
 * Remove a KV override, causing reads to fall back to process.env.
 * Throws KvNotConfiguredError if KV isn't set up.
 */
export async function deleteCredential(envVarName: string): Promise<void> {
  const client = detectKv();
  if (!client) throw new KvNotConfiguredError();
  await client.del(`${KEY_PREFIX}${envVarName}`);
}

/**
 * Bulk delete — used by the Disconnect action to clear every credential
 * belonging to a connection at once.
 */
export async function deleteCredentials(envVarNames: string[]): Promise<void> {
  const client = detectKv();
  if (!client) throw new KvNotConfiguredError();
  if (envVarNames.length === 0) return;
  await client.del(...envVarNames.map((n) => `${KEY_PREFIX}${n}`));
}

/**
 * Synchronous env lookup, for callers that can't yet be made async.
 * Does NOT consult KV. Used as a bridge while hot-path API clients still read
 * env vars directly.
 */
export function getEnvSync(envVarName: string): string {
  return trim(process.env[envVarName]);
}
