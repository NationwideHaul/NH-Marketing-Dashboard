"use client";

import { Phone } from "lucide-react";
import { PlatformPage } from "@/components/dashboard/platform-page";
import { chartConfigs } from "@/lib/chart-configs";

export default function RingCentralPage() {
  return (
    <PlatformPage
      title="RingCentral"
      description="Call tracking and phone analytics"
      icon={Phone}
      platform="ringcentral"
      chartConfigs={chartConfigs.ringcentral}
    />
  );
}
