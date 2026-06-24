"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAccount } from "@/context/account-context";
import {
  type BudgetRow,
  accountBudgets,
  budgetStorageKey,
  loadBudgets,
  saveBudgets,
  platformMonthlyCost,
} from "@/lib/budget-data";

// Single source of truth for per-account budgets, shared across tabs.
// The Budget tab reads/edits `budgets`; the Inventory Platforms tab reads
// `platformCost(...)` so cost-per-lead reflects the budget the user maintains.
// Because all consumers share this provider's state, an edit on the Budget tab
// propagates to the other tabs in the same window with no page reload.
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

  // Load the current account's budgets whenever the account changes.
  useEffect(() => {
    setBudgetsState(loadBudgets(currentAccount.id));
    setLoaded(true);
  }, [currentAccount.id]);

  // Update state and persist in one step so every consumer stays in sync.
  const setBudgets = useCallback(
    (rows: BudgetRow[] | ((prev: BudgetRow[]) => BudgetRow[])) => {
      setBudgetsState((prev) => {
        const next = typeof rows === "function" ? rows(prev) : rows;
        saveBudgets(currentAccount.id, next);
        return next;
      });
    },
    [currentAccount.id],
  );

  const resetToDefaults = useCallback(() => {
    const defaults = accountBudgets[currentAccount.id] || [];
    setBudgetsState(defaults);
    if (typeof window !== "undefined") {
      localStorage.removeItem(budgetStorageKey(currentAccount.id));
    }
  }, [currentAccount.id]);

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
