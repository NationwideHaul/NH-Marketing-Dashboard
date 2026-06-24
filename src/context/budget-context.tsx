"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAccount } from "@/context/account-context";
import {
  type BudgetRow,
  accountBudgets,
  loadBudgets,
  saveBudgets,
  platformMonthlyCost,
} from "@/lib/budget-data";

// Single source of truth for per-account budgets, shared across tabs AND across
// devices/users via Supabase. The Budget tab reads/edits `budgets`; the
// Inventory Platforms tab reads `platformCost(...)` so cost-per-lead reflects
// the budget the user maintains.
//
// Persistence is layered for safety:
//   - Supabase (via /api/budgets) is the shared source of truth.
//   - localStorage mirrors every write and is the fallback when Supabase is
//     unreachable/unconfigured, so the dashboard keeps working no matter what.
// On first load for an account with no Supabase rows yet, whatever is in
// localStorage (or the defaults) is migrated up to Supabase.
interface BudgetContextType {
  budgets: BudgetRow[];
  setBudgets: (rows: BudgetRow[] | ((prev: BudgetRow[]) => BudgetRow[])) => void;
  resetToDefaults: () => void;
  /** Monthly cost set for a platform on the Budget tab, or undefined. */
  platformCost: (platformName: string) => number | undefined;
  loaded: boolean;
}

const BudgetContext = createContext<BudgetContextType | null>(null);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const { currentAccount } = useAccount();
  const [budgets, setBudgetsState] = useState<BudgetRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Write to localStorage (mirror/fallback) and fire-and-forget to Supabase.
  const persist = useCallback(
    (rows: BudgetRow[], accountId: string) => {
      saveBudgets(accountId, rows);
      fetch(`/api/budgets?accountId=${encodeURIComponent(accountId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budgets: rows }),
      }).catch(() => {
        /* Supabase unreachable — localStorage mirror still has the latest. */
      });
    },
    [],
  );

  // Load the current account's budgets: prefer Supabase, fall back to
  // localStorage/defaults, and migrate local → Supabase when remote is empty.
  useEffect(() => {
    const accountId = currentAccount.id;
    let cancelled = false;
    setLoaded(false);

    (async () => {
      const local = loadBudgets(accountId); // localStorage, or defaults
      try {
        const res = await fetch(`/api/budgets?accountId=${encodeURIComponent(accountId)}`);
        const json = await res.json();
        if (cancelled) return;

        if (json.status === "ok" && Array.isArray(json.budgets)) {
          if (json.budgets.length > 0) {
            setBudgetsState(json.budgets as BudgetRow[]);
          } else {
            // No rows yet — seed Supabase from local/defaults so it's shared.
            setBudgetsState(local);
            persist(local, accountId);
          }
        } else {
          // unconfigured/error — local fallback, no remote write.
          setBudgetsState(local);
        }
      } catch {
        if (!cancelled) setBudgetsState(local);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();

    return () => { cancelled = true; };
  }, [currentAccount.id, persist]);

  const setBudgets = useCallback(
    (rows: BudgetRow[] | ((prev: BudgetRow[]) => BudgetRow[])) => {
      setBudgetsState((prev) => {
        const next = typeof rows === "function" ? rows(prev) : rows;
        persist(next, currentAccount.id);
        return next;
      });
    },
    [currentAccount.id, persist],
  );

  const resetToDefaults = useCallback(() => {
    const defaults = accountBudgets[currentAccount.id] || [];
    setBudgetsState(defaults);
    persist(defaults, currentAccount.id);
  }, [currentAccount.id, persist]);

  const platformCost = useCallback(
    (platformName: string) => platformMonthlyCost(budgets, platformName),
    [budgets],
  );

  return (
    <BudgetContext.Provider value={{ budgets, setBudgets, resetToDefaults, platformCost, loaded }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget(): BudgetContextType {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used within BudgetProvider");
  return ctx;
}
