"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, BarChart3, DollarSign, MapPin, Share2,
  PhoneCall, Megaphone, Layers, Mail, Wallet, TrendingUp, Link2, ChevronDown, Check,
  PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccount } from "@/context/account-context";
import { allTabs } from "@/lib/accounts";

const iconMap: Record<string, any> = { // eslint-disable-line @typescript-eslint/no-explicit-any
  LayoutDashboard, BarChart3, DollarSign, MapPin, Share2,
  PhoneCall, Megaphone, Layers, Mail, Wallet, TrendingUp, Link2,
};

const STORAGE_KEY = "nh-sidebar-collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const { currentAccount, setAccount, allAccounts } = useAccount();
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, String(next));
    // Close switcher when collapsing
    if (next) setShowSwitcher(false);
  };

  // Filter tabs based on current account
  const visibleTabs = allTabs.filter((tab) => currentAccount.tabs.includes(tab.id));

  return (
    <aside
      className={cn(
        "flex h-screen flex-col text-white transition-all duration-300 ease-in-out shrink-0 overflow-hidden",
        collapsed ? "w-[68px]" : "w-64"
      )}
      style={{ backgroundColor: currentAccount.colors.sidebar }}
    >
      {/* Account Switcher */}
      <div className="relative">
        <button
          onClick={() => { if (!collapsed) setShowSwitcher(!showSwitcher); }}
          className={cn(
            "flex w-full items-center gap-3 border-b border-white/10 hover:bg-white/5 transition-colors",
            collapsed ? "justify-center px-2 py-4" : "px-4 py-4"
          )}
        >
          <img
            src={currentAccount.logo}
            alt={currentAccount.name}
            width={collapsed ? 32 : 36}
            height={collapsed ? 32 : 36}
            className="rounded-lg shrink-0"
          />
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-bold truncate">{currentAccount.name}</p>
                <p className="text-[11px] text-white/50">Marketing Dashboard</p>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-white/50 transition-transform duration-200", showSwitcher && "rotate-180")} />
            </>
          )}
        </button>

        {/* Flyout panel */}
        {showSwitcher && !collapsed && (
          <>
            <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setShowSwitcher(false)} />

            <div className="absolute left-0 right-0 top-full z-50 rounded-b-2xl border border-white/10 border-t-0 bg-[#111318]/95 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10">
                <p className="text-sm font-bold text-white/90 tracking-wide">Switch Account</p>
                <p className="text-xs text-white/40 mt-0.5">Select a business to manage</p>
              </div>

              <div className="py-1">
                {allAccounts.map((acc) => {
                  const isSelected = acc.id === currentAccount.id;
                  return (
                    <button
                      key={acc.id}
                      onClick={() => { setAccount(acc.id); setShowSwitcher(false); }}
                      className={cn(
                        "flex items-center gap-3 w-full px-4 py-4 transition-all",
                        isSelected
                          ? "bg-white/10"
                          : "hover:bg-white/5"
                      )}
                    >
                      <div className="rounded-xl overflow-hidden border border-white/10 bg-white/5 p-1.5 shrink-0">
                        <img
                          src={acc.logo}
                          alt={acc.name}
                          width={36}
                          height={36}
                          className="rounded-lg"
                        />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className={cn(
                          "text-sm font-semibold truncate",
                          isSelected ? "text-white" : "text-white/70"
                        )}>
                          {acc.name}
                        </p>
                        <p className="text-xs text-white/35 truncate">
                          {acc.website}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="rounded-full h-6 w-6 flex items-center justify-center shrink-0" style={{ backgroundColor: acc.colors.primary }}>
                          <Check className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-1">
          {visibleTabs.map((tab) => {
            const Icon = iconMap[tab.icon] || LayoutDashboard;
            const isActive = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
            const showDivider = tab.id === "roi-metrics";

            return (
              <li key={tab.id}>
                {showDivider && <div className="my-2 mx-2 h-px bg-white/10" />}
                <Link
                  href={tab.href}
                  title={collapsed ? tab.label : undefined}
                  className={cn(
                    "flex items-center rounded-lg transition-colors",
                    collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
                    isActive
                      ? "text-white font-medium"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  )}
                  style={isActive ? { backgroundColor: currentAccount.colors.accent } : {}}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="text-sm whitespace-nowrap">{tab.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse toggle + footer */}
      <div className="border-t border-white/10">
        <button
          onClick={toggleCollapsed}
          className="flex items-center gap-2 w-full px-3 py-2.5 text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4 mx-auto" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
        {!collapsed && (
          <div className="px-6 py-2 text-xs text-white/40">
            {currentAccount.website}
          </div>
        )}
      </div>
    </aside>
  );
}
