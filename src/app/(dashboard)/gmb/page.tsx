"use client";

import { useState } from "react";
import { MapPin, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";
import { WidgetPage } from "@/components/widgets/widget-page";
import { useAccount } from "@/context/account-context";
import { cn } from "@/lib/utils";

function GMBHeader() {
  const { currentAccount, activeSubService } = useAccount();
  const allLocations = currentAccount.gmbLocations;

  // Filter by sub-service if applicable
  const locations = activeSubService
    ? allLocations?.filter((loc) => loc.subServiceId === activeSubService)
    : allLocations;

  const [selectedId, setSelectedId] = useState<string | "all">("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!locations?.length) return null;

  const selectedLocation = selectedId === "all" ? null : locations.find((l) => l.id === selectedId);
  const displayName = selectedLocation ? selectedLocation.name : "All Locations";

  return (
    <div className="mb-4">
      {/* Location Dropdown */}
      <div className="relative mb-4">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-3 w-full rounded-xl border border-border bg-card px-4 py-3 hover:bg-muted/30 transition-colors"
        >
          <div className="rounded-lg bg-primary/10 p-2">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-foreground">{displayName}</p>
            <p className="text-xs text-muted-foreground">
              {selectedLocation ? selectedLocation.address : `${locations.length} locations`}
            </p>
          </div>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", dropdownOpen && "rotate-180")} />
        </button>

        {dropdownOpen && (
          <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
            {/* All Locations option */}
            <button
              onClick={() => { setSelectedId("all"); setDropdownOpen(false); }}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-muted/30 transition-colors border-b border-border",
                selectedId === "all" && "bg-primary/5"
              )}
            >
              <MapPin className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">All Locations</p>
                <p className="text-xs text-muted-foreground">{locations.length} locations combined</p>
              </div>
              {selectedId === "all" && <CheckCircle2 className="h-4 w-4 text-primary" />}
            </button>

            {/* Individual locations */}
            {locations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => { setSelectedId(loc.id); setDropdownOpen(false); }}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-muted/30 transition-colors border-b border-border last:border-b-0",
                  selectedId === loc.id && "bg-primary/5"
                )}
              >
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{loc.name}</p>
                  <p className="text-xs text-muted-foreground">{loc.address}</p>
                </div>
                <div className="flex items-center gap-2">
                  {loc.verified ? (
                    <span className="text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Verified
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Unverified
                    </span>
                  )}
                  {selectedId === loc.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected location card */}
      {selectedLocation && (
        <div className="rounded-xl border border-border bg-card p-4 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-bold text-card-foreground">{selectedLocation.name}</p>
                <p className="text-xs text-muted-foreground">{selectedLocation.address}</p>
              </div>
            </div>
            {selectedLocation.verified ? (
              <span className="flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" /> Verified
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <AlertCircle className="h-3 w-3" /> Needs Verification
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Location ID: {selectedLocation.id}</p>
        </div>
      )}

      {/* Verification warning if any unverified */}
      {locations.some((loc) => !loc.verified) && (selectedId === "all" || !selectedLocation?.verified) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-800">Location Verification Required</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Some locations need verification in Google Business Profile before analytics data will appear.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GMBPage() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-foreground">Google My Business</h2>
        <p className="text-sm text-muted-foreground">
          Local presence, profile views, calls, directions, and reviews
        </p>
      </div>
      <GMBHeader />
      <WidgetPage />
    </div>
  );
}
