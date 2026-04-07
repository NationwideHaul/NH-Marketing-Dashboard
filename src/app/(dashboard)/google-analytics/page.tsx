"use client";

import { BarChart3 } from "lucide-react";
import { PlatformPage } from "@/components/dashboard/platform-page";
import { chartConfigs } from "@/lib/chart-configs";

export default function GoogleAnalyticsPage() {
  return (
    <PlatformPage
      title="Google Analytics"
      description="Website traffic and user behavior"
      icon={BarChart3}
      platform="google-analytics"
      chartConfigs={chartConfigs["google-analytics"]}
    />
  );
}
