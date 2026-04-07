"use client";

import { DollarSign } from "lucide-react";
import { PlatformPage } from "@/components/dashboard/platform-page";
import { chartConfigs } from "@/lib/chart-configs";

export default function GoogleAdsPage() {
  return (
    <PlatformPage
      title="Google Ads"
      description="Paid search campaign performance"
      icon={DollarSign}
      platform="google-ads"
      chartConfigs={chartConfigs["google-ads"]}
    />
  );
}
