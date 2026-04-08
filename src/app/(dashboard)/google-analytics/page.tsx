"use client";

import { WidgetPage } from "@/components/widgets/widget-page";

export default function GoogleAnalyticsPage() {
  return (
    <WidgetPage
      filter="google-analytics"
      title="Google Analytics"
      description="Website traffic and user behavior — add widgets to customize this view"
    />
  );
}
