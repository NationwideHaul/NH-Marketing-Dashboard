"use client";

interface EngagementItem {
  label: string;
  value: number;
  maxValue?: number;
}

interface EngagementBarsProps {
  title: string;
  items: EngagementItem[];
}

export function EngagementBars({ title, items }: EngagementBarsProps) {
  const maxVal = Math.max(...items.map((i) => i.maxValue ?? i.value));

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-medium text-card-foreground mb-4">{title}</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-card-foreground">{item.label}</span>
              <span className="text-sm font-semibold text-card-foreground">
                {item.value.toLocaleString()}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.max(2, (item.value / maxVal) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
