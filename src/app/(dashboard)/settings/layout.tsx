"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Link2, SlidersHorizontal, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const settingsTabs = [
  { id: "connections", label: "Connections", href: "/settings/connections", icon: Link2 },
  { id: "services", label: "Services & Costs", href: "/settings/services", icon: SlidersHorizontal },
  { id: "mapping", label: "Campaign Mapping", href: "/settings/mapping", icon: Target },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage integrations, services, and campaign mappings for this dashboard.
        </p>
      </div>

      <nav className="flex gap-1 border-b border-border">
        {settingsTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div>{children}</div>
    </div>
  );
}
