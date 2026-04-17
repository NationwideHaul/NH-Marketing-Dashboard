import { NextRequest, NextResponse } from "next/server";
import { format, subDays } from "date-fns";
import { Redis } from "@upstash/redis";
import { getCallAnalytics, getAgentCallStats } from "@/lib/api-clients/ringcentral";
import { getAccountCredential } from "@/lib/credential-store";
import { auth } from "@/lib/auth";

// This route is hit by Vercel Cron every 10 min (see vercel.json). It fetches
// the last-30-days RingCentral snapshot for every account and writes it to
// KV, so user-facing requests to /api/call-logs never have to hit RC directly
// and never see a 429.
//
// Runtime is "nodejs" because the RC client uses Buffer. Max duration is
// bumped to 300 s because paginating 30 days of detailed call-log can take a
// while — especially with retry backoffs.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const ACCOUNT_IDS = ["nationwide-haul", "nfi-truck-sales", "nhttr", "road-ready"];
const KV_TTL_SEC = 30 * 60; // 30 min — double the cron interval so a single failure still leaves fresh data
const LOOKBACK_DAYS = 30;

export function kvKey(accountId: string) {
  return `rc:snapshot:${accountId}`;
}

function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
  if (!url.trim() || !token.trim()) return null;
  try {
    return new Redis({ url: url.trim(), token: token.trim() });
  } catch {
    return null;
  }
}

async function syncAccount(accountId: string, redis: Redis) {
  const endDate = new Date();
  const startDate = subDays(endDate, LOOKBACK_DAYS);
  const fromIso = startDate.toISOString();
  const toIso = endDate.toISOString();
  const startStr = format(startDate, "yyyy-MM-dd");
  const endStr = format(endDate, "yyyy-MM-dd");

  const [analyticsResult, agents, assignment] = await Promise.all([
    getCallAnalytics(fromIso, toIso).then(
      (d) => ({ ok: true as const, data: d }),
      (e: Error) => ({ ok: false as const, error: e.message })
    ),
    getAgentCallStats(fromIso, toIso).catch((e: Error) => {
      console.error(`[cron] agents error for ${accountId}:`, e.message);
      return [];
    }),
    getAccountCredential(accountId, "teamMemberExtensionIds"),
  ]);

  const rcData = analyticsResult.ok ? analyticsResult.data : {
    totalCalls: 0, answered: 0, missed: 0, avgDuration: 0, answerRate: 0, records: [],
  };

  let assignedIds: string[] | null = null;
  if (assignment.value) {
    const raw = assignment.value;
    if (raw === "__empty__") assignedIds = [];
    else if (raw.startsWith("[")) {
      try {
        const p = JSON.parse(raw) as unknown;
        if (Array.isArray(p)) assignedIds = p.filter((x): x is string => typeof x === "string");
      } catch { /* keep null */ }
    } else {
      assignedIds = raw.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
    }
  }

  const filteredAgents = assignedIds
    ? agents.filter((a) => assignedIds.includes(a.extensionId))
    : agents;

  const snapshot = {
    syncedAt: new Date().toISOString(),
    startDate: startStr,
    endDate: endStr,
    // When the aggregate analytics call failed but we still got agents, surface
    // the error as a metadata field rather than a top-level "error" that would
    // blank out the UI.
    analyticsError: analyticsResult.ok ? null : analyticsResult.error,
    ...rcData,
    agents: filteredAgents,
    allAgentsCount: agents.length,
    teamAssignment: assignedIds
      ? { assigned: true, count: assignedIds.length }
      : { assigned: false, count: null },
  };

  await redis.set(kvKey(accountId), JSON.stringify(snapshot), { ex: KV_TTL_SEC });
  return {
    accountId,
    agents: filteredAgents.length,
    totalCalls: snapshot.totalCalls,
    analyticsError: snapshot.analyticsError,
  };
}

async function runSync(req: NextRequest) {
  // Guard the endpoint. Vercel Cron adds `Authorization: Bearer <CRON_SECRET>`
  // when CRON_SECRET is configured; otherwise we accept requests from localhost
  // for dev and from Vercel's cron header.
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") || "";
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const isLocalhost = /^(127\.|localhost)/.test(req.headers.get("host") || "");

  // Accept the request if ANY of these match:
  //   1. Vercel Cron (auto-authenticated via header)
  //   2. Bearer token matching CRON_SECRET (manual curl from a trusted place)
  //   3. Logged-in dashboard user (so you can hit it from a browser tab to
  //      force a fresh snapshot without waiting for the daily cron)
  //   4. localhost dev
  let authed = isVercelCron || isLocalhost;
  if (!authed && cronSecret && authHeader === `Bearer ${cronSecret}`) authed = true;
  if (!authed) {
    const session = await auth();
    if (session?.user) authed = true;
  }
  if (!authed) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized. Log in or use CRON_SECRET bearer token." },
      { status: 401 }
    );
  }

  if (!process.env.RINGCENTRAL_CLIENT_ID) {
    return NextResponse.json({ ok: false, error: "RingCentral not configured" }, { status: 503 });
  }

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ ok: false, error: "KV not configured" }, { status: 503 });
  }

  // Sync one account at a time to avoid hammering RC with parallel paginated
  // requests (which is exactly what was getting us 429'd in the first place).
  const results: Array<Record<string, unknown>> = [];
  for (const accountId of ACCOUNT_IDS) {
    try {
      const r = await syncAccount(accountId, redis);
      results.push(r);
    } catch (err) {
      results.push({ accountId, error: (err as Error).message });
    }
  }

  return NextResponse.json({ ok: true, syncedAt: new Date().toISOString(), results });
}

export async function GET(req: NextRequest) {
  return runSync(req);
}

export async function POST(req: NextRequest) {
  return runSync(req);
}
