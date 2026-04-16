// Definition of all API integrations the dashboard uses.
// Consumed by /settings/connections page and its status API route.

export type ConnectionCategory = "analytics" | "ads" | "calls" | "crm" | "social";

export interface ConnectionCredentialField {
  label: string;
  envVar: string;
  /** Optional per-account env var patterns (e.g. GHL_API_KEY_NATIONWIDE_HAUL). */
  perAccountEnvVars?: string[];
  /** When true, value is masked in the UI except for the last 4 chars. */
  secret: boolean;
}

export interface ConnectionDef {
  id: string;
  name: string;
  description: string;
  category: ConnectionCategory;
  /** lucide-react icon name */
  icon: string;
  docsUrl?: string;
  credentials: ConnectionCredentialField[];
}

export const connections: ConnectionDef[] = [
  {
    id: "google",
    name: "Google (OAuth)",
    description: "Shared OAuth for GA4, Google Ads, GMB, and YouTube.",
    category: "analytics",
    icon: "Globe",
    docsUrl: "https://console.cloud.google.com/apis/credentials",
    credentials: [
      { label: "Client ID", envVar: "GOOGLE_CLIENT_ID", secret: false },
      { label: "Client Secret", envVar: "GOOGLE_CLIENT_SECRET", secret: true },
      { label: "Refresh Token", envVar: "GOOGLE_REFRESH_TOKEN", secret: true },
    ],
  },
  {
    id: "google-ads",
    name: "Google Ads",
    description: "Developer token + manager account for Google Ads API.",
    category: "ads",
    icon: "DollarSign",
    docsUrl: "https://ads.google.com/aw/apicenter",
    credentials: [
      { label: "Developer Token", envVar: "GOOGLE_ADS_DEVELOPER_TOKEN", secret: true },
      { label: "Manager Account ID", envVar: "GOOGLE_ADS_MANAGER_ID", secret: false },
    ],
  },
  {
    id: "youtube",
    name: "YouTube",
    description: "Optional separate refresh token for channel-owner account.",
    category: "social",
    icon: "Video",
    credentials: [
      { label: "Refresh Token", envVar: "YOUTUBE_REFRESH_TOKEN", secret: true },
    ],
  },
  {
    id: "meta",
    name: "Meta (Facebook & Instagram)",
    description: "Ads, Page and Instagram Business insights via Graph API.",
    category: "ads",
    icon: "Megaphone",
    docsUrl: "https://developers.facebook.com/apps",
    credentials: [
      { label: "Access Token", envVar: "META_ACCESS_TOKEN", secret: true },
      { label: "Ad Account ID", envVar: "META_AD_ACCOUNT_ID", secret: false },
      { label: "Page ID", envVar: "META_PAGE_ID", secret: false },
      { label: "IG User ID", envVar: "META_IG_USER_ID", secret: false },
    ],
  },
  {
    id: "ringcentral",
    name: "RingCentral",
    description: "Phone calls sync via JWT service account.",
    category: "calls",
    icon: "PhoneCall",
    docsUrl: "https://developers.ringcentral.com",
    credentials: [
      { label: "Client ID", envVar: "RINGCENTRAL_CLIENT_ID", secret: false },
      { label: "Client Secret", envVar: "RINGCENTRAL_CLIENT_SECRET", secret: true },
      { label: "JWT Token", envVar: "RINGCENTRAL_JWT_TOKEN", secret: true },
      { label: "Server URL", envVar: "RINGCENTRAL_SERVER_URL", secret: false },
    ],
  },
  {
    id: "callrail",
    name: "CallRail",
    description: "Call tracking for paid sources.",
    category: "calls",
    icon: "Phone",
    docsUrl: "https://app.callrail.com/account",
    credentials: [
      { label: "API Key", envVar: "CALLRAIL_API_KEY", secret: true },
    ],
  },
  {
    id: "gohighlevel",
    name: "Go High Level",
    description: "Email marketing / CRM. Supports per-account API keys.",
    category: "crm",
    icon: "Mail",
    docsUrl: "https://marketplace.gohighlevel.com",
    credentials: [
      {
        label: "API Key",
        envVar: "GHL_API_KEY",
        perAccountEnvVars: [
          "GHL_API_KEY_NATIONWIDE_HAUL",
          "GHL_API_KEY_NFI",
          "GHL_API_KEY_ROAD_READY",
        ],
        secret: true,
      },
      { label: "Default Location ID", envVar: "GHL_LOCATION_ID", secret: false },
    ],
  },
  {
    id: "nh-crm",
    name: "Nationwide Haul CRM",
    description: "Internal CRM feed for service leads and sales.",
    category: "crm",
    icon: "Database",
    credentials: [
      { label: "API Key", envVar: "NH_CRM_API_KEY", secret: true },
    ],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "Organization page analytics.",
    category: "social",
    icon: "Linkedin",
    docsUrl: "https://www.linkedin.com/developers/apps",
    credentials: [
      { label: "Access Token", envVar: "LINKEDIN_ACCESS_TOKEN", secret: true },
      { label: "Organization ID", envVar: "LINKEDIN_ORGANIZATION_ID", secret: false },
    ],
  },
];

