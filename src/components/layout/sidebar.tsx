"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  BarChart3,
  DollarSign,
  MapPin,
  Share2,
  PhoneCall,
  Megaphone,
  Mail,
  Wallet,
  ChevronDown,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Google Analytics", href: "/google-analytics", icon: BarChart3 },
  { label: "Google Ads", href: "/google-ads", icon: DollarSign },
  { label: "Google My Business", href: "/gmb", icon: MapPin },
  { label: "Social Media", href: "/social-media", icon: Share2 },
  { label: "Meta Ads", href: "/meta-ads", icon: Megaphone },
  { label: "Call Logs", href: "/call-logs", icon: PhoneCall },
  { label: "Email Marketing", href: "/go-high-level", icon: Mail },
  { label: "Budget", href: "/budget", icon: Wallet },
];

const accounts = [
  { id: "nationwide-haul", label: "Nationwide Haul", shortLabel: "NH" },
  { id: "nfi-truck-sales", label: "NFI Truck Sales", shortLabel: "NFI" },
  { id: "nhttr", label: "NHTTR", shortLabel: "NHTTR" },
  { id: "road-ready", label: "Road Ready Insurance", shortLabel: "RRI" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [currentAccount, setCurrentAccount] = useState(accounts[0]);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar-bg text-sidebar-foreground">
      {/* Account Switcher */}
      <div className="relative">
        <button
          onClick={() => setShowAccountSwitcher(!showAccountSwitcher)}
          className="flex w-full items-center gap-3 px-4 py-3 border-b border-sidebar-muted hover:bg-sidebar-muted transition-colors"
        >
          <img
            src="/nh-logo.png"
            alt={currentAccount.label}
            width={32}
            height={32}
            className="rounded"
          />
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold truncate">{currentAccount.label}</p>
            <p className="text-[10px] text-sidebar-foreground/50">Marketing Dashboard</p>
          </div>
          <ChevronDown className={cn("h-3.5 w-3.5 text-sidebar-foreground/50 transition-transform", showAccountSwitcher && "rotate-180")} />
        </button>

        {showAccountSwitcher && (
          <div className="absolute left-2 right-2 top-full mt-1 z-50 rounded-md border border-sidebar-muted bg-sidebar-bg shadow-lg overflow-hidden">
            <div className="px-3 py-1.5 text-[10px] font-medium text-sidebar-foreground/40 uppercase tracking-wider">
              Switch Account
            </div>
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => { setCurrentAccount(acc); setShowAccountSwitcher(false); }}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors",
                  acc.id === currentAccount.id
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-muted"
                )}
              >
                <span className="w-6 h-6 rounded bg-sidebar-muted/50 flex items-center justify-center text-[10px] font-bold">
                  {acc.shortLabel}
                </span>
                <span className="flex-1 text-left truncate">{acc.label}</span>
                {acc.id === currentAccount.id && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-white font-medium"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-6 py-3 border-t border-sidebar-muted text-xs text-sidebar-foreground/50">
        nationwidehaul.com
      </div>
    </aside>
  );
}
