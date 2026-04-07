"use client";

import { Mail } from "lucide-react";
import { PlatformPage } from "@/components/dashboard/platform-page";
import { chartConfigs } from "@/lib/chart-configs";

export default function GoHighLevelPage() {
  return (
    <PlatformPage
      title="Go High Level"
      description="Email marketing and CRM"
      icon={Mail}
      platform="go-high-level"
      chartConfigs={chartConfigs["go-high-level"]}
    />
  );
}
