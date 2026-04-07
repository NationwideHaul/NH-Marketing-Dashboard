// Go High Level API client for email marketing / CRM

const GHL_BASE_URL = "https://rest.gohighlevel.com/v1";

function getHeaders() {
  const apiKey = process.env.GHL_API_KEY;
  if (!apiKey) throw new Error("GHL_API_KEY not configured");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

// Get contacts
export async function getContacts(
  locationId: string,
  limit: number = 100
) {
  const response = await fetch(
    `${GHL_BASE_URL}/contacts/?locationId=${locationId}&limit=${limit}`,
    { headers: getHeaders() }
  );

  if (!response.ok) {
    throw new Error(`GHL API error: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

// Get campaigns/emails
export async function getCampaigns(locationId: string) {
  const response = await fetch(
    `${GHL_BASE_URL}/campaigns/?locationId=${locationId}`,
    { headers: getHeaders() }
  );

  if (!response.ok) {
    throw new Error(`GHL API error: ${response.status}`);
  }

  return response.json();
}

// Get email stats for a campaign
export async function getCampaignStats(campaignId: string) {
  const response = await fetch(
    `${GHL_BASE_URL}/campaigns/${campaignId}`,
    { headers: getHeaders() }
  );

  if (!response.ok) {
    throw new Error(`GHL API error: ${response.status}`);
  }

  return response.json();
}

// Get opportunities (leads/pipeline)
export async function getOpportunities(
  locationId: string,
  limit: number = 100
) {
  const response = await fetch(
    `${GHL_BASE_URL}/pipelines/?locationId=${locationId}`,
    { headers: getHeaders() }
  );

  if (!response.ok) {
    throw new Error(`GHL API error: ${response.status}`);
  }

  return response.json();
}

// Get location stats (contacts, conversations, etc.)
export async function getLocationStats(locationId: string) {
  const contacts = await getContacts(locationId, 1);
  const campaigns = await getCampaigns(locationId);

  return {
    totalContacts: contacts.meta?.total || 0,
    totalCampaigns: campaigns.campaigns?.length || 0,
  };
}
