"use client";

import { WidgetPage } from "@/components/widgets/widget-page";

export default function CallLogsPage() {
  return (
    <WidgetPage
      filter="callrail"
      title="Call Logs"
      description="RingCentral call logs + CallRail marketing source tracking — add widgets to customize"
    />
  );
}
