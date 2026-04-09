"use client";

import { TrendingUp } from "lucide-react";
import type { WidgetConfig } from "@/types/widget";

export function SectionHeaderWidget({ config }: { config: WidgetConfig }) {
  return (
    <div className="flex items-center gap-4 h-full px-1">
      <div className="rounded-lg bg-primary/10 p-2.5">
        <TrendingUp className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-lg font-bold text-foreground">{config.sectionTitle || config.title}</h3>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