export function getConnection(id: string): ConnectionDef | undefined {
  return connections.find((c) => c.id === id);
}

// ========== Per-account connection definitions ==========
// These vary across sub-accounts (NH, NFI, NHTTR+RV, NHTTR+TTR, RRI). Each
// field is resolved against:
//   1. KV override at cred:account:<accountId>:<field>
//   2. fallbackEnvVar (for GHL per-account API keys that live in separate env vars)
//   3. Hardcoded value from accounts.ts / account-credentials.ts
//
// The UI treats the selected sidebar account as the scope.

export interface PerAccountField {
  /** The unique field id used as the KV suffix, e.g. "ga4PropertyId". */
  field: string;
  label: string;
  secret: boolean;
  /** Reads fallback value from a per-account env var pattern (e.g. GHL_API_KEY_{ACCOUNT}). */
  fallbackEnvVar?: (accountId: string) => string | undefined;
}

export interface PerAccountConnectionDef {
  id: string;
  name: string;
  description: string;
  category: ConnectionCategory;
  icon: string;
  docsUrl?: string;
  fields: PerAccountField[];
}

/** Maps dashboard account IDs to the env-var suffix used for GHL keys. */
const GHL_KEY_SUFFIX: Record<string, string> = {
  "nationwide-haul": "NATIONWIDE_HAUL",
  "nfi-truck-sales": "NFI",
  "road-ready": "ROAD_READY",
};

export const perAccountConnections: PerAccountConnectionDef[] = [
  {
    id: "ga4",
    name: "Google Analytics 4",
    description: "GA4 property for this account's website tracking.",
    category: "analytics",
    icon: "BarChart3",
    fields: [
      { field: "ga4PropertyId", label: "Property ID", secret: false },
    ],
  },
  {
    id: "google-ads-customer",
    name: "Google Ads Customer",
    description: "Customer (account) ID within the Google Ads manager.",
    category: "ads",
    icon: "DollarSign",
    fields: [
      { field: "googleAdsCustomerId", label: "Customer ID", secret: false },
    ],
  },
  {
    id: "callrail-company",
    name: "CallRail Company",
    description: "Company ID + display name within your CallRail account.",
    category: "calls",
    icon: "Phone",
    fields: [
      { field: "callrailCompanyId", label: "Company ID", secret: false },
      { field: "callrailCompanyName", label: "Company Name", secret: false },
    ],
  },
  {
    id: "meta-per-account",
    name: "Meta Ad Account",
    description: "Facebook/Instagram Ad Account, Page, and IG User for this business.",
    category: "ads",
    icon: "Megaphone",
    fields: [
      { field: "metaAdAccountId", label: "Ad Account ID", secret: false },
      { field: "metaPageId", label: "Facebook Page ID", secret: false },
      { field: "metaIgUserId", label: "Instagram User ID", secret: false },
    ],
  },
  {
    id: "ghl-location",
    name: "Go High Level Location",
    description: "Location ID + per-account API key (if different from the global one).",
    category: "crm",
    icon: "Mail",
    fields: [
      { field: "ghlLocationId", label: "Location ID", secret: false },
      {
        field: "ghlApiKey",
        label: "API Key",
        secret: true,
        fallbackEnvVar: (accountId) => {
          const suffix = GHL_KEY_SUFFIX[accountId];
          return suffix ? `GHL_API_KEY_${suffix}` : undefined;
        },
      },
    ],
  },
  {
    id: "youtube-channel",
    name: "YouTube Channel",
    description: "Channel ID for this account (uses global YouTube refresh token).",
    category: "social",
    icon: "Video",
    fields: [
      { field: "youtubeChannelId", label: "Channel ID", secret: false },
    ],
  },
];

export function getPerAccountConnection(id: string): PerAccountConnectionDef | undefined {
  return perAccountConnections.find((c) => c.id === id);
}

// ---- Server-only helpers -----------------------------------------------
// Reads credentials from the store (KV with env fallback).

import { getAccount } from "./accounts";
import { getAccountCredentialsSync } from "./account-credentials";
import {
  getAccountCredential,
  getCredential,
  getCredentialFromList,
  isKvEnabled,
} from "./credential-store";

export interface CredentialStatus {
  envVar: string;
  label: string;
  secret: boolean;
  configured: boolean;
  /** Last 4 chars for secrets, full value for non-secrets. Empty when missing. */
  preview: string;
  /** "kv" when overridden from the Settings UI, "env" from Vercel env var, "missing" otherwise. */
  source: "kv" | "env" | "missing";
  /** If a per-account env var matched instead of the primary, this shows which. */
  matchedEnvVar?: string;
}

