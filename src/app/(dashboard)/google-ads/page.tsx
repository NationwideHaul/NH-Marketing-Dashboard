"use client";

import { WidgetPage } from "@/components/widgets/widget-page";
import { LiveBadge } from "@/components/layout/live-badge";

export default function GoogleAdsPage() {
  return (
    <WidgetPage
      title="Google Ads"
      description="Paid search campaigns, clicks, conversions, and budget"
      headerBadge={<LiveBadge route="/api/google-ads" label="Google Ads Live" />}
    />
  );
}
