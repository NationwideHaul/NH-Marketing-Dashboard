import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPerAccountConnection } from "@/lib/connections";
import {
  setAccountCredential,
  deleteAccountCredentials,
  isKvEnabled,
  KvNotConfiguredError,
} from "@/lib/credential-store";
import { getAccount } from "@/lib/accounts";

export const dynamic = "force-dynamic";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

function isValidAccountId(accountId: string): boolean {
  // Accept both parent ids (e.g. "nhttr") and sub-service variants ("nhttr-rv", "nhttr-ttr").
  const parent = accountId.replace(/-(rv|ttr)$/, "");
  return Boolean(getAccount(parent));
}

function allowedFields(serviceId: string): Set<string> {
  const conn = getPerAccountConnection(serviceId);
  if (!conn) return new Set();
  return new Set(conn.fields.map((f) => f.field));
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
  const conn = getPerAccountConnection(service);
  if (!conn) {
    return NextResponse.json({ ok: false, error: "Unknown service" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { accountId, values } = (body as {
    accountId?: string;
    values?: Record<string, string>;
  }) || {};

  if (!accountId || !isValidAccountId(accountId)) {
    return NextResponse.json(
      { ok: false, error: "Missing or invalid accountId" },
      { status: 400 }
    );
  }
  if (!values || typeof values !== "object") {
    return NextResponse.json(
      { ok: false, error: "Expected { accountId, values: { field: value, ... } }" },
      { status: 400 }
    );
  }

  const allowed = allowedFields(service);
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
      await setAccountCredential(accountId, key, raw);
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

  return NextResponse.json({ ok: true, service, accountId, written, rejected });
}

export async function DELETE(
  req: NextRequest,
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
  const conn = getPerAccountConnection(service);
  if (!conn) {
    return NextResponse.json({ ok: false, error: "Unknown service" }, { status: 404 });
  }

  const accountId = req.nextUrl.searchParams.get("accountId") || "";
  if (!accountId || !isValidAccountId(accountId)) {
    return NextResponse.json(
      { ok: false, error: "Missing or invalid accountId" },
      { status: 400 }
    );
  }

  const keys = Array.from(allowedFields(service));
  try {
    await deleteAccountCredentials(accountId, keys);
  } catch (err) {
    if (err instanceof KvNotConfiguredError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 503 });
    }
    return NextResponse.json(
      { ok: false, error: (err as Error).message || "Delete failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, service, accountId, cleared: keys });
}
