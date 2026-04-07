"use client";

import { MapPin } from "lucide-react";
import { PlatformPage } from "@/components/dashboard/platform-page";
import { SocialPreview } from "@/components/dashboard/social-preview";
import { chartConfigs } from "@/lib/chart-configs";

export default function GMBPage() {
  return (
    <PlatformPage
      title="Google My Business"
      description="Local presence and discovery"
      icon={MapPin}
      platform="gmb"
      chartConfigs={chartConfigs.gmb}
      socialPreview={<SocialPreview platform="gmb" />}
    />
  );
}
