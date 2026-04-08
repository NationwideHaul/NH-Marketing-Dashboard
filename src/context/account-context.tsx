"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { accounts, getDefaultAccount, type SubAccount } from "@/lib/accounts";

interface AccountContextType {
  currentAccount: SubAccount;
  setAccount: (id: string) => void;
  allAccounts: SubAccount[];
}

const AccountContext = createContext<AccountContextType | null>(null);

const STORAGE_KEY = "nh-current-account";

export function AccountProvider({ children }: { children: ReactNode }) {
  const [currentAccount, setCurrentAccount] = useState<SubAccount>(getDefaultAccount());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY);
    if (savedId) {
      const found = accounts.find((a) => a.id === savedId);
      if (found) setCurrentAccount(found);
    }
    setLoaded(true);
  }, []);

  const setAccount = (id: string) => {
    const found = accounts.find((a) => a.id === id);
    if (found) {
      setCurrentAccount(found);
      localStorage.setItem(STORAGE_KEY, id);
    }
  };

  if (!loaded) return null;

  return (
    <AccountContext.Provider value={{ currentAccount, setAccount, allAccounts: accounts }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) throw new Error("useAccount must be used within AccountProvider");
  return context;
}
