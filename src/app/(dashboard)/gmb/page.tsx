"use client";

import { MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { WidgetPage } from "@/components/widgets/widget-page";
import { useAccount } from "@/context/account-context";
import { cn } from "@/lib/utils";

function GMBLocationCards() {
  const { currentAccount, activeSubService } = useAccount();
  const allLocations = currentAccount.gmbLocations;

  if (!allLocations?.length) return null;

  // Filter by active sub-service if the account has sub-services
  const locations = activeSubService
    ? allLocations.filter((loc) => loc.subServiceId === activeSubService)
    : allLocations;

  if (locations.length === 0) return null;

  return (
    <div className="mb-4">
      {/* Location Card(s) */}
      <div className={cn("grid gap-3 mb-4", locations.length > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 max-w-lg")}>
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="rounded-lg border border-border bg-card p-4"
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
          </div>
        ))}
      </div>

      {/* Verification Warning -- only show if current filtered locations have unverified ones */}
      {locations.some((loc) => !loc.verified) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-800">Location Verification Required</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                This location needs to be verified in Google Business Profile before analytics data will appear.
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
  const { currentAccount, activeSubService } = useAccount();
  const allLocations = currentAccount.gmbLocations;
  const locations = activeSubService
    ? allLocations?.filter((loc) => loc.subServiceId === activeSubService)
    : allLocations;
  const hasLocations = (locations?.length || 0) > 0;
  const locationCount = locations?.length || 0;

  // Get active sub-service name for title
  const activeSub = activeSubService
    ? currentAccount.subServices?.find((s) => s.id === activeSubService)
    : null;

  return (
    <div>
      {hasLocations && (
        <div className="mb-4">
          <h2 className="text-lg font-bold text-foreground">Google My Business</h2>
          <p className="text-sm text-muted-foreground">
            {activeSub ? `${activeSub.name} -- ` : ""}{locationCount} location{locationCount > 1 ? "s" : ""} -- local presence, profile views, calls, directions, and reviews
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
