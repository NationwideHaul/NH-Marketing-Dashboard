import { SlidersHorizontal } from "lucide-react";

export default function ServicesSettingsPage() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
      <SlidersHorizontal className="mx-auto h-10 w-10 text-muted-foreground" />
      <h2 className="mt-3 text-lg font-bold text-card-foreground">Services & Costs</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Edit cost per lead, annual cost, budgets, and renewal dates for each platform — coming
        next. For now these live in the Budget tab and in each account&apos;s config.
      </p>
    </div>
  );
}
