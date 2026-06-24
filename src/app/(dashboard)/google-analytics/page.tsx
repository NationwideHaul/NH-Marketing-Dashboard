"use client";

import { WidgetPage } from "@/components/widgets/widget-page";
import { LiveBadge } from "@/components/layout/live-badge";

export default function GoogleAnalyticsPage() {
  return (
    <WidgetPage
      title="Google Analytics"
      description="Website traffic, engagement, and user behavior"
      headerBadge={<LiveBadge route="/api/google-analytics" label="Google Analytics Live" />}
    />
  );
}
