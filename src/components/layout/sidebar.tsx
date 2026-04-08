"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, BarChart3, DollarSign, MapPin, Share2,
  PhoneCall, Megaphone, Layers, Mail, Wallet, ChevronDown, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccount } from "@/context/account-context";
import { allTabs } from "@/lib/accounts";

const iconMap: Record<string, any> = { // eslint-disable-line @typescript-eslint/no-explicit-any
  LayoutDashboard, BarChart3, DollarSign, MapPin, Share2,
  PhoneCall, Megaphone, Layers, Mail, Wallet,
};

export function Sidebar() {
  const pathname = usePathname();
  const { currentAccount, setAccount, allAccounts } = useAccount();
  const [showSwitcher, setShowSwitcher] = useState(false);

  // Filter tabs based on current account
  const visibleTabs = allTabs.filter((tab) => currentAccount.tabs.includes(tab.id));

  return (
    <aside className="flex h-screen w-64 flex-col text-white" style={{ backgroundColor: currentAccount.colors.sidebar }}>
      {/* Account Switcher */}
      <div className="relative">
        <button
          onClick={() => setShowSwitcher(!showSwitcher)}
          className="flex w-full items-center gap-3 px-4 py-3 border-b border-white/10 hover:bg-white/5 transition-colors"
        >
          <img src={currentAccount.logo} alt={currentAccount.name} width={32} height={32} className="rounded" />
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold truncate">{currentAccount.name}</p>
            <p className="text-[10px] text-white/50">Marketing Dashboard</p>
          </div>
          <ChevronDown className={cn("h-3.5 w-3.5 text-white/50 transition-transform", showSwitcher && "rotate-180")} />
        </button>

        {showSwitcher && (
          <div className="absolute left-2 right-2 top-full mt-1 z-50 rounded-md border border-white/10 shadow-lg overflow-hidden" style={{ backgroundColor: currentAccount.colors.sidebar }}>
            <div className="px-3 py-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider">
              Switch Account
            </div>
            {allAccounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => { setAccount(acc.id); setShowSwitcher(false); }}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors",
                  acc.id === currentAccount.id
                    ? "text-white"
                    : "text-white/60 hover:bg-white/5"
                )}
                style={acc.id === currentAccount.id ? { backgroundColor: currentAccount.colors.accent } : {}}
              >
                <img src={acc.logo} alt={acc.name} width={20} height={20} className="rounded" />
                <span className="flex-1 text-left truncate">{acc.name}</span>
                {acc.id === currentAccount.id && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <ul className="space-y-1">
          {visibleTabs.map((tab) => {
            const Icon = iconMap[tab.icon] || LayoutDashboard;
            const isActive = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));

            return (
              <li key={tab.id}>
                <Link
                  href={tab.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "text-white font-medium"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  )}
                  style={isActive ? { backgroundColor: currentAccount.colors.accent } : {}}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-6 py-3 border-t border-white/10 text-xs text-white/40">
        {currentAccount.name.toLowerCase().replace(/\s+/g, "")}.com
      </div>
    </aside>
  );
}
