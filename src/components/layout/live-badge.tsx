"use client";

import useSWR from "swr";
import { format } from "date-fns";
import { useDateRange } from "@/context/date-range-context";
import { useAccount } from "@/context/account-context";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).catch(() => ({ status: "error" }));

// Small connection-status pill (like the inventory "CRM Live" badge). Probes the
// given API route for the current account/date range and reflects whether the
// connection is returning live data.
export function LiveBadge({ route, label }: { route: string; label: string }) {
  const { dateRange } = useDateRange();
  const { apiAccountId } = useAccount();
  const startDate = format(dateRange.from, "yyyy-MM-dd");
  const endDate = format(dateRange.to, "yyyy-MM-dd");
  const sep = route.includes("?") ? "&" : "?";
  const { data, isLoading } = useSWR(
    `${route}${sep}startDate=${startDate}&endDate=${endDate}&accountId=${apiAccountId}`,
    fetcher,
    { refreshInterval: 300000, revalidateOnFocus: false, dedupingInterval: 60000 },
  );

  const isLive = data?.status === "live";

  if (isLoading && !data) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-pulse" /> Checking…
      </span>
    );
  }

  if (isLive) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> {label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium" title={data?.message || data?.error || "Not returning live data"}>
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Not connected
    </span>
  );
}
