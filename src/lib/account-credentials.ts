// Server-side account credentials mapping
// This file is ONLY used in API routes (server-side)
// Each account has its own set of API credentials
//
// Resolution order for every string field:
//   1. Per-account KV override   (cred:account:<accountId>:<field>)
//   2. Global KV override        (cred:<ENV_VAR>)
//   3. Per-account env var       (e.g. GHL_API_KEY_NATIONWIDE_HAUL)
//   4. Global env var            (e.g. GHL_API_KEY)
//   5. Hardcoded static default  (in STATIC_CREDENTIALS below)

import { getAccountCredential, getCredential } from "@/lib/credential-store";

function trimEnv(key: string): string {
  const v = process.env[key];
  return typeof v === "string" ? v.trim() : "";
}

export interface GMBLocation {
  id: string;
  name: string;
  address: string;
  verified: boolean;
}

export interface AccountCredentials {
  ga4PropertyId?: string;
  googleAdsCustomerId?: string;
  googleAdsDeveloperToken?: string;
  callrailCompanyName?: string;
  callrailCompanyId?: string;
  ghlLocationId?: string;
  ghlApiKey?: string;
  metaAdAccountId?: string;
  metaAccessToken?: string;
  metaPageId?: string;
  metaIgUserId?: string;
  youtubeChannelId?: string;
  ringcentralEnabled?: boolean;
  gmbLocations?: GMBLocation[];
}

// Static data — hardcoded defaults per account. Resolution falls back to these
// when neither KV nor env vars provide a value.
interface StaticAccountCredentials extends AccountCredentials {
  /** Env var suffix for per-account GHL API key, e.g. "NATIONWIDE_HAUL" */
  ghlApiKeyEnvSuffix?: string;
}

const STATIC_CREDENTIALS: Record<string, StaticAccountCredentials> = {
  "nationwide-haul": {
    ga4PropertyId: "333711970",
    googleAdsCustomerId: "4504773990",
    callrailCompanyName: "Nationwide Haul",
    callrailCompanyId: "901305667",
    ghlLocationId: "IEs4Gwg925sPu0AYNpdS",
    ghlApiKeyEnvSuffix: "NATIONWIDE_HAUL",
    youtubeChannelId: "UCjWMfLksDwfwVA-u3xkhnhg",
    metaAdAccountId: "act_233729070644721",
    metaPageId: "183569358434902",
    metaIgUserId: "17841401172603723",
    ringcentralEnabled: true,
  },
  "nfi-truck-sales": {
    ga4PropertyId: "354503352",
    googleAdsCustomerId: "4307362539",
    callrailCompanyName: "NFI Truck Sales",
    callrailCompanyId: "182573673",
    ghlLocationId: "bQFOVHhca9fD7V3faeS1",
    ghlApiKeyEnvSuffix: "NFI",
    ringcentralEnabled: true,
  },
  "nhttr": {
    // Default to RV — toggle handled by subService param
    ga4PropertyId: "528221425",
    googleAdsCustomerId: "1073209892",
    callrailCompanyName: "NH Repair Shops",
    callrailCompanyId: "682402393",
    ringcentralEnabled: true,
    gmbLocations: [
      {
        id: "0871542938401481844",
        name: "Nationwide Haul - RV & Bus Repair & Service",
        address: "5021 Frontage Rd N, Suite RV, Lakeland, FL 33810",
        verified: false,
      },
      {
        id: "16514751471730111176",
        name: "Nationwide Haul - Truck & Trailer Repair",
        address: "5021 Frontage Rd N, Suite Shop, Lakeland, FL 33810",
        verified: true,
      },
    ],
  },
  "nhttr-rv": {
    ga4PropertyId: "528221425",
    googleAdsCustomerId: "1073209892",
    callrailCompanyName: "NH Repair Shops",
    callrailCompanyId: "682402393",
    ringcentralEnabled: true,
    gmbLocations: [
      {
        id: "0871542938401481844",
        name: "Nationwide Haul - RV & Bus Repair & Service",
        address: "5021 Frontage Rd N, Suite RV, Lakeland, FL 33810",
        verified: false,
      },
    ],
  },
  "nhttr-ttr": {
    ga4PropertyId: "528269534",
    googleAdsCustomerId: "6515085474",
    callrailCompanyName: "NH Repair Shops",
    callrailCompanyId: "682402393",
    ringcentralEnabled: true,
    gmbLocations: [
      {
        id: "16514751471730111176",
        name: "Nationwide Haul - Truck & Trailer Repair",
        address: "5021 Frontage Rd N, Suite Shop, Lakeland, FL 33810",
        verified: true,
      },
    ],
  },
  "road-ready": {
    ga4PropertyId: "350112166",
    googleAdsCustomerId: "1866416925",
    callrailCompanyName: "Complete Carrier Coverage/Road Ready",
    callrailCompanyId: "753432103",
    ghlLocationId: "PEN2IZLLlQwf1PpQJhyx",
    ghlApiKeyEnvSuffix: "ROAD_READY",
    metaAdAccountId: "act_614568808074594",
    metaPageId: "109737194149629",
    metaIgUserId: "17841438963053106",
  },
};

