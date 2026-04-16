"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Globe, DollarSign, Video, Megaphone, PhoneCall, Phone, Mail, Database, Share2 as Linkedin,
  CheckCircle2, XCircle, AlertCircle, ExternalLink, RefreshCw, Loader2,
  Pencil, Trash2, X, Save, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Category = "analytics" | "ads" | "calls" | "crm" | "social";
type Source = "kv" | "env" | "missing";

interface CredentialStatus {
  envVar: string;
  label: string;
  secret: boolean;
  configured: boolean;
  preview: string;
  source: Source;
  matchedEnvVar?: string;
}

interface ConnectionStatus {
  id: string;
  name: string;
  description: string;
  category: Category;
  icon: string;
  docsUrl?: string;
  connected: boolean;
  credentials: CredentialStatus[];
}

interface TestState {
  loading: boolean;
  ok?: boolean;
  message?: string;
  durationMs?: number;
  testedAt?: string;
}

interface EditState {
  /** Values the user has typed; keyed by envVar name. */
  values: Record<string, string>;
  saving: boolean;
  error?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe, DollarSign, Video, Megaphone, PhoneCall, Phone, Mail, Database, Linkedin,
};

const categoryLabels: Record<Category, string> = {
  analytics: "Analytics",
  ads: "Ads",
  calls: "Calls",
  crm: "CRM",
  social: "Social",
};

