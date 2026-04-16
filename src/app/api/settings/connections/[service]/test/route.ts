import { NextRequest, NextResponse } from "next/server";
import { getCredential, getCredentialFromList } from "@/lib/credential-store";

export const dynamic = "force-dynamic";

interface TestResult {
  ok: boolean;
  message: string;
  durationMs: number;
  detail?: unknown;
}

async function time<T>(fn: () => Promise<T>): Promise<{ value?: T; error?: Error; ms: number }> {
  const start = Date.now();
  try {
    const value = await fn();
    return { value, ms: Date.now() - start };
  } catch (e) {
    return { error: e as Error, ms: Date.now() - start };
  }
}

/** KV-first / env fallback lookup. */
async function getCred(name: string): Promise<string> {
  const r = await getCredential(name);
  return r.value;
}

async function testGoogle(): Promise<TestResult> {
  const [clientId, clientSecret, refreshToken] = await Promise.all([
    getCred("GOOGLE_CLIENT_ID"),
    getCred("GOOGLE_CLIENT_SECRET"),
    getCred("GOOGLE_REFRESH_TOKEN"),
  ]);
  if (!clientId || !clientSecret || !refreshToken) {
    return { ok: false, message: "Missing Google OAuth credentials", durationMs: 0 };
  }
  const { value, error, ms } = await time(async () => {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.error || `HTTP ${res.status}`);
    return { expiresIn: data.expires_in };
  });
  if (error) return { ok: false, message: error.message, durationMs: ms };
  return { ok: true, message: `Access token refreshed (expires in ${value?.expiresIn}s)`, durationMs: ms };
}

async function testYouTube(): Promise<TestResult> {
  const [ytToken, googleToken, clientId, clientSecret] = await Promise.all([
    getCred("YOUTUBE_REFRESH_TOKEN"),
    getCred("GOOGLE_REFRESH_TOKEN"),
    getCred("GOOGLE_CLIENT_ID"),
    getCred("GOOGLE_CLIENT_SECRET"),
  ]);
  const refreshToken = ytToken || googleToken;
  if (!clientId || !clientSecret || !refreshToken) {
    return { ok: false, message: "Missing credentials (uses Google OAuth + YOUTUBE_REFRESH_TOKEN)", durationMs: 0 };
  }
  const { error, ms } = await time(async () => {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.error || `HTTP ${res.status}`);
    return data;
  });
  if (error) return { ok: false, message: error.message, durationMs: ms };
  return { ok: true, message: "YouTube refresh token valid", durationMs: ms };
}

async function testGoogleAds(): Promise<TestResult> {
  const [devToken, managerId] = await Promise.all([
    getCred("GOOGLE_ADS_DEVELOPER_TOKEN"),
    getCred("GOOGLE_ADS_MANAGER_ID"),
  ]);
  if (!devToken) return { ok: false, message: "Missing GOOGLE_ADS_DEVELOPER_TOKEN", durationMs: 0 };
  if (!managerId) return { ok: false, message: "Missing GOOGLE_ADS_MANAGER_ID", durationMs: 0 };
  return { ok: true, message: "Credentials present (full check runs with Google OAuth)", durationMs: 0 };
}

async function testMeta(): Promise<TestResult> {
  const accessToken = await getCred("META_ACCESS_TOKEN");
  if (!accessToken) return { ok: false, message: "Missing META_ACCESS_TOKEN", durationMs: 0 };
  const { value, error, ms } = await time(async () => {
    const res = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${accessToken}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
    return data as { id?: string; name?: string };
  });
  if (error) return { ok: false, message: error.message, durationMs: ms };
  return { ok: true, message: `Authenticated as ${value?.name || value?.id || "unknown"}`, durationMs: ms };
}

