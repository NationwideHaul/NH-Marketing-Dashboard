"use client";

import { useState } from "react";
import { MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { WidgetPage } from "@/components/widgets/widget-page";
import { useAccount } from "@/context/account-context";
import { cn } from "@/lib/utils";

function GMBLocationCards() {
  const { currentAccount } = useAccount();
  const locations = currentAccount.gmbLocations;
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  if (!locations?.length) return null;

  return (
    <div className="mb-4">
      {/* Location Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {locations.map((loc) => (
          <button
            key={loc.id}
            onClick={() => setSelectedLocation(selectedLocation === loc.id ? null : loc.id)}
            className={cn(
              "rounded-lg border p-4 text-left transition-all",
              selectedLocation === loc.id
                ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                : "border-border bg-card hover:border-primary/30"
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-card-foreground">{loc.name}</span>
              </div>
              {loc.verified ? (
                <span className="flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" /> Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  <AlertCircle className="h-3 w-3" /> Needs Verification
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground mb-3">{loc.address}</p>

            <div className="text-[10px] text-muted-foreground">
              Location ID: {loc.id}
            </div>
          </button>
        ))}
      </div>

      {/* Verification Warning */}
      {locations.some((loc) => !loc.verified) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-800">Location Verification Required</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                &quot;RV &amp; Bus Repair &amp; Service&quot; needs to be verified in Google Business Profile before analytics data will appear.
                Visit the Google Business Profile dashboard to complete verification.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GMBPage() {
  const { currentAccount } = useAccount();
  const hasLocations = (currentAccount.gmbLocations?.length || 0) > 0;
  const locationCount = currentAccount.gmbLocations?.length || 0;

  return (
    <div>
      {hasLocations && (
        <div className="mb-4">
          <h2 className="text-lg font-bold text-foreground">Google My Business</h2>
          <p className="text-sm text-muted-foreground">
            {locationCount} location{locationCount > 1 ? "s" : ""} -- local presence, profile views, calls, directions, and reviews
          </p>
        </div>
      )}

      {hasLocations && <GMBLocationCards />}

      <WidgetPage
        title={hasLocations ? undefined : "Google My Business"}
        description={hasLocations ? undefined : "Local presence, profile views, calls, directions, and reviews"}
      />
    </div>
  );
}
