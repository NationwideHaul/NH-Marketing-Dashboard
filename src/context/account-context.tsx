"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { accounts, getDefaultAccount, allTabs, type SubAccount } from "@/lib/accounts";

interface AccountContextType {
  currentAccount: SubAccount;
  setAccount: (id: string) => void;
  allAccounts: SubAccount[];
  activeSubService: string | null; // e.g. "rv" or "ttr" for NHTTR
  setActiveSubService: (id: string) => void;
  apiAccountId: string; // The accountId to pass to API routes (e.g. "nhttr-rv")
}

const AccountContext = createContext<AccountContextType | null>(null);

const STORAGE_KEY = "nh-current-account";

const SUB_SERVICE_KEY = "nh-sub-service";

// Keep the current account/sub-service reflected in the URL so views are
// shareable and survive refreshes, without adding history entries.
function syncUrlParams(accountId: string, subId: string | null) {
  const url = new URL(window.location.href);
  if (url.searchParams.get("account") === accountId && url.searchParams.get("sub") === subId) return;
  url.searchParams.set("account", accountId);
  if (subId) url.searchParams.set("sub", subId);
  else url.searchParams.delete("sub");
  window.history.replaceState(window.history.state, "", url);
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [currentAccount, setCurrentAccount] = useState<SubAccount>(getDefaultAccount());
  const [activeSubService, setActiveSubServiceState] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // URL param wins (shared/bookmarked links), then last-used from localStorage
    const params = new URLSearchParams(window.location.search);
    const requestedId = params.get("account") || localStorage.getItem(STORAGE_KEY);
    const found = (requestedId && accounts.find((a) => a.id === requestedId)) || getDefaultAccount();
    setCurrentAccount(found);
    localStorage.setItem(STORAGE_KEY, found.id);
    if (found.subServices?.length) {
      const requestedSub = params.get("sub") || localStorage.getItem(`${SUB_SERVICE_KEY}-${found.id}`);
      const validSub = found.subServices.find((s) => s.id === requestedSub)?.id || found.subServices[0].id;
      setActiveSubServiceState(validSub);
    }
    setLoaded(true);
  }, []);

  // Re-stamp the URL params after every navigation and account/sub change
  useEffect(() => {
    if (!loaded) return;
    syncUrlParams(currentAccount.id, activeSubService);
  }, [loaded, pathname, currentAccount, activeSubService]);

  const setAccount = (id: string) => {
    const found = accounts.find((a) => a.id === id);
    if (found) {
      setCurrentAccount(found);
      localStorage.setItem(STORAGE_KEY, id);
      // Set default sub-service for accounts that have them
      if (found.subServices?.length) {
        const savedSub = localStorage.getItem(`${SUB_SERVICE_KEY}-${found.id}`);
        setActiveSubServiceState(savedSub || found.subServices[0].id);
      } else {
        setActiveSubServiceState(null);
      }
      // If the new account doesn't have the tab we're on, go to Overview
      const currentTab = allTabs.find((t) => t.href !== "/" && pathname.startsWith(t.href));
      if (currentTab && !found.tabs.includes(currentTab.id)) {
        router.push("/");
      }
    }
  };

  const setActiveSubService = (subId: string) => {
    setActiveSubServiceState(subId);
    localStorage.setItem(`${SUB_SERVICE_KEY}-${currentAccount.id}`, subId);
  };

  // Compute the API accountId: for accounts with sub-services, append the sub-service id
  const apiAccountId = activeSubService
    ? `${currentAccount.id}-${activeSubService}`
    : currentAccount.id;

  // Sync CSS custom properties with current account brand colors
  useEffect(() => {
    const root = document.documentElement;
    const { primary, secondary, sidebar, accent } = currentAccount.colors;
    const palette = currentAccount.chartPalette;
    root.style.setProperty("--primary", primary);
    root.style.setProperty("--secondary", secondary);
    root.style.setProperty("--ring", primary);
    root.style.setProperty("--sidebar-bg", sidebar);
    root.style.setProperty("--sidebar-accent", accent);
    root.style.setProperty("--chart-primary", primary);
    root.style.setProperty("--chart-accent-1", secondary);
    // Set chart accent palette from account
    for (let i = 0; i < 6; i++) {
      root.style.setProperty(`--chart-accent-${i + 1}`, palette[i + 1] || palette[i % palette.length]);
    }
    root.style.setProperty("--positive", currentAccount.positiveColor);
  }, [currentAccount]);

  if (!loaded) return null;

  return (
    <AccountContext.Provider value={{ currentAccount, setAccount, allAccounts: accounts, activeSubService, setActiveSubService, apiAccountId }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) throw new Error("useAccount must be used within AccountProvider");
  return context;
}
