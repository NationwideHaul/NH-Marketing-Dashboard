import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listExtensions } from "@/lib/api-clients/ringcentral";
import {
  getAccountCredential,
  setAccountCredential,
  deleteAccountCredential,
  isKvEnabled,
  KvNotConfiguredError,
} from "@/lib/credential-store";
import { getAccount } from "@/lib/accounts";

export const dynamic = "force-dynamic";

const FIELD = "teamMemberExtensionIds";

// We store the assignment as a CSV string instead of `JSON.stringify([...])`.
// The @upstash/redis client auto-parses any JSON-looking value on read, so a
// stringified array comes back as a real array — which then fails the
// `typeof === "string"` check inside getAccountCredential() and the whole
// credential resolves as "missing". CSV avoids the auto-parse entirely.
// An empty selection is stored as the sentinel "__empty__" so we can still
// distinguish "saved no one" from "never saved".
const EMPTY_SENTINEL = "__empty__";

function encodeIds(ids: string[]): string {
  if (ids.length === 0) return EMPTY_SENTINEL;
  return ids.join(",");
}

function decodeIds(raw: string): string[] | null {
  if (!raw) return null;
  if (raw === EMPTY_SENTINEL) return [];
  // Back-compat: previous versions stored JSON-stringified arrays.
  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((x): x is string => typeof x === "string");
      }
    } catch {
      return null;
    }
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function isValidAccountId(accountId: string): boolean {
  const parent = accountId.replace(/-(rv|ttr)$/, "");
  return Boolean(getAccount(parent));
}

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/**
 * GET returns two things:
 *   allAgents     — every Enabled user in RingCentral (id, name, extension)
 *   assignedIds   — the extension IDs assigned to the account (null if unassigned)
 *
 * The UI uses allAgents to render checkboxes and assignedIds to know which
 * boxes are checked.
 */
export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("accountId") || "";
  if (!accountId || !isValidAccountId(accountId)) {
    return NextResponse.json(
      { ok: false, error: "Missing or invalid accountId" },
      { status: 400 }
    );
  }

  let allAgents: Array<{ id: string; extensionNumber: string; name: string; status: string }> = [];
  let rcError: string | null = null;
  try {
    const raw = await listExtensions();
    allAgents = raw
      .filter((e) => e.status === "Enabled")
      .map((e) => ({
        id: String(e.id),
        extensionNumber: String(e.extensionNumber || ""),
        name: e.name,
        status: e.status || "",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    rcError = (err as Error).message;
  }

  let assignedIds: string[] | null = null;
  try {
    const r = await getAccountCredential(accountId, FIELD);
    if (r.value) {
      assignedIds = decodeIds(r.value);
    }
  } catch {
    assignedIds = null;
  }

  return NextResponse.json({
    ok: true,
    accountId,
    allAgents,
    assignedIds,
    kvEnabled: isKvEnabled(),
    rcError,
  });
}

/**
 * PUT { accountId, extensionIds: string[] } — replaces the assignment for
 * the given account. Pass an empty array to assign no one.
 */
export async function PUT(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  if (!isKvEnabled()) {
    return NextResponse.json(
      { ok: false, error: "KV not configured." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { accountId, extensionIds } = (body as {
    accountId?: string;
    extensionIds?: string[];
  }) || {};

  if (!accountId || !isValidAccountId(accountId)) {
    return NextResponse.json(
      { ok: false, error: "Missing or invalid accountId" },
      { status: 400 }
    );
  }
  if (!Array.isArray(extensionIds)) {
    return NextResponse.json(
      { ok: false, error: "Expected { accountId, extensionIds: string[] }" },
      { status: 400 }
    );
  }

  const cleaned = extensionIds.filter((x): x is string => typeof x === "string" && x.length > 0);

  try {
    await setAccountCredential(accountId, FIELD, encodeIds(cleaned));
  } catch (err) {
    if (err instanceof KvNotConfiguredError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 503 });
    }
    return NextResponse.json(
      { ok: false, error: (err as Error).message || "Write failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, accountId, assignedCount: cleaned.length });
}

/**
 * DELETE clears the assignment so the account falls back to "all agents".
 */
export async function DELETE(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  if (!isKvEnabled()) {
    return NextResponse.json({ ok: false, error: "KV not configured." }, { status: 503 });
  }

  const accountId = req.nextUrl.searchParams.get("accountId") || "";
  if (!accountId || !isValidAccountId(accountId)) {
    return NextResponse.json(
      { ok: false, error: "Missing or invalid accountId" },
      { status: 400 }
    );
  }

  try {
    await deleteAccountCredential(accountId, FIELD);
  } catch (err) {
    if (err instanceof KvNotConfiguredError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 503 });
    }
    return NextResponse.json(
      { ok: false, error: (err as Error).message || "Delete failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, accountId, cleared: true });
}
