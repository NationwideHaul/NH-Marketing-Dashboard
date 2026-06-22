// Canonical CRM lead-source names.
//
// The CRM's /api/marketing/summary endpoint returns raw `source_platform` strings
// that still contain duplicates and host/email variants — e.g. "Answer Connect" vs
// "AnswerConnect", "Meta Ads" vs "Facebook Ads", and several website spellings
// ("nationwidehaul.com", "inventory.nationwidehaul.com", "Nationwide Haul Website").
// Left as-is these fragment the "Leads by Source" chart/table and split counts.
//
// Normalizing here keeps the dashboard's source views and the inventory-platform
// mapping consistent. It is idempotent, so it stays correct once the CRM collapses
// these names at the source too.

export function normalizeCRMSource(raw: string): string {
  const s = (raw ?? "").trim();
  if (!s) return "Direct/Other";
  const lower = s.toLowerCase();
  const compact = lower.replace(/\s+/g, "");

  // Listing marketplaces
  if (lower.includes("commercial truck trader") || compact === "commercialtrucktrader" || lower === "ctt") return "Commercial Truck Trader";
  if (lower.includes("truckpaper") || lower === "truck paper" || lower === "truck paper.com") return "TruckPaper";
  if (lower.includes("my little salesman") || compact === "mylittlesalesman") return "My Little Salesman";
  if (lower.includes("tractorhouse")) return "TractorHouse";
  if (lower.includes("rentalyard")) return "Rentalyard";
  if (lower.includes("mascus")) return "Mascus";

  // Paid social — Meta Ads and Facebook Ads are the same channel
  if (lower.includes("meta") || lower.includes("facebook")) return "Meta Ads";

  // Answering service (handles "AnswerConnect" and "Answer Connect")
  if (compact === "answerconnect") return "AnswerConnect";

  // Web form tools / form submissions
  if (lower.includes("formsubmit")) return "FormSubmit";
  if (lower.includes("cognito")) return "CognitoForms";

  // Internal marketing mailbox leaking in as a source — check before the website
  // host match below, since the address contains "nationwidehaul.com".
  if (lower.includes("marketing@nationwidehaul") || lower === "email marketing") return "Email Marketing";

  // Websites
  if (lower.includes("nfitrucksales") || lower === "nfi website" || lower === "nfi-website") return "NFI Website";
  if (
    lower.includes("nationwidehaul.com") ||
    lower.includes("inventory.nationwidehaul") ||
    lower === "nationwide haul website" ||
    lower === "nationwide haul" ||
    lower === "nh-website"
  ) return "Nationwide Haul Website";

  // Phone systems
  if (lower.includes("ringcentral")) return "RingCentral";
  if (lower.includes("callrail")) return "CallRail";

  return s;
}

// Collapse a raw bySource map into canonical names, summing duplicate counts.
export function aggregateBySource(bySource: Record<string, number>): Record<string, number> {
  const merged: Record<string, number> = {};
  for (const [raw, count] of Object.entries(bySource ?? {})) {
    const name = normalizeCRMSource(raw);
    merged[name] = (merged[name] ?? 0) + count;
  }
  return merged;
}