/** Per-account resolver: KV(account:field) → fallbackValue. */
async function resolvePerAccount(
  accountId: string,
  field: keyof AccountCredentials,
  fallbackValue?: string
): Promise<string | undefined> {
  const r = await getAccountCredential(accountId, field as string, {
    fallbackValue,
  });
  return r.value || undefined;
}

/** Global env var resolver: KV(envVar) → process.env[envVar]. */
async function resolveGlobalEnv(envVar: string): Promise<string | undefined> {
  const r = await getCredential(envVar);
  return r.value || undefined;
}

/**
 * Resolves a field that has BOTH a per-account KV path and a global env var
 * fallback.
 *
 * Resolution order:
 *   1. KV per-account override  — user-edited value in Settings UI
 *   2. Hardcoded per-account value (staticCreds) — explicit per-account default
 *   3. Global env var (e.g. META_AD_ACCOUNT_ID)
 *
 * NOTE: per-account static wins over global env. A global env var like
 * META_AD_ACCOUNT_ID must NOT leak NH's ad account into Road Ready or any
 * other sub-account that has its own baked-in value.
 */
async function resolveBoth(
  accountId: string,
  field: keyof AccountCredentials,
  globalEnvVar: string,
  hardcodedFallback?: string
): Promise<string | undefined> {
  const perAcct = await getAccountCredential(accountId, field as string);
  if (perAcct.source !== "missing") return perAcct.value;
  if (hardcodedFallback && hardcodedFallback.trim()) return hardcodedFallback.trim();
  const globalVal = await resolveGlobalEnv(globalEnvVar);
  return globalVal || undefined;
}

