"use client";

import { WidgetPage } from "@/components/widgets/widget-page";
import { EmailStatsHeader } from "@/components/email-marketing/email-stats-header";

export default function EmailMarketingPage() {
  return (
    <WidgetPage
      title="Email Marketing"
      description="Monthly email performance tracking"
      headerContent={<EmailStatsHeader />}
    />
  );
}
