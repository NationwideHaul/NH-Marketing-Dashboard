import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getConnection } from "@/lib/connections";
import {
  setCredential,
  deleteCredentials,
  isKvEnabled,
  KvNotConfiguredError,
} from "@/lib/credential-store";

export const dynamic = "force-dynamic";

/**
 * Only allow fields that belong to the connection definition. Prevents
 * writing arbitrary keys into KV.
 */
function allowedEnvVars(serviceId: string): Set<string> {
  const conn = getConnection(serviceId);
  if (!conn) return new Set();
  const names = new Set<string>();
  for (const f of conn.credentials) {
    names.add(f.envVar);
    f.perAccountEnvVars?.forEach((n) => names.add(n));
  }
  return names;
}

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  if (!isKvEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "KV not configured. Create an Upstash Redis database in Vercel → Storage and link it to this project.",
      },
      { status: 503 }
    );
  }

  const { service } = await params;
  const conn = getConnection(service);
  if (!conn) {
    return NextResponse.json({ ok: false, error: "Unknown service" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const values = (body as { values?: Record<string, string> })?.values;
  if (!values || typeof values !== "object") {
    return NextResponse.json(
      { ok: false, error: "Expected { values: { ENV_VAR: value, ... } }" },
      { status: 400 }
    );
  }

  const allowed = allowedEnvVars(service);
  const rejected: string[] = [];
  const written: string[] = [];

  try {
    for (const [key, raw] of Object.entries(values)) {
      if (!allowed.has(key)) {
        rejected.push(key);
        continue;
      }
      if (typeof raw !== "string") {
        rejected.push(key);
        continue;
      }
      await setCredential(key, raw);
      written.push(key);
    }
  } catch (err) {
    if (err instanceof KvNotConfiguredError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 503 });
    }
    return NextResponse.json(
      { ok: false, error: (err as Error).message || "Write failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, service, written, rejected });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  if (!isKvEnabled()) {
    return NextResponse.json(
      { ok: false, error: "KV not configured." },
      { status: 503 }
    );
  }

  const { service } = await params;
  const conn = getConnection(service);
  if (!conn) {
    return NextResponse.json({ ok: false, error: "Unknown service" }, { status: 404 });
  }

  const keys = Array.from(allowedEnvVars(service));
  try {
    await deleteCredentials(keys);
  } catch (err) {
    if (err instanceof KvNotConfiguredError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 503 });
    }
    return NextResponse.json(
      { ok: false, error: (err as Error).message || "Delete failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, service, cleared: keys });
}
