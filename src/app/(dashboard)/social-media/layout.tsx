"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const subTabs = [
  { label: "Facebook", href: "/social-media" },
  { label: "Instagram", href: "/social-media/instagram" },
  { label: "YouTube", href: "/social-media/youtube" },
  { label: "LinkedIn", href: "/social-media/linkedin" },
];

export default function SocialMediaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Social Media</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Organic social performance and content
        </p>
        <div className="flex gap-1 border-b border-border">
          {subTabs.map((tab) => {
            const isActive =
              pathname === tab.href ||
              (tab.href !== "/social-media" && pathname.startsWith(tab.href));
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
      {children}
    </div>
  );
}
