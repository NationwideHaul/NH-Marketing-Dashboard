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

// ---- Server-only helpers -----------------------------------------------
// Reads credentials from the store (KV with env fallback).

import { getCredential, getCredentialFromList, isKvEnabled } from "./credential-store";

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
