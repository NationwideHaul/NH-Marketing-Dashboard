"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Globe, DollarSign, Video, Megaphone, PhoneCall, Phone, Mail, Database, Share2 as Linkedin, BarChart3,
  CheckCircle2, XCircle, AlertCircle, ExternalLink, RefreshCw, Loader2,
  Pencil, Trash2, X, Save, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccount } from "@/context/account-context";

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

interface PerAccountFieldStatus {
  field: string;
  label: string;
  secret: boolean;
  configured: boolean;
  preview: string;
  source: Source;
  fallbackEnvVar?: string;
}

interface PerAccountConnectionStatus {
  id: string;
  name: string;
  description: string;
  category: Category;
  icon: string;
  docsUrl?: string;
  connected: boolean;
  fields: PerAccountFieldStatus[];
}

interface TestState {
  loading: boolean;
  ok?: boolean;
  message?: string;
  durationMs?: number;
}

interface EditState {
  values: Record<string, string>;
  saving: boolean;
  error?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe, DollarSign, Video, Megaphone, PhoneCall, Phone, Mail, Database, Linkedin, BarChart3,
};

const categoryLabels: Record<Category, string> = {
  analytics: "Analytics",
  ads: "Ads",
  calls: "Calls",
  crm: "CRM",
  social: "Social",
};

