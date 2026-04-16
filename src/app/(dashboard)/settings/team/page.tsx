"use client";

import { useCallback, useEffect, useState } from "react";
import { Users, Save, Loader2, RefreshCw, Trash2, Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccount } from "@/context/account-context";

interface Agent {
  id: string;
  extensionNumber: string;
  name: string;
  status: string;
}

export default function TeamMembersPage() {
  const { currentAccount, apiAccountId } = useAccount();

  const [loading, setLoading] = useState(true);
  const [kvEnabled, setKvEnabled] = useState(false);
  const [rcError, setRcError] = useState<string | null>(null);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [assignedIds, setAssignedIds] = useState<string[] | null>(null);
  const [dirty, setDirty] = useState<Set<string> | null>(null); // null = using server state
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/settings/team-members?accountId=${encodeURIComponent(apiAccountId)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setAllAgents(data.allAgents || []);
      setAssignedIds(data.assignedIds);
      setKvEnabled(Boolean(data.kvEnabled));
      setRcError(data.rcError || null);
      setDirty(null);
    } finally {
      setLoading(false);
    }
  }, [apiAccountId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived: the set of currently-checked ids.
  const selectedSet =
    dirty !== null
      ? dirty
      : new Set(assignedIds ?? allAgents.map((a) => a.id));
  const hasExplicitAssignment = assignedIds !== null;
  const hasChanges = dirty !== null;

  const toggle = (id: string) => {
    setDirty((d) => {
      const base = new Set(d ?? (assignedIds ?? allAgents.map((a) => a.id)));
      if (base.has(id)) base.delete(id);
      else base.add(id);
      return base;
    });
  };

  const selectAll = () => setDirty(new Set(allAgents.map((a) => a.id)));
  const selectNone = () => setDirty(new Set());

  const save = async () => {
    if (!dirty) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings/team-members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: apiAccountId, extensionIds: Array.from(dirty) }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
      await fetchData();
    } catch (err) {
      alert(`Save failed: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const clearAssignment = async () => {
    if (!confirm("Clear assignment? The account will fall back to showing all agents.")) return;
    try {
      const res = await fetch(
        `/api/settings/team-members?accountId=${encodeURIComponent(apiAccountId)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
      await fetchData();
    } catch (err) {
      alert(`Clear failed: ${(err as Error).message}`);
    }
  };

  const filtered = filter
    ? allAgents.filter(
        (a) =>
          a.name.toLowerCase().includes(filter.toLowerCase()) ||
          a.extensionNumber.includes(filter)
      )
    : allAgents;

  const selectedCount = selectedSet.size;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-border bg-card px-5 py-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <img src={currentAccount.logo} alt={currentAccount.name} className="h-10 w-10 rounded-lg" />
            <div>
              <h2 className="text-base font-bold text-card-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Team members for {currentAccount.name}
                {apiAccountId !== currentAccount.id && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase">
                    {apiAccountId.slice(currentAccount.id.length + 1)}
                  </span>
                )}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Pick which RingCentral extensions belong to this account. The Call Logs → Agent Calls
                tab will only show these people.
                {hasExplicitAssignment ? (
                  <> Currently <span className="font-semibold text-foreground">{selectedCount}</span> assigned.</>
                ) : (
                  <> <span className="italic">No assignment yet — showing all {allAgents.length} agents.</span></>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/60 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* KV warning */}
      {!loading && !kvEnabled && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            KV store not configured — can&apos;t save team assignments. Enable Upstash KV in Vercel.
          </p>
        </div>
      )}

      {/* RingCentral error */}
      {!loading && rcError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/5 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-400">
            Couldn&apos;t load RingCentral extensions: {rcError}
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="search"
          placeholder="Filter by name or extension…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 min-w-[240px] rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={selectAll}
          className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/60"
        >
          Select all
        </button>
        <button
          onClick={selectNone}
          className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/60"
        >
          Select none
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Loading RingCentral agents…
        </div>
      ) : allAgents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No RingCentral agents available.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border max-h-[520px] overflow-y-auto">
          {filtered.map((agent) => {
            const checked = selectedSet.has(agent.id);
            return (
              <button
                key={agent.id}
                onClick={() => toggle(agent.id)}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-muted/30 transition-colors"
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0",
                    checked ? "border-primary bg-primary" : "border-muted-foreground/40"
                  )}
                >
                  {checked && <Check className="h-2.5 w-2.5 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{agent.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Ext. {agent.extensionNumber || "—"}
                  </p>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No matches for &quot;{filter}&quot;.
            </div>
          )}
        </div>
      )}

      {/* Save / clear */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={save}
            disabled={!hasChanges || saving || !kvEnabled}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save assignment
          </button>
          {hasExplicitAssignment && (
            <button
              onClick={clearAssignment}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear assignment (show all)
            </button>
          )}
        </div>
        {hasChanges && (
          <p className="text-xs text-amber-700 dark:text-amber-400">Unsaved changes</p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Assignments are stored in KV and apply to every browser and teammate.
      </p>
    </div>
  );
}
