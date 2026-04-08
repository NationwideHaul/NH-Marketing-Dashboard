"use client";

import { ExternalLink, Clock } from "lucide-react";
import { format } from "date-fns";

interface DataSourceBadgeProps {
  sources: { name: string; url: string }[];
}

export function DataSourceBadge({ sources }: DataSourceBadgeProps) {
  const now = format(new Date(), "MMM d, yyyy 'at' h:mm a");

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[10px] text-muted-foreground">
      <span className="flex items-center gap-1">
        <Clock className="h-2.5 w-2.5" /> Last updated: {now}
      </span>
      {sources.map((s) => (
        <a
          key={s.name}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-primary transition-colors"
        >
          <ExternalLink className="h-2.5 w-2.5" />
          {s.name}
        </a>
      ))}
    </div>
  );
}