export default function ConnectionsPage() {
  const [loading, setLoading] = useState(true);
  const [kvEnabled, setKvEnabled] = useState(false);
  const [connections, setConnections] = useState<ConnectionStatus[]>([]);
  const [tests, setTests] = useState<Record<string, TestState>>({});
  const [edits, setEdits] = useState<Record<string, EditState | undefined>>({});

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/connections/status", { cache: "no-store" });
      const data = await res.json();
      setConnections(data.connections || []);
      setKvEnabled(Boolean(data.kvEnabled));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const runTest = async (id: string) => {
    setTests((t) => ({ ...t, [id]: { loading: true } }));
    try {
      const res = await fetch(`/api/settings/connections/${id}/test`, { method: "POST" });
      const data = await res.json();
      setTests((t) => ({
        ...t,
        [id]: {
          loading: false,
          ok: data.ok,
          message: data.message,
          durationMs: data.durationMs,
          testedAt: data.testedAt,
        },
      }));
    } catch (e) {
      setTests((t) => ({
        ...t,
        [id]: { loading: false, ok: false, message: (e as Error).message },
      }));
    }
  };

  const startEdit = (conn: ConnectionStatus) => {
    const values: Record<string, string> = {};
    // Pre-fill only non-secret values (those already came from the server).
    for (const c of conn.credentials) {
      values[c.envVar] = c.secret ? "" : (c.configured ? c.preview : "");
    }
    setEdits((e) => ({ ...e, [conn.id]: { values, saving: false } }));
  };

  const cancelEdit = (id: string) => {
    setEdits((e) => ({ ...e, [id]: undefined }));
  };

  const updateEditValue = (id: string, envVar: string, value: string) => {
    setEdits((e) => {
      const prev = e[id];
      if (!prev) return e;
      return { ...e, [id]: { ...prev, values: { ...prev.values, [envVar]: value } } };
    });
  };

  const saveEdit = async (id: string) => {
    const edit = edits[id];
    if (!edit) return;
    // Only send fields the user actually typed (non-empty). For secrets, empty
    // means "don't change". For non-secrets, empty could be intentional — treat
    // as no-op to avoid accidentally clearing public IDs.
    const values: Record<string, string> = {};
    for (const [k, v] of Object.entries(edit.values)) {
      if (v.trim()) values[k] = v.trim();
    }
    if (Object.keys(values).length === 0) {
      setEdits((e) => ({ ...e, [id]: { ...edit, error: "Nothing to save." } }));
      return;
    }

    setEdits((e) => ({ ...e, [id]: { ...edit, saving: true, error: undefined } }));
    try {
      const res = await fetch(`/api/settings/connections/${id}/credentials`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setEdits((e) => ({ ...e, [id]: undefined }));
      await fetchStatus();
      await runTest(id);
    } catch (err) {
      setEdits((e) => ({
        ...e,
        [id]: { ...edit, saving: false, error: (err as Error).message },
      }));
    }
  };

  const disconnect = async (id: string, name: string) => {
    if (!confirm(`Remove all stored credentials for ${name}? Credentials in Vercel environment variables will still be used as fallback.`)) return;
    try {
      const res = await fetch(`/api/settings/connections/${id}/credentials`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
      await fetchStatus();
    } catch (err) {
      alert(`Disconnect failed: ${(err as Error).message}`);
    }
  };

  const connectedCount = connections.filter((c) => c.connected).length;

  return (
    <div className="space-y-4">
      {/* KV not configured banner */}
      {!loading && !kvEnabled && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              Editing is disabled — KV store not configured
            </p>
            <p className="mt-1 text-xs text-amber-800 dark:text-amber-300/90">
              Status and Test Connection work off your Vercel env vars. To edit credentials from
              this UI, create an Upstash Redis database in{" "}
              <a href="https://vercel.com/dashboard/stores" target="_blank" rel="noreferrer" className="underline">
                Vercel → Storage
              </a>{" "}
              and link it to this project. The dashboard&apos;s data pipeline is unaffected — it
              keeps reading Vercel env vars as today.
            </p>
          </div>
        </div>
      )}

      {/* Summary bar */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
        <div>
          <h2 className="text-base font-bold text-card-foreground">Integrations</h2>
          <p className="text-xs text-muted-foreground">
            {loading
              ? "Loading status…"
              : `${connectedCount} of ${connections.length} connected`}
            {kvEnabled && <> · <span className="text-emerald-600 dark:text-emerald-400">KV store active</span></>}
          </p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/60 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {connections.map((conn) => {
          const Icon = iconMap[conn.icon] || Globe;
          const test = tests[conn.id];
          const edit = edits[conn.id];
          const isEditing = Boolean(edit);
          const hasKvOverride = conn.credentials.some((c) => c.source === "kv");

          return (
            <div
              key={conn.id}
              className={cn(
                "rounded-xl border bg-card p-5 transition-colors",
                conn.connected ? "border-border" : "border-amber-500/40"
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      conn.connected ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-card-foreground">{conn.name}</h3>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {categoryLabels[conn.category]}
                      </span>
                      {hasKvOverride && (
                        <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                          KV override
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{conn.description}</p>
                  </div>
                </div>
                <StatusPill connected={conn.connected} />
              </div>

              {/* Credentials — readonly view */}
              {!isEditing && (
                <div className="mt-4 space-y-2 rounded-lg bg-muted/30 p-3">
                  {conn.credentials.map((cred) => (
                    <div key={cred.envVar} className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium text-card-foreground">{cred.label}</span>
                          <code className="truncate rounded bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                            {cred.matchedEnvVar || cred.envVar}
                          </code>
                          {cred.source === "kv" && (
                            <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-blue-700 dark:text-blue-400">
                              KV
                            </span>
                          )}
                          {cred.source === "env" && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase text-muted-foreground">
                              ENV
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-muted-foreground break-all">
                          {cred.configured ? cred.preview : <span className="italic">not set</span>}
                        </div>
                      </div>
                      {cred.configured ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Credentials — edit form */}
              {isEditing && edit && (
                <div className="mt-4 space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                  {conn.credentials.map((cred) => (
                    <div key={cred.envVar}>
                      <label className="flex items-center gap-2 text-xs font-medium text-card-foreground mb-1">
                        {cred.label}
                        <code className="rounded bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                          {cred.envVar}
                        </code>
                      </label>
                      <input
                        type={cred.secret ? "password" : "text"}
                        value={edit.values[cred.envVar] ?? ""}
                        onChange={(e) => updateEditValue(conn.id, cred.envVar, e.target.value)}
                        placeholder={
                          cred.secret && cred.configured
                            ? `Leave blank to keep current (${cred.preview})`
                            : cred.configured
                              ? cred.preview
                              : "Not set"
                        }
                        disabled={edit.saving}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                      />
                    </div>
                  ))}
                  {edit.error && (
                    <p className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
                      {edit.error}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    Empty fields are ignored. Saved values override the matching Vercel env var.
                  </p>
                </div>
              )}

              {/* Test result */}
              {test && !test.loading && test.message && !isEditing && (
                <div
                  className={cn(
                    "mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs",
                    test.ok
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "bg-red-500/10 text-red-700 dark:text-red-400"
                  )}
                >
                  {test.ok ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-px" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 mt-px" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{test.message}</p>
                    {typeof test.durationMs === "number" && test.durationMs > 0 && (
                      <p className="text-[10px] opacity-70">Completed in {test.durationMs}ms</p>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
                {isEditing && edit ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => saveEdit(conn.id)}
                      disabled={edit.saving}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      {edit.saving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      Save & Test
                    </button>
                    <button
                      onClick={() => cancelEdit(conn.id)}
                      disabled={edit.saving}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/60 disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => runTest(conn.id)}
                      disabled={test?.loading}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      {test?.loading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      Test
                    </button>
                    <button
                      onClick={() => startEdit(conn)}
                      disabled={!kvEnabled}
                      title={!kvEnabled ? "Enable KV to edit credentials" : undefined}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    {hasKvOverride && (
                      <button
                        onClick={() => disconnect(conn.id, conn.name)}
                        className="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Disconnect
                      </button>
                    )}
                  </div>
                )}
                {!isEditing && conn.docsUrl && (
                  <a
                    href={conn.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Docs <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}

        {!loading && connections.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No connections configured.
          </div>
        )}
      </div>

      <p className="px-1 text-xs text-muted-foreground">
        Credentials saved here override Vercel environment variables. Secrets never leave the
        server — only the last 4 characters are shown. Disconnect clears KV overrides and falls
        back to the env var values.
      </p>
    </div>
  );
}

function StatusPill({ connected }: { connected: boolean }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
        connected
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
          : "bg-amber-500/15 text-amber-700 dark:text-amber-500"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          connected ? "bg-emerald-500" : "bg-amber-500"
        )}
      />
      {connected ? "Connected" : "Not configured"}
    </span>
  );
}
