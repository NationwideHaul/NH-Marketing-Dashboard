"use client";

import { WidgetPage } from "@/components/widgets/widget-page";
import { SubServiceToggle } from "@/components/layout/sub-service-toggle";

export default function GoogleAnalyticsPage() {
  return (
    <WidgetPage
      title="Google Analytics"
      description="Website traffic, engagement, and user behavior"
      headerContent={<SubServiceToggle />}
    />
  );
}
