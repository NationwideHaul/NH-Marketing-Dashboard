// Nationwide Haul CRM API client
// Calls the internal CRM marketing summary endpoint at crm-nh.vercel.app

const CRM_BASE_URL = "https://crm-nh.vercel.app/api/marketing";

export interface CRMSummaryResponse {
  period: { start: string; end: string; days: number };
  leads: {
    total: number;
    previousTotal: number;
    changePercent: number;
    bySource: Record<string, number>;
    byType: Record<string, number>;
    byEquipmentType: Record<string, number>;
    timeSeries: Array<{ date: string; value: number }>;
  };
  deals: {
    total: number;
    closedWon: number;
    totalRevenue: number;
    avgDealValue: number;
    closeRate: number;
    previousClosedWon: number;
    previousRevenue: number;
    revenueChangePercent: number;
    timeSeries: Array<{ date: string; value: number }>;
  };
  funnel: {
    totalLeads: number;
    mql: number;
    sql: number;
    closedDeals: number;
  };
}

function getHeaders() {
  const apiKey = process.env.NH_CRM_API_KEY;
  if (!apiKey) throw new Error("NH_CRM_API_KEY not configured");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

// Fetch the full CRM marketing summary
export async function getCRMSummary(
  startDate: string, // YYYY-MM-DD
  endDate: string    // YYYY-MM-DD
): Promise<CRMSummaryResponse> {
  const params = new URLSearchParams({ startDate, endDate });
  const response = await fetch(`${CRM_BASE_URL}/summary?${params}`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error(`NH CRM API error: ${response.status}`);
  return response.json();
}

// KPI-formatted lead metrics for dashboard widgets
export async function getCRMLeadMetrics(startDate: string, endDate: string) {
  const data = await getCRMSummary(startDate, endDate);
  const { leads, period } = data;

  return {
    period,
    totalLeads: leads.total,
    previousTotal: leads.previousTotal,
    changePercent: leads.changePercent,
    bySource: Object.entries(leads.bySource)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count),
    byType: Object.entries(leads.byType)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count),
    byEquipmentType: Object.entries(leads.byEquipmentType)
      .map(([equipmentType, count]) => ({ equipmentType, count }))
      .sort((a, b) => b.count - a.count),
    timeSeries: leads.timeSeries,
  };
}

// KPI-formatted revenue and deal metrics for dashboard widgets
export async function getCRMRevenueMetrics(startDate: string, endDate: string) {
  const data = await getCRMSummary(startDate, endDate);
  const { deals, period } = data;

  return {
    period,
    totalDeals: deals.total,
    closedWon: deals.closedWon,
    totalRevenue: deals.totalRevenue,
    avgDealValue: deals.avgDealValue,
    closeRate: deals.closeRate,
    previousClosedWon: deals.previousClosedWon,
    previousRevenue: deals.previousRevenue,
    revenueChangePercent: deals.revenueChangePercent,
    timeSeries: deals.timeSeries,
  };
}

// Funnel stage metrics for pipeline visualization
export async function getCRMFunnelMetrics(startDate: string, endDate: string) {
  const data = await getCRMSummary(startDate, endDate);
  const { funnel, period } = data;

  const stages = [
    { stage: "Leads", count: funnel.totalLeads },
    { stage: "MQL", count: funnel.mql },
    { stage: "SQL", count: funnel.sql },
    { stage: "Closed Won", count: funnel.closedDeals },
  ];

  const conversionRates = {
    leadToMql: funnel.totalLeads > 0 ? Math.round((funnel.mql / funnel.totalLeads) * 1000) / 10 : 0,
    mqlToSql: funnel.mql > 0 ? Math.round((funnel.sql / funnel.mql) * 1000) / 10 : 0,
    sqlToClose: funnel.sql > 0 ? Math.round((funnel.closedDeals / funnel.sql) * 1000) / 10 : 0,
    overallCloseRate: funnel.totalLeads > 0 ? Math.round((funnel.closedDeals / funnel.totalLeads) * 1000) / 10 : 0,
  };

  return {
    period,
    stages,
    conversionRates,
    raw: funnel,
  };
}
