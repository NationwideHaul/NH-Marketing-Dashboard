// LinkedIn API client for organic + company page analytics

import { getCredential } from "@/lib/credential-store";

const LI_BASE_URL = "https://api.linkedin.com/v2";

async function getHeaders() {
  const { value: token } = await getCredential("LINKEDIN_ACCESS_TOKEN");
  if (!token) throw new Error("LINKEDIN_ACCESS_TOKEN not configured");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-Restli-Protocol-Version": "2.0.0",
  };
}

// Get organization (company page) info
export async function getOrganization(organizationId: string) {
  const response = await fetch(
    `${LI_BASE_URL}/organizations/${organizationId}`,
    { headers: await getHeaders() }
  );

  if (!response.ok) {
    throw new Error(`LinkedIn API error: ${response.status}`);
  }

  return response.json();
}

// Get follower statistics
export async function getFollowerStats(organizationId: string) {
  const response = await fetch(
    `${LI_BASE_URL}/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${organizationId}`,
    { headers: await getHeaders() }
  );

  if (!response.ok) {
    throw new Error(`LinkedIn API error: ${response.status}`);
  }

  return response.json();
}

// Get page statistics (impressions, clicks, etc.)
export async function getPageStats(
  organizationId: string,
  startDate: number, // Unix timestamp in ms
  endDate: number
) {
  const response = await fetch(
    `${LI_BASE_URL}/organizationPageStatistics?q=organization&organization=urn:li:organization:${organizationId}&timeIntervals.timeGranularityType=DAY&timeIntervals.timeRange.start=${startDate}&timeIntervals.timeRange.end=${endDate}`,
    { headers: await getHeaders() }
  );

  if (!response.ok) {
    throw new Error(`LinkedIn API error: ${response.status}`);
  }

  return response.json();
}

// Get share (post) statistics
export async function getShareStats(
  organizationId: string,
  startDate: number,
  endDate: number
) {
  const response = await fetch(
    `${LI_BASE_URL}/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${organizationId}&timeIntervals.timeGranularityType=DAY&timeIntervals.timeRange.start=${startDate}&timeIntervals.timeRange.end=${endDate}`,
    { headers: await getHeaders() }
  );

  if (!response.ok) {
    throw new Error(`LinkedIn API error: ${response.status}`);
  }

  return response.json();
}
