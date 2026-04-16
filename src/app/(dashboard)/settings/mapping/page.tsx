import { Target } from "lucide-react";

export default function MappingSettingsPage() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
      <Target className="mx-auto h-10 w-10 text-muted-foreground" />
      <h2 className="mt-3 text-lg font-bold text-card-foreground">Campaign Mapping</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Map Meta and Google Ads campaigns to services (e.g. RV vs TTR) without editing code —
        coming next.
      </p>
    </div>
  );
}
