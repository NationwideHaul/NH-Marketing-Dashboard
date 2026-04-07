"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  DollarSign,
  MapPin,
  Share2,
  Phone,
  Mail,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Google Analytics", href: "/google-analytics", icon: BarChart3 },
  { label: "Google Ads", href: "/google-ads", icon: DollarSign },
  { label: "Google My Business", href: "/gmb", icon: MapPin },
  { label: "Social Media", href: "/social-media", icon: Share2 },
  { label: "RingCentral", href: "/ringcentral", icon: Phone },
  { label: "Go High Level", href: "/go-high-level", icon: Mail },
  { label: "Budget", href: "/budget", icon: Wallet },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar-bg text-sidebar-foreground">
      <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-muted">
        <img
          src="/nh-logo.png"
          alt="Nationwide Haul"
          width={36}
          height={36}
          className="rounded"
        />
        <span className="text-sm font-semibold tracking-tight">
          NH Marketing
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
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

      <div className="px-6 py-4 border-t border-sidebar-muted text-xs text-sidebar-foreground/50">
        nationwidehaul.com
      </div>
    </aside>
  );
}
