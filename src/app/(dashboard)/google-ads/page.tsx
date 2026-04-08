"use client";

import { WidgetPage } from "@/components/widgets/widget-page";
import { SubServiceToggle } from "@/components/layout/sub-service-toggle";

export default function GoogleAdsPage() {
  return (
    <WidgetPage
      title="Google Ads"
      description="Paid search campaigns, clicks, conversions, and budget"
      headerContent={<SubServiceToggle />}
    />
  );
}
