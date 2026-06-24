// Shared budget data model + storage.
//
// The Budget tab owns these rows, but other tabs read them too (e.g. Inventory
// Platforms uses each platform's monthly budget as its cost when computing
// cost-per-lead). Keeping the model, defaults, storage, and name-matching here
// lets the BudgetProvider be the single source of truth across tabs.

export type BudgetCategory = "advertising" | "platform" | "tools";

export interface BudgetRow {
  platform: string;
  budget: number;
  spent: number;
  category: BudgetCategory;
}

// Per-account default budgets (used until the user edits + persists their own).
export const accountBudgets: Record<string, BudgetRow[]> = {
  "nationwide-haul": [
    { platform: "Google Ads", budget: 5000, spent: 0, category: "advertising" },
    { platform: "Meta Ads", budget: 7500, spent: 0, category: "advertising" },
    { platform: "TruckPaper", budget: 6800, spent: 6800, category: "platform" },
    { platform: "My Little Salesman", budget: 895, spent: 895, category: "platform" },
    { platform: "Commercial Truck Trader", budget: 1200, spent: 1200, category: "platform" },
    { platform: "Cherry Trader", budget: 500, spent: 500, category: "platform" },
    { platform: "NH Website", budget: 195, spent: 195, category: "platform" },
    { platform: "Go High Level", budget: 297, spent: 297, category: "tools" },
  ],
  "nfi-truck-sales": [
    { platform: "Google Ads", budget: 4000, spent: 0, category: "advertising" },
    { platform: "TruckPaper", budget: 6800, spent: 6800, category: "platform" },
    { platform: "My Little Salesman", budget: 895, spent: 895, category: "platform" },
    { platform: "NFI Website", budget: 195, spent: 195, category: "platform" },
    { platform: "NH Website", budget: 195, spent: 195, category: "platform" },
    { platform: "Go High Level", budget: 297, spent: 297, category: "tools" },
    { platform: "CallRail", budget: 145, spent: 145, category: "tools" },
  ],
  nhttr: [
    // Monthly equivalents of annual listing platform fees (see inventory-platforms-data.ts)
    { platform: "Google Ads (RV Repair)", budget: 2500, spent: 0, category: "advertising" },
    { platform: "Google Ads (TTR)", budget: 2500, spent: 0, category: "advertising" },
    { platform: "NTTS Listing", budget: 8, spent: 8, category: "platform" }, // $100/yr
    { platform: "Find Truck Service", budget: 83, spent: 83, category: "platform" }, // $996/yr
    { platform: "TruckDown", budget: 36, spent: 36, category: "platform" }, // $430/yr
    { platform: "CallRail", budget: 145, spent: 145, category: "tools" },
  ],
  "road-ready": [
    { platform: "Google Ads", budget: 3000, spent: 0, category: "advertising" },
    { platform: "Meta Ads", budget: 2000, spent: 0, category: "advertising" },
    { platform: "Website Hosting", budget: 99, spent: 99, category: "platform" },
    { platform: "Go High Level", budget: 297, spent: 297, category: "tools" },
    { platform: "Lead Gen Software", budget: 199, spent: 199, category: "tools" },
  ],
};

export function budgetStorageKey(accountId: string): string {
  return `nh-budget-${accountId}`;
}

export function loadBudgets(accountId: string): BudgetRow[] {
  if (typeof window === "undefined") return accountBudgets[accountId] || [];
  const saved = localStorage.getItem(budgetStorageKey(accountId));
  if (saved) {
    try { return JSON.parse(saved); } catch { /* fall through */ }
  }
  return accountBudgets[accountId] || [];
}

export function saveBudgets(accountId: string, budgets: BudgetRow[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(budgetStorageKey(accountId), JSON.stringify(budgets));
}

// Normalize a platform label so the Budget tab's "TruckPaper" matches the
// Inventory tab's "TruckPaper", "NH Website" matches "NH Website", etc.,
// regardless of spacing/punctuation/case.
export function normalizePlatformKey(name: string): string {
  return (name ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

// The monthly cost the user has set for a platform in the budget rows, or
// undefined if no matching row exists. Used by Inventory Platforms so the
// cost-per-lead reflects whatever the user maintains on the Budget tab.
export function platformMonthlyCost(budgets: BudgetRow[], platformName: string): number | undefined {
  const key = normalizePlatformKey(platformName);
  const row = budgets.find((b) => normalizePlatformKey(b.platform) === key);
  return row ? row.budget : undefined;
}
