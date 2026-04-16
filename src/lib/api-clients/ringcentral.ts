// RingCentral API client for call tracking

import { getCredential } from "@/lib/credential-store";

interface RCAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

async function getBaseUrl(): Promise<string> {
  const { value } = await getCredential("RINGCENTRAL_SERVER_URL");
  return value || "https://platform.ringcentral.com";
}

// Access token cache — RingCentral rate-limits auth calls aggressively (429
// after a few consecutive JWT grants). Cache the token per process up to a
// minute before its stated expiry. Concurrent callers share the same in-flight
// promise so we never fire two JWT exchanges in parallel.
let cachedToken: { token: string; baseUrl: string; expiresAt: number } | null = null;
let inflightAuth: Promise<{ token: string; baseUrl: string }> | null = null;

async function getAccessToken(): Promise<{ token: string; baseUrl: string }> {
  const now = Date.now() / 1000;
  if (cachedToken && cachedToken.expiresAt > now + 60) {
    return { token: cachedToken.token, baseUrl: cachedToken.baseUrl };
  }
  if (inflightAuth) return inflightAuth;

  inflightAuth = (async () => {
    const [clientIdR, clientSecretR, jwtTokenR, baseUrl] = await Promise.all([
      getCredential("RINGCENTRAL_CLIENT_ID"),
      getCredential("RINGCENTRAL_CLIENT_SECRET"),
      getCredential("RINGCENTRAL_JWT_TOKEN"),
      getBaseUrl(),
    ]);
    const clientId = clientIdR.value;
    const clientSecret = clientSecretR.value;
    const jwtToken = jwtTokenR.value;

    if (!clientId || !clientSecret || !jwtToken) {
      throw new Error("RingCentral credentials not configured");
    }

    const response = await fetch(`${baseUrl}/restapi/oauth/token`, {
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

    if (!response.ok) {
      throw new Error(`RingCentral auth failed: ${response.status}`);
    }

    const data: RCAuthResponse = await response.json();
    cachedToken = {
      token: data.access_token,
      baseUrl,
      expiresAt: Date.now() / 1000 + (data.expires_in || 3600),
    };
    return { token: data.access_token, baseUrl };
  })().finally(() => {
    inflightAuth = null;
  });

  return inflightAuth;
}

// Get call log
export async function getCallLog(
  dateFrom: string, // ISO format
  dateTo: string,
  perPage: number = 100
) {
  const { token, baseUrl } = await getAccessToken();

  const params = new URLSearchParams({
    dateFrom,
    dateTo,
    perPage: String(perPage),
    view: "Detailed",
  });

  const response = await fetch(
    `${baseUrl}/restapi/v1.0/account/~/call-log?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    throw new Error(`RingCentral API error: ${response.status}`);
  }

  return response.json();
}

// ========== AGENTS / EXTENSIONS ==========
// List every user extension on the account. Used to map extension IDs to
// human-readable names (first/last) and extension numbers.
export async function listExtensions() {
  const { token, baseUrl } = await getAccessToken();
  const all: Array<Record<string, unknown>> = [];
  let page = 1;
  const perPage = 100;

  while (page <= 20) { // safety cap
    const res = await fetch(
      `${baseUrl}/restapi/v1.0/account/~/extension?perPage=${perPage}&page=${page}&type=User`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error(`RingCentral extensions error: ${res.status}`);
    const data = await res.json();
    const records = (data.records || []) as Array<Record<string, unknown>>;
    all.push(...records);
    if (records.length < perPage) break;
    page++;
  }

  return all.map((r) => {
    const contact = (r.contact as { firstName?: string; lastName?: string } | undefined) || {};
    const firstName = contact.firstName || "";
    const lastName = contact.lastName || "";
    const name = [firstName, lastName].filter(Boolean).join(" ") || String(r.name || "Unknown");
    return {
      id: String(r.id),
      extensionNumber: String(r.extensionNumber || ""),
      name,
      type: String(r.type || ""),
      status: String(r.status || ""),
    };
  });
}

// Get per-agent call stats for the period.
// Aggregates the detailed call-log grouped by the agent's extension ID:
//   - Inbound:  the "to" extension is the agent who received
//   - Outbound: the "from" extension is the agent who placed
// Returns one row per extension that appears in the call log, enriched with
// the extension's name/number from listExtensions().
export interface AgentCallStat {
  extensionId: string;
  extensionNumber: string;
  name: string;
  inbound: number;
  outbound: number;
  answered: number;
  missed: number;
  avgDurationSec: number;
  avgDuration: string; // "m:ss"
}

async function fetchDetailedCallLog(
  dateFrom: string,
  dateTo: string,
  token: string,
  baseUrl: string
) {
  const all: Array<Record<string, unknown>> = [];
  let page = 1;
  const perPage = 250;

  while (page <= 40) { // safety cap (40 * 250 = 10k records/window)
    const params = new URLSearchParams({
      dateFrom,
      dateTo,
      perPage: String(perPage),
      page: String(page),
      view: "Detailed",
    });
    const res = await fetch(
      `${baseUrl}/restapi/v1.0/account/~/call-log?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error(`RingCentral call-log error: ${res.status}`);
    const data = await res.json();
    const records = (data.records || []) as Array<Record<string, unknown>>;
    all.push(...records);
    // RingCentral doesn't return totalPages — stop on a short page.
    if (records.length < perPage) break;
    page++;
  }
  return all;
}

export async function getAgentCallStats(
  dateFrom: string,
  dateTo: string
): Promise<AgentCallStat[]> {
  const { token, baseUrl } = await getAccessToken();
  // Fetch extensions first so concurrent calls still get a cached token.
  const extensions = await listExtensions().catch(() => [] as Array<{ id: string; extensionNumber: string; name: string; status: string }>);
  const records = await fetchDetailedCallLog(dateFrom, dateTo, token, baseUrl);

  const extMap = new Map<string, { name: string; extensionNumber: string; status: string }>();
  for (const e of extensions) {
    extMap.set(String(e.id), {
      name: e.name,
      extensionNumber: e.extensionNumber,
      status: (e as { status?: string }).status || "",
    });
  }

  interface Agg {
    inbound: number;
    outbound: number;
    answered: number;
    missed: number;
    durations: number[];
  }
  const stats = new Map<string, Agg>();

  // Seed one entry per user extension so agents with zero activity still appear.
  for (const e of extensions) {
    stats.set(String(e.id), { inbound: 0, outbound: 0, answered: 0, missed: 0, durations: [] });
  }

  function agg(extId: string): Agg {
    let a = stats.get(extId);
    if (!a) {
      a = { inbound: 0, outbound: 0, answered: 0, missed: 0, durations: [] };
      stats.set(extId, a);
    }
    return a;
  }

  // userExtIds lets us distinguish user extensions from queue/IVR extensions
  // when scanning call legs (queue legs also have an extensionId).
  const userExtIds = new Set(extensions.map((e) => String(e.id)));

  /**
   * Find the user extension that handled this inbound call. We prefer
   * call legs because inbound calls often go Queue → Agent and the top-level
   * `to.extensionId` is the queue, not the human who answered.
   */
  function findInboundAgentExt(rec: Record<string, unknown>): { extId: string; answered: boolean } {
    const legs = Array.isArray(rec.legs) ? (rec.legs as Array<Record<string, unknown>>) : [];
    // 1. Look for a leg that was Accepted/Call connected and lands on a user extension.
    for (const leg of legs) {
      const legResult = String(leg.result || "");
      if (legResult !== "Accepted" && legResult !== "Call connected") continue;
      const to = (leg.to as Record<string, unknown>) || {};
      const id = typeof to.extensionId !== "undefined" ? String(to.extensionId) : "";
      if (id && userExtIds.has(id)) return { extId: id, answered: true };
    }
    // 2. No answered leg — pick the most-recent leg that rang a user extension
    //    (counts as a missed call for that user).
    for (let i = legs.length - 1; i >= 0; i--) {
      const leg = legs[i];
      const to = (leg.to as Record<string, unknown>) || {};
      const id = typeof to.extensionId !== "undefined" ? String(to.extensionId) : "";
      if (id && userExtIds.has(id)) return { extId: id, answered: false };
    }
    // 3. Fall back to the top-level `to` in case there are no legs (older API shapes).
    const top = (rec.to as Record<string, unknown>) || {};
    const topId = typeof top.extensionId !== "undefined" ? String(top.extensionId) : "";
    if (topId && userExtIds.has(topId)) {
      const topResult = String(rec.result || "");
      const topAns = topResult === "Accepted" || topResult === "Call connected";
      return { extId: topId, answered: topAns };
    }
    return { extId: "", answered: false };
  }

  for (const rec of records) {
    const direction = String(rec.direction || "");
    const result = String(rec.result || "");
    const duration = typeof rec.duration === "number" ? rec.duration : 0;

    if (direction === "Inbound") {
      const { extId, answered } = findInboundAgentExt(rec);
      if (!extId) continue; // IVR-only or untracked — leave in aggregate totals only
      const a = agg(extId);
      a.inbound++;
      if (answered) {
        a.answered++;
        if (duration > 0) a.durations.push(duration);
      } else {
        a.missed++;
      }
    } else if (direction === "Outbound") {
      const from = (rec.from as Record<string, unknown>) || {};
      const extId = typeof from.extensionId !== "undefined" ? String(from.extensionId) : "";
      if (!extId || !userExtIds.has(extId)) continue;
      const a = agg(extId);
      a.outbound++;
      const answered = result === "Accepted" || result === "Call connected" || (duration > 0 && result !== "Missed" && result !== "No Answer");
      if (answered) a.answered++;
      if (result === "Missed" || result === "No Answer") a.missed++;
      if (duration > 0) a.durations.push(duration);
    }
  }

  const out: AgentCallStat[] = [];
  for (const [extId, a] of stats) {
    const meta = extMap.get(extId);
    // Skip disabled / unassigned extensions so the list stays focused on active users.
    if (meta && meta.status && meta.status !== "Enabled") continue;
    const avgSec =
      a.durations.length > 0
        ? Math.round(a.durations.reduce((s, d) => s + d, 0) / a.durations.length)
        : 0;
    const mm = Math.floor(avgSec / 60);
    const ss = avgSec % 60;
    out.push({
      extensionId: extId,
      extensionNumber: meta?.extensionNumber || "",
      name: meta?.name || `Ext ${meta?.extensionNumber || extId}`,
      inbound: a.inbound,
      outbound: a.outbound,
      answered: a.answered,
      missed: a.missed,
      avgDurationSec: avgSec,
      avgDuration: `${mm}:${ss.toString().padStart(2, "0")}`,
    });
  }

  // Sort by most active first, zero-activity users go last alphabetically
  out.sort((x, y) => {
    const total = (y.inbound + y.outbound) - (x.inbound + x.outbound);
    if (total !== 0) return total;
    return x.name.localeCompare(y.name);
  });
  return out;
}

// Get call log analytics (aggregated) — paginates to cover the entire window.
export async function getCallAnalytics(
  dateFrom: string,
  dateTo: string
) {
  const { token, baseUrl } = await getAccessToken();

  const calls: Array<Record<string, unknown>> = [];
  let page = 1;
  const perPage = 250;

  while (page <= 40) { // safety cap (40 * 250 = 10k calls per window)
    const params = new URLSearchParams({
      dateFrom,
      dateTo,
      view: "Simple",
      perPage: String(perPage),
      page: String(page),
    });
    const response = await fetch(
      `${baseUrl}/restapi/v1.0/account/~/call-log?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) {
      throw new Error(`RingCentral API error: ${response.status}`);
    }
    const data = await response.json();
    const records = (data.records || []) as Array<Record<string, unknown>>;
    calls.push(...records);
    // RingCentral doesn't return totalPages — we stop when the page is short.
    if (records.length < perPage) break;
    page++;
  }

  const totalCalls = calls.length;
  const answered = calls.filter((c) => c.result === "Accepted" || c.result === "Call connected").length;
  const missed = calls.filter((c) => c.result === "Missed" || c.result === "No Answer").length;
  const durations = calls
    .filter((c) => typeof c.duration === "number" && (c.duration as number) > 0)
    .map((c) => c.duration as number);
  const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length / 60 : 0;

  return {
    totalCalls,
    answered,
    missed,
    avgDuration: Math.round(avgDuration * 10) / 10,
    answerRate: totalCalls > 0 ? Math.round((answered / totalCalls) * 1000) / 10 : 0,
    records: calls,
  };
}