export default function ConnectionsPage() {
  const { currentAccount, apiAccountId } = useAccount();

  const [loading, setLoading] = useState(true);
  const [kvEnabled, setKvEnabled] = useState(false);
  const [connections, setConnections] = useState<ConnectionStatus[]>([]);
  const [perAccount, setPerAccount] = useState<PerAccountConnectionStatus[]>([]);
  const [tests, setTests] = useState<Record<string, TestState>>({});
  const [edits, setEdits] = useState<Record<string, EditState | undefined>>({});

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/settings/connections/status?accountId=${encodeURIComponent(apiAccountId)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setConnections(data.connections || []);
      setPerAccount(data.perAccount || []);
      setKvEnabled(Boolean(data.kvEnabled));
    } finally {
      setLoading(false);
    }
  }, [apiAccountId]);

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
        [id]: { loading: false, ok: data.ok, message: data.message, durationMs: data.durationMs },
      }));
    } catch (e) {
      setTests((t) => ({
        ...t,
        [id]: { loading: false, ok: false, message: (e as Error).message },
      }));
    }
  };

  // ---- GLOBAL card editing ----
  const startEditGlobal = (conn: ConnectionStatus) => {
    const values: Record<string, string> = {};
    for (const c of conn.credentials) {
      values[c.envVar] = c.secret ? "" : (c.configured ? c.preview : "");
    }
    setEdits((e) => ({ ...e, [`global:${conn.id}`]: { values, saving: false } }));
  };
  const saveGlobal = async (id: string) => {
    const key = `global:${id}`;
    const edit = edits[key];
    if (!edit) return;
    const values: Record<string, string> = {};
    for (const [k, v] of Object.entries(edit.values)) if (v.trim()) values[k] = v.trim();
    if (Object.keys(values).length === 0) {
      setEdits((e) => ({ ...e, [key]: { ...edit, error: "Nothing to save." } }));
      return;
    }
    setEdits((e) => ({ ...e, [key]: { ...edit, saving: true, error: undefined } }));
    try {
      const res = await fetch(`/api/settings/connections/${id}/credentials`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setEdits((e) => ({ ...e, [key]: undefined }));
      await fetchStatus();
      await runTest(id);
    } catch (err) {
      setEdits((e) => ({
        ...e,
        [key]: { ...edit, saving: false, error: (err as Error).message },
      }));
    }
  };
  const disconnectGlobal = async (id: string, name: string) => {
    if (!confirm(`Remove stored credentials for ${name}? Vercel env vars stay as fallback.`)) return;
    const res = await fetch(`/api/settings/connections/${id}/credentials`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok || !data.ok) return alert(`Disconnect failed: ${data.error}`);
    await fetchStatus();
  };

  // ---- PER-ACCOUNT card editing ----
  const startEditPerAccount = (conn: PerAccountConnectionStatus) => {
    const values: Record<string, string> = {};
    for (const f of conn.fields) {
      values[f.field] = f.secret ? "" : (f.configured ? f.preview : "");
    }
    setEdits((e) => ({ ...e, [`acct:${conn.id}`]: { values, saving: false } }));
  };
  const savePerAccount = async (id: string) => {
    const key = `acct:${id}`;
    const edit = edits[key];
    if (!edit) return;
    const values: Record<string, string> = {};
    for (const [k, v] of Object.entries(edit.values)) if (v.trim()) values[k] = v.trim();
    if (Object.keys(values).length === 0) {
      setEdits((e) => ({ ...e, [key]: { ...edit, error: "Nothing to save." } }));
      return;
    }
    setEdits((e) => ({ ...e, [key]: { ...edit, saving: true, error: undefined } }));
    try {
      const res = await fetch(`/api/settings/connections/account/${id}/credentials`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: apiAccountId, values }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setEdits((e) => ({ ...e, [key]: undefined }));
      await fetchStatus();
    } catch (err) {
      setEdits((e) => ({
        ...e,
        [key]: { ...edit, saving: false, error: (err as Error).message },
      }));
    }
  };
  const disconnectPerAccount = async (id: string, name: string) => {
    if (!confirm(`Clear ${name} overrides for this account? Hardcoded values stay as fallback.`)) return;
    const res = await fetch(
      `/api/settings/connections/account/${id}/credentials?accountId=${encodeURIComponent(apiAccountId)}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    if (!res.ok || !data.ok) return alert(`Disconnect failed: ${data.error}`);
    await fetchStatus();
  };

  const cancelEdit = (key: string) => setEdits((e) => ({ ...e, [key]: undefined }));
  const updateEditValue = (key: string, field: string, value: string) => {
    setEdits((e) => {
      const prev = e[key];
      if (!prev) return e;
      return { ...e, [key]: { ...prev, values: { ...prev.values, [field]: value } } };
    });
  };

  const connectedCount = connections.filter((c) => c.connected).length;
  const perAccountConnectedCount = perAccount.filter((c) => c.connected).length;

  return (
    <div className="space-y-6">
      {/* KV not configured banner */}
      {!loading && !kvEnabled && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              Editing is disabled — KV store not configured
            </p>
            <p className="mt-1 text-xs text-amber-800 dark:text-amber-300/90">
              Status and Test Connection work off your Vercel env vars. To edit credentials from this UI,
              create an Upstash Redis database in{" "}
              <a href="https://vercel.com/dashboard/stores" target="_blank" rel="noreferrer" className="underline">
                Vercel → Storage
              </a>{" "}
              and link it to this project.
            </p>
          </div>
        </div>
      )}

      {/* ===================== GLOBAL SECTION ===================== */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
              <Globe className="h-5 w-5 text-muted-foreground" />
              Global integrations
            </h2>
            <p className="text-xs text-muted-foreground">
              Shared across all accounts — OAuth apps, developer tokens, and service keys.
              {!loading && ` ${connectedCount} of ${connections.length} connected.`}
              {kvEnabled && <> · <span className="text-emerald-600 dark:text-emerald-400">KV active</span></>}
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {connections.map((conn) => {
            const Icon = iconMap[conn.icon] || Globe;
            const test = tests[conn.id];
            const editKey = `global:${conn.id}`;
            const edit = edits[editKey];
            const isEditing = Boolean(edit);
            const hasKvOverride = conn.credentials.some((c) => c.source === "kv");

            return (
              <div
                key={conn.id}
                className={cn(
                  "rounded-xl border bg-card p-5",
                  conn.connected ? "border-border" : "border-amber-500/40"
                )}
              >
                <CardHeader
                  icon={Icon}
                  name={conn.name}
                  category={conn.category}
                  description={conn.description}
                  connected={conn.connected}
                  hasKvOverride={hasKvOverride}
                />

                {!isEditing && (
                  <ReadonlyCredentials items={conn.credentials.map((c) => ({
                    key: c.envVar,
                    label: c.label,
                    caption: c.matchedEnvVar || c.envVar,
                    source: c.source,
                    configured: c.configured,
                    preview: c.preview,
                  }))} />
                )}

                {isEditing && edit && (
                  <EditForm
                    fields={conn.credentials.map((c) => ({ key: c.envVar, label: c.label, caption: c.envVar, secret: c.secret, configured: c.configured, preview: c.preview }))}
                    edit={edit}
                    onChange={(k, v) => updateEditValue(editKey, k, v)}
                    hint="Empty fields are ignored. Saved values override the matching Vercel env var."
                  />
                )}

                {test && !test.loading && test.message && !isEditing && <TestResult test={test} />}

                <CardActions
                  isEditing={isEditing}
                  edit={edit}
                  kvEnabled={kvEnabled}
                  hasKvOverride={hasKvOverride}
                  docsUrl={conn.docsUrl}
                  testLoading={test?.loading}
                  onTest={() => runTest(conn.id)}
                  onEdit={() => startEditGlobal(conn)}
                  onSave={() => saveGlobal(conn.id)}
                  onCancel={() => cancelEdit(editKey)}
                  onDisconnect={() => disconnectGlobal(conn.id, conn.name)}
                  disconnectLabel="Disconnect"
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* ===================== PER-ACCOUNT SECTION ===================== */}
      <section>
        <div className="mb-3 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
              <img src={currentAccount.logo} alt={currentAccount.name} className="h-6 w-6 rounded" />
              Per-account settings
            </h2>
            <p className="text-xs text-muted-foreground">
              Showing values for <span className="font-semibold text-foreground">{currentAccount.name}</span>
              {apiAccountId !== currentAccount.id && (
                <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase">
                  {apiAccountId.slice(currentAccount.id.length + 1)}
                </span>
              )}
              . Switch accounts in the sidebar to edit another.
              {!loading && ` ${perAccountConnectedCount} of ${perAccount.length} connected.`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {perAccount.map((conn) => {
            const Icon = iconMap[conn.icon] || Globe;
            const editKey = `acct:${conn.id}`;
            const edit = edits[editKey];
            const isEditing = Boolean(edit);
            const hasKvOverride = conn.fields.some((f) => f.source === "kv");

            return (
              <div
                key={conn.id}
                className={cn(
                  "rounded-xl border bg-card p-5",
                  conn.connected ? "border-border" : "border-amber-500/40"
                )}
              >
                <CardHeader
                  icon={Icon}
                  name={conn.name}
                  category={conn.category}
                  description={conn.description}
                  connected={conn.connected}
                  hasKvOverride={hasKvOverride}
                />

                {!isEditing && (
                  <ReadonlyCredentials items={conn.fields.map((f) => ({
                    key: f.field,
                    label: f.label,
                    caption: f.fallbackEnvVar || f.field,
                    source: f.source,
                    configured: f.configured,
                    preview: f.preview,
                  }))} />
                )}

                {isEditing && edit && (
                  <EditForm
                    fields={conn.fields.map((f) => ({ key: f.field, label: f.label, caption: f.fallbackEnvVar || f.field, secret: f.secret, configured: f.configured, preview: f.preview }))}
                    edit={edit}
                    onChange={(k, v) => updateEditValue(editKey, k, v)}
                    hint={`Values saved here apply only to ${currentAccount.name}. Empty fields are ignored.`}
                  />
                )}

                <CardActions
                  isEditing={isEditing}
                  edit={edit}
                  kvEnabled={kvEnabled}
                  hasKvOverride={hasKvOverride}
                  docsUrl={conn.docsUrl}
                  onEdit={() => startEditPerAccount(conn)}
                  onSave={() => savePerAccount(conn.id)}
                  onCancel={() => cancelEdit(editKey)}
                  onDisconnect={() => disconnectPerAccount(conn.id, conn.name)}
                  disconnectLabel="Clear overrides"
                  hideTest
                />
              </div>
            );
          })}

          {!loading && perAccount.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No per-account settings configured.
            </div>
          )}
        </div>

        <p className="mt-3 px-1 text-xs text-muted-foreground">
          Per-account overrides are stored separately in KV so each sub-account can have its own
          IDs and API keys without collisions. Hardcoded values in <code>accounts.ts</code> keep
          working as fallbacks.
        </p>
      </section>
    </div>
  );
}

// ================= Shared UI bits =================

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
      <span className={cn("h-1.5 w-1.5 rounded-full", connected ? "bg-emerald-500" : "bg-amber-500")} />
      {connected ? "Connected" : "Not configured"}
    </span>
  );
}

function CardHeader({ icon: Icon, name, category, description, connected, hasKvOverride }: {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  category: Category;
  description: string;
  connected: boolean;
  hasKvOverride: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          connected ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-card-foreground">{name}</h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {categoryLabels[category]}
            </span>
            {hasKvOverride && (
              <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                KV override
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <StatusPill connected={connected} />
    </div>
  );
}

interface ReadonlyItem {
  key: string;
  label: string;
  caption: string;
  source: Source;
  configured: boolean;
  preview: string;
}
function ReadonlyCredentials({ items }: { items: ReadonlyItem[] }) {
  return (
    <div className="mt-4 space-y-2 rounded-lg bg-muted/30 p-3">
      {items.map((it) => (
        <div key={it.key} className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-card-foreground">{it.label}</span>
              <code className="truncate rounded bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {it.caption}
              </code>
              {it.source === "kv" && (
                <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-blue-700 dark:text-blue-400">
                  KV
                </span>
              )}
              {it.source === "env" && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase text-muted-foreground">
                  ENV
                </span>
              )}
            </div>
            <div className="mt-0.5 font-mono text-[11px] text-muted-foreground break-all">
              {it.configured ? it.preview : <span className="italic">not set</span>}
            </div>
          </div>
          {it.configured ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
          )}
        </div>
      ))}
    </div>
  );
}

interface EditField {
  key: string;
  label: string;
  caption: string;
  secret: boolean;
  configured: boolean;
  preview: string;
}
function EditForm({ fields, edit, onChange, hint }: {
  fields: EditField[];
  edit: EditState;
  onChange: (key: string, value: string) => void;
  hint: string;
}) {
  return (
    <div className="mt-4 space-y-3 rounded-lg border border-border bg-muted/20 p-4">
      {fields.map((f) => (
        <div key={f.key}>
          <label className="flex items-center gap-2 text-xs font-medium text-card-foreground mb-1">
            {f.label}
            <code className="rounded bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {f.caption}
            </code>
          </label>
          <input
            type={f.secret ? "password" : "text"}
            value={edit.values[f.key] ?? ""}
            onChange={(e) => onChange(f.key, e.target.value)}
            placeholder={f.secret && f.configured ? `Leave blank to keep current (${f.preview})` : f.configured ? f.preview : "Not set"}
            disabled={edit.saving}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          />
        </div>
      ))}
      {edit.error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">{edit.error}</p>
      )}
      <p className="text-[10px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function TestResult({ test }: { test: TestState }) {
  return (
    <div className={cn(
      "mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs",
      test.ok ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-red-500/10 text-red-700 dark:text-red-400"
    )}>
      {test.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-px" /> : <XCircle className="h-4 w-4 shrink-0 mt-px" />}
      <div className="flex-1">
        <p className="font-medium">{test.message}</p>
        {typeof test.durationMs === "number" && test.durationMs > 0 && (
          <p className="text-[10px] opacity-70">Completed in {test.durationMs}ms</p>
        )}
      </div>
    </div>
  );
}

function CardActions({
  isEditing, edit, kvEnabled, hasKvOverride, docsUrl, testLoading,
  onTest, onEdit, onSave, onCancel, onDisconnect,
  disconnectLabel, hideTest,
}: {
  isEditing: boolean;
  edit: EditState | undefined;
  kvEnabled: boolean;
  hasKvOverride: boolean;
  docsUrl?: string;
  testLoading?: boolean;
  onTest?: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDisconnect: () => void;
  disconnectLabel: string;
  hideTest?: boolean;
}) {
  return (
    <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
      {isEditing && edit ? (
        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            disabled={edit.saving}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {edit.saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </button>
          <button
            onClick={onCancel}
            disabled={edit.saving}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/60 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          {!hideTest && onTest && (
            <button
              onClick={onTest}
              disabled={testLoading}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {testLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Test
            </button>
          )}
          <button
            onClick={onEdit}
            disabled={!kvEnabled}
            title={!kvEnabled ? "Enable KV to edit credentials" : undefined}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          {hasKvOverride && (
            <button
              onClick={onDisconnect}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {disconnectLabel}
            </button>
          )}
        </div>
      )}
      {!isEditing && docsUrl && (
        <a href={docsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          Docs <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}