async function testRingCentral(): Promise<TestResult> {
  const [clientId, clientSecret, jwtToken, serverUrl] = await Promise.all([
    getCred("RINGCENTRAL_CLIENT_ID"),
    getCred("RINGCENTRAL_CLIENT_SECRET"),
    getCred("RINGCENTRAL_JWT_TOKEN"),
    getCred("RINGCENTRAL_SERVER_URL"),
  ]);
  const baseUrl = serverUrl || "https://platform.ringcentral.com";
  if (!clientId || !clientSecret || !jwtToken) {
    return { ok: false, message: "Missing RingCentral credentials", durationMs: 0 };
  }
  const { value, error, ms } = await time(async () => {
    const res = await fetch(`${baseUrl}/restapi/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwtToken,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error_description || data?.error || `HTTP ${res.status}`);
    return data as { expires_in?: number };
  });
  if (error) return { ok: false, message: error.message, durationMs: ms };
  return { ok: true, message: `JWT auth succeeded (expires in ${value?.expires_in}s)`, durationMs: ms };
}

async function testCallRail(): Promise<TestResult> {
  const apiKey = await getCred("CALLRAIL_API_KEY");
  if (!apiKey) return { ok: false, message: "Missing CALLRAIL_API_KEY", durationMs: 0 };
  const { value, error, ms } = await time(async () => {
    const res = await fetch("https://api.callrail.com/v3/a.json", {
      headers: { Authorization: `Token token="${apiKey}"` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
    return data as { accounts?: unknown[] };
  });
  if (error) return { ok: false, message: error.message, durationMs: ms };
  return { ok: true, message: `API key valid (${value?.accounts?.length ?? 0} account(s))`, durationMs: ms };
}

async function testGoHighLevel(): Promise<TestResult> {
  const apiKeyLookup = await getCredentialFromList([
    "GHL_API_KEY",
    "GHL_API_KEY_NATIONWIDE_HAUL",
    "GHL_API_KEY_NFI",
    "GHL_API_KEY_ROAD_READY",
  ]);
  if (!apiKeyLookup.value) return { ok: false, message: "Missing GHL API key", durationMs: 0 };
  const locationId = await getCred("GHL_LOCATION_ID");
  if (!locationId) return { ok: false, message: "Missing GHL_LOCATION_ID", durationMs: 0 };
  const { error, ms } = await time(async () => {
    const res = await fetch(
      `https://rest.gohighlevel.com/v1/locations/${locationId}`,
      { headers: { Authorization: `Bearer ${apiKeyLookup.value}` } }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data?.msg || data?.message || `HTTP ${res.status}`);
    return data;
  });
  if (error) return { ok: false, message: error.message, durationMs: ms };
  return { ok: true, message: "GHL location reachable", durationMs: ms };
}

async function testNhCrm(): Promise<TestResult> {
  const apiKey = await getCred("NH_CRM_API_KEY");
  if (!apiKey) return { ok: false, message: "Missing NH_CRM_API_KEY", durationMs: 0 };
  return { ok: true, message: "API key present", durationMs: 0 };
}

async function testLinkedIn(): Promise<TestResult> {
  const [token, orgId] = await Promise.all([
    getCred("LINKEDIN_ACCESS_TOKEN"),
    getCred("LINKEDIN_ORGANIZATION_ID"),
  ]);
  if (!token) return { ok: false, message: "Missing LINKEDIN_ACCESS_TOKEN", durationMs: 0 };
  if (!orgId) return { ok: false, message: "Missing LINKEDIN_ORGANIZATION_ID", durationMs: 0 };
  const { error, ms } = await time(async () => {
    const res = await fetch("https://api.linkedin.com/v2/me", {
      headers: { Authorization: `Bearer ${token}`, "LinkedIn-Version": "202401" },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`HTTP ${res.status}: ${body.slice(0, 120)}`);
    }
    return res.json();
  });
  if (error) return { ok: false, message: error.message, durationMs: ms };
  return { ok: true, message: "LinkedIn token valid", durationMs: ms };
}

const testers: Record<string, () => Promise<TestResult>> = {
  google: testGoogle,
  "google-ads": testGoogleAds,
  youtube: testYouTube,
  meta: testMeta,
  ringcentral: testRingCentral,
  callrail: testCallRail,
  gohighlevel: testGoHighLevel,
  "nh-crm": testNhCrm,
  linkedin: testLinkedIn,
};

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  const { service } = await params;
  const tester = testers[service];
  if (!tester) {
    return NextResponse.json({ ok: false, message: `Unknown service: ${service}` }, { status: 404 });
  }
  const result = await tester();
  return NextResponse.json({ service, ...result, testedAt: new Date().toISOString() });
}