export interface ConnectionStatus {
  id: string;
  name: string;
  description: string;
  category: ConnectionCategory;
  icon: string;
  docsUrl?: string;
  /** True when every required credential in the connection is present. */
  connected: boolean;
  credentials: CredentialStatus[];
}

function preview(value: string, secret: boolean): string {
  if (!value) return "";
  if (!secret) return value;
  if (value.length <= 4) return "•".repeat(value.length);
  return `••••${value.slice(-4)}`;
}

export async function getConnectionStatuses(): Promise<ConnectionStatus[]> {
  return Promise.all(
    connections.map(async (c) => {
      const credStatuses: CredentialStatus[] = await Promise.all(
        c.credentials.map(async (field) => {
          // Try primary env var first (KV override → env fallback).
          const primary = await getCredential(field.envVar);
          let value = primary.value;
          let source = primary.source;
          let matchedEnvVar: string | undefined;

          // If primary came up empty AND there are per-account alternatives,
          // try them in order.
          if (!value && field.perAccountEnvVars?.length) {
            const alt = await getCredentialFromList(field.perAccountEnvVars);
            if (alt.source !== "missing") {
              value = alt.value;
              source = alt.source;
              matchedEnvVar = alt.matchedEnvVar;
            }
          }

          return {
            envVar: field.envVar,
            label: field.label,
            secret: field.secret,
            configured: Boolean(value),
            preview: preview(value, field.secret),
            source,
            matchedEnvVar,
          };
        })
      );

      const connected = credStatuses.every((cs) => cs.configured);
      return {
        id: c.id,
        name: c.name,
        description: c.description,
        category: c.category,
        icon: c.icon,
        docsUrl: c.docsUrl,
        connected,
        credentials: credStatuses,
      };
    })
  );
}

export { isKvEnabled };

// ---- Per-account status resolution -------------------------------------

export interface PerAccountFieldStatus {
  field: string;
  label: string;
  secret: boolean;
  configured: boolean;
  preview: string;
  source: "kv" | "env" | "missing";
  fallbackEnvVar?: string;
}

export interface PerAccountConnectionStatus {
  id: string;
  name: string;
  description: string;
  category: ConnectionCategory;
  icon: string;
  docsUrl?: string;
  connected: boolean;
  fields: PerAccountFieldStatus[];
}

/**
 * Pull the hardcoded value for a given field from the account's static config
 * (accounts.ts). Returns empty string when not defined for that account.
 */
function accountConfigValue(accountId: string, field: string): string {
  // Strip the -rv / -ttr suffix if present — those sub-service flavors reuse
  // the parent account's static config for most fields, except the ones the
  // sub-service explicitly overrides.
  const parentId = accountId.replace(/-(rv|ttr)$/, "");
  const subServiceId = accountId !== parentId ? accountId.slice(parentId.length + 1) : null;

  const account = getAccount(parentId);
  if (!account) return "";

  // Sub-service override: check accounts.ts subServices entry
  if (subServiceId && account.subServices) {
    const sub = account.subServices.find((s) => s.id === subServiceId);
    if (sub && field in sub) {
      const val = (sub as unknown as Record<string, unknown>)[field];
      if (typeof val === "string") return val;
    }
  }

  const config = account.config as unknown as Record<string, unknown>;
  const v = config?.[field];
  if (typeof v === "string" && v) return v;

  // Secondary fallback: account-credentials.ts has richer static config
  // (callrail company IDs, IG user IDs when env-var isn't set, etc.).
  const creds = getAccountCredentialsSync(accountId) as unknown as Record<string, unknown>;
  const credVal = creds?.[field];
  return typeof credVal === "string" ? credVal : "";
}

export async function getPerAccountConnectionStatuses(
  accountId: string
): Promise<PerAccountConnectionStatus[]> {
  return Promise.all(
    perAccountConnections.map(async (conn) => {
      const fieldStatuses: PerAccountFieldStatus[] = await Promise.all(
        conn.fields.map(async (f) => {
          const fallbackEnvVar = f.fallbackEnvVar?.(accountId);
          const fallbackValue = accountConfigValue(accountId, f.field);
          const resolved = await getAccountCredential(accountId, f.field, {
            fallbackEnvVar,
            fallbackValue,
          });
          return {
            field: f.field,
            label: f.label,
            secret: f.secret,
            configured: Boolean(resolved.value),
            preview: preview(resolved.value, f.secret),
            source: resolved.source,
            fallbackEnvVar,
          };
        })
      );
      const connected = fieldStatuses.every((s) => s.configured);
      return {
        id: conn.id,
        name: conn.name,
        description: conn.description,
        category: conn.category,
        icon: conn.icon,
        docsUrl: conn.docsUrl,
        connected,
        fields: fieldStatuses,
      };
    })
  );
}