export async function getAccountCredentials(
  accountId: string
): Promise<AccountCredentials> {
  const staticCreds =
    STATIC_CREDENTIALS[accountId] || STATIC_CREDENTIALS["nationwide-haul"];

  // Resolve GHL API key — per-account KV → per-account env (GHL_API_KEY_*) → global GHL_API_KEY
  const ghlApiKey = await (async (): Promise<string | undefined> => {
    const perAcct = await getAccountCredential(accountId, "ghlApiKey");
    if (perAcct.source !== "missing") return perAcct.value;
    if (staticCreds.ghlApiKeyEnvSuffix) {
      const perAcctEnvKey = `GHL_API_KEY_${staticCreds.ghlApiKeyEnvSuffix}`;
      const v = await resolveGlobalEnv(perAcctEnvKey);
      if (v) return v;
    }
    const globalV = await resolveGlobalEnv("GHL_API_KEY");
    return globalV || undefined;
  })();

  const [
    ga4PropertyId,
    googleAdsCustomerId,
    googleAdsDeveloperToken,
    callrailCompanyName,
    callrailCompanyId,
    ghlLocationId,
    metaAdAccountId,
    metaAccessToken,
    metaPageId,
    metaIgUserId,
    youtubeChannelId,
  ] = await Promise.all([
    resolvePerAccount(accountId, "ga4PropertyId", staticCreds.ga4PropertyId),
    resolvePerAccount(accountId, "googleAdsCustomerId", staticCreds.googleAdsCustomerId),
    resolveGlobalEnv("GOOGLE_ADS_DEVELOPER_TOKEN"),
    resolvePerAccount(accountId, "callrailCompanyName", staticCreds.callrailCompanyName),
    resolvePerAccount(accountId, "callrailCompanyId", staticCreds.callrailCompanyId),
    resolveBoth(accountId, "ghlLocationId", "GHL_LOCATION_ID", staticCreds.ghlLocationId),
    resolveBoth(accountId, "metaAdAccountId", "META_AD_ACCOUNT_ID", staticCreds.metaAdAccountId),
    resolveGlobalEnv("META_ACCESS_TOKEN"),
    resolveBoth(accountId, "metaPageId", "META_PAGE_ID", staticCreds.metaPageId),
    resolveBoth(accountId, "metaIgUserId", "META_IG_USER_ID", staticCreds.metaIgUserId),
    resolvePerAccount(accountId, "youtubeChannelId", staticCreds.youtubeChannelId),
  ]);

  return {
    ga4PropertyId,
    googleAdsCustomerId,
    googleAdsDeveloperToken,
    callrailCompanyName,
    callrailCompanyId,
    ghlLocationId,
    ghlApiKey,
    metaAdAccountId,
    metaAccessToken,
    metaPageId,
    metaIgUserId,
    youtubeChannelId,
    ringcentralEnabled: staticCreds.ringcentralEnabled,
    gmbLocations: staticCreds.gmbLocations,
  };
}

/**
 * Synchronous, env+static only. For the Settings status page and other
 * read-only callers that can't yet be made async. Does NOT consult KV.
 */
export function getAccountCredentialsSync(accountId: string): AccountCredentials {
  const staticCreds =
    STATIC_CREDENTIALS[accountId] || STATIC_CREDENTIALS["nationwide-haul"];
  const ghlKeyFromPerAcctEnv = staticCreds.ghlApiKeyEnvSuffix
    ? trimEnv(`GHL_API_KEY_${staticCreds.ghlApiKeyEnvSuffix}`)
    : "";
  // Per-account static wins over global env — a global env var (e.g.
  // META_AD_ACCOUNT_ID set to NH's ID) must not leak into other sub-accounts
  // that already have their own baked-in value.
  return {
    ga4PropertyId: staticCreds.ga4PropertyId,
    googleAdsCustomerId: staticCreds.googleAdsCustomerId,
    googleAdsDeveloperToken: trimEnv("GOOGLE_ADS_DEVELOPER_TOKEN") || undefined,
    callrailCompanyName: staticCreds.callrailCompanyName,
    callrailCompanyId: staticCreds.callrailCompanyId,
    ghlLocationId: staticCreds.ghlLocationId || trimEnv("GHL_LOCATION_ID") || undefined,
    ghlApiKey: ghlKeyFromPerAcctEnv || trimEnv("GHL_API_KEY") || undefined,
    metaAdAccountId: staticCreds.metaAdAccountId || trimEnv("META_AD_ACCOUNT_ID") || undefined,
    metaAccessToken: trimEnv("META_ACCESS_TOKEN") || undefined,
    metaPageId: staticCreds.metaPageId || trimEnv("META_PAGE_ID") || undefined,
    metaIgUserId: staticCreds.metaIgUserId || trimEnv("META_IG_USER_ID") || undefined,
    youtubeChannelId: staticCreds.youtubeChannelId,
    ringcentralEnabled: staticCreds.ringcentralEnabled,
    gmbLocations: staticCreds.gmbLocations,
  };
}
