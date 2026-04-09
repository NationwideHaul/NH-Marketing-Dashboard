"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Globe, Check } from "lucide-react";
import { useAccount } from "@/context/account-context";
import { cn } from "@/lib/utils";

export function SubServiceToggle() {
  const { currentAccount, activeSubService, setActiveSubService } = useAccount();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!currentAccount.subServices?.length) return null;

  const active = currentAccount.subServices.find((s) => s.id === activeSubService) || currentAccount.subServices[0];

  return (
    <div ref={ref} className="relative">
      {/* Dropdown trigger -- fits in header bar */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition-all",
          "bg-white hover:border-primary",
          open ? "border-primary ring-2 ring-primary/20" : "border-border"
        )}
      >
        <Globe className="h-3.5 w-3.5 text-primary" />
        <span className="font-bold text-foreground">{active.name}</span>
        <span className="text-[10px] text-muted-foreground">{active.website}</span>
        <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[300px] rounded-lg border border-border bg-white shadow-lg">
          <div className="px-3 py-2 border-b border-border">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Switch Property</span>
          </div>
          {currentAccount.subServices.map((sub) => {
            const isActive = sub.id === activeSubService;
            return (
              <button
                key={sub.id}
                onClick={() => { setActiveSubService(sub.id); setOpen(false); }}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors last:rounded-b-lg",
                  isActive ? "bg-primary/5" : "hover:bg-gray-50"
                )}
              >
                <Globe className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground">{sub.name}</div>
                  <div className="text-xs text-muted-foreground">{sub.website}</div>
                </div>
                {isActive && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
