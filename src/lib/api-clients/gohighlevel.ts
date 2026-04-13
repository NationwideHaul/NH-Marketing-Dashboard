// Go High Level v1 API client — email marketing / CRM

const GHL_BASE_URL = "https://rest.gohighlevel.com/v1";

function getHeaders(apiKey: string) {
  if (!apiKey) throw new Error("GHL API key not configured");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

async function ghlFetch(path: string, apiKey: string) {
  const res = await fetch(`${GHL_BASE_URL}${path}`, { headers: getHeaders(apiKey) });
  if (!res.ok) {
    throw new Error(`GHL API error: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

// Contacts — supports date filtering via `startDate` / `endDate` (ms timestamps)
export async function getContacts(
  apiKey: string,
  locationId: string,
  opts: { limit?: number; startDate?: number; endDate?: number } = {}
) {
  const { limit = 100, startDate, endDate } = opts;
  const params = new URLSearchParams({ locationId, limit: String(limit) });
  if (startDate) params.set("startDate", String(startDate));
  if (endDate) params.set("endDate", String(endDate));
  return ghlFetch(`/contacts/?${params.toString()}`, apiKey);
}

export async function getCampaigns(apiKey: string, locationId: string) {
  return ghlFetch(`/campaigns/?locationId=${locationId}`, apiKey);
}

export async function getOpportunitiesPipelines(apiKey: string, locationId: string) {
  return ghlFetch(`/pipelines/?locationId=${locationId}`, apiKey);
}

// Summary stats for a location scoped to a date range.
// Returns totals + in-range deltas for whatever GHL v1 exposes.
export async function getLocationStats(
  apiKey: string,
  locationId: string,
  rangeStartMs?: number,
  rangeEndMs?: number
) {
  // Total contacts (all-time): cheapest as meta.total from a limit=1 call
  const totalResp = await getContacts(apiKey, locationId, { limit: 1 });
  const totalContacts = totalResp.meta?.total || 0;

  // New contacts in range (by dateAdded)
  let newContacts = 0;
  if (rangeStartMs && rangeEndMs) {
    try {
      const rangeResp = await getContacts(apiKey, locationId, {
        limit: 1,
        startDate: rangeStartMs,
        endDate: rangeEndMs,
      });
      newContacts = rangeResp.meta?.total || 0;
    } catch {
      newContacts = 0;
    }
  }

  // Campaigns metadata (counts + names) — v1 exposes the list but not send stats
  let campaigns: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    const cpResp = await getCampaigns(apiKey, locationId);
    campaigns = cpResp.campaigns || [];
  } catch { /* some locations return 404 for campaigns */ }

  // Opportunities / pipelines — deals inside each pipeline stage
  let pipelineCount = 0;
  let opportunityCount = 0;
  try {
    const opResp = await getOpportunitiesPipelines(apiKey, locationId);
    const pipelines = opResp.pipelines || [];
    pipelineCount = pipelines.length;
    for (const p of pipelines) {
      opportunityCount += (p.stages || []).reduce(
        (s: number, st: any) => s + (st.opportunities?.length || 0), // eslint-disable-line @typescript-eslint/no-explicit-any
        0
      );
    }
  } catch { /* pipelines not exposed on this plan */ }

  return {
    totalContacts,
    newContacts,
    totalCampaigns: campaigns.length,
    campaigns: campaigns.slice(0, 20).map((c: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      id: c.id,
      name: c.name,
      status: c.status,
    })),
    // GHL v1 does not expose email open/click rates at the location level —
    // leave these null so widgets can show "N/A" instead of 0 (misleading).
    emailsSent: null,
    openRate: null,
    clickRate: null,
    bounces: null,
    unsubscribes: null,
    pipelineCount,
    opportunityCount,
  };
}
