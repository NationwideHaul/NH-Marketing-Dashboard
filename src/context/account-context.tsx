"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { accounts, getDefaultAccount, type SubAccount } from "@/lib/accounts";

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

export function AccountProvider({ children }: { children: ReactNode }) {
  const [currentAccount, setCurrentAccount] = useState<SubAccount>(getDefaultAccount());
  const [activeSubService, setActiveSubServiceState] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY);
    if (savedId) {
      const found = accounts.find((a) => a.id === savedId);
      if (found) {
        setCurrentAccount(found);
        // Load saved sub-service for this account
        if (found.subServices?.length) {
          const savedSub = localStorage.getItem(`${SUB_SERVICE_KEY}-${found.id}`);
          setActiveSubServiceState(savedSub || found.subServices[0].id);
        }
      }
    }
    setLoaded(true);
  }, []);

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
