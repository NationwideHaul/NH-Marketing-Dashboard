// Account-specific inventory platform configurations
// NH = sales platforms with monthly data from Google Sheet
// NHTTR = breakdown/service listing platforms with annual budgets

export interface PlatformData {
  name: string;
  fullName: string;
  color: string;
  pricePerMonth: number;
  billingCycle: "monthly" | "annual";
  annualCost?: number;
  renewalDate?: string; // "YYYY-MM-DD"
  monthlyData: { month: string; calls: number; infoSubmits: number; leads: number; price: number }[];
}

// Nationwide Haul — sales inventory platforms
const nhPlatforms: PlatformData[] = [
  {
    name: "NH Website",
    fullName: "Nationwide Haul Website",
    color: "#BE1E23",
    pricePerMonth: 195,
    billingCycle: "monthly",
    monthlyData: [
      { month: "Sep 25", calls: 72, infoSubmits: 23, leads: 95, price: 195 },
      { month: "Oct 25", calls: 93, infoSubmits: 23, leads: 116, price: 195 },
      { month: "Nov 25", calls: 68, infoSubmits: 25, leads: 93, price: 195 },
      { month: "Dec 25", calls: 43, infoSubmits: 32, leads: 75, price: 195 },
      { month: "Jan 26", calls: 67, infoSubmits: 38, leads: 105, price: 195 },
      { month: "Feb 26", calls: 83, infoSubmits: 46, leads: 129, price: 195 },
      { month: "Mar 26", calls: 113, infoSubmits: 19, leads: 132, price: 195 },
    ],
  },
  {
    name: "TruckPaper",
    fullName: "Truck Paper General Ad",
    color: "#8C0F14",
    pricePerMonth: 6800,
    billingCycle: "monthly",
    monthlyData: [
      { month: "Sep 25", calls: 74, infoSubmits: 52, leads: 126, price: 6800 },
      { month: "Oct 25", calls: 109, infoSubmits: 36, leads: 145, price: 6800 },
      { month: "Nov 25", calls: 60, infoSubmits: 30, leads: 90, price: 6800 },
      { month: "Dec 25", calls: 78, infoSubmits: 45, leads: 123, price: 6800 },
      { month: "Jan 26", calls: 91, infoSubmits: 59, leads: 150, price: 6800 },
      { month: "Feb 26", calls: 81, infoSubmits: 53, leads: 134, price: 6800 },
      { month: "Mar 26", calls: 107, infoSubmits: 60, leads: 167, price: 6800 },
    ],
  },
  {
    name: "My Little Salesman",
    fullName: "My Little Salesman",
    color: "#D97706",
    pricePerMonth: 895,
    billingCycle: "monthly",
    monthlyData: [
      { month: "Sep 25", calls: 4, infoSubmits: 4, leads: 8, price: 895 },
      { month: "Oct 25", calls: 10, infoSubmits: 4, leads: 14, price: 895 },
      { month: "Nov 25", calls: 8, infoSubmits: 2, leads: 10, price: 895 },
      { month: "Dec 25", calls: 7, infoSubmits: 5, leads: 12, price: 895 },
      { month: "Jan 26", calls: 8, infoSubmits: 11, leads: 19, price: 895 },
      { month: "Feb 26", calls: 7, infoSubmits: 6, leads: 13, price: 895 },
      { month: "Mar 26", calls: 11, infoSubmits: 8, leads: 19, price: 895 },
    ],
  },
  {
    name: "Commercial Truck Trader",
    fullName: "Commercial Truck Trader",
    color: "#DC2626",
    pricePerMonth: 1200,
    billingCycle: "monthly",
    monthlyData: [
      { month: "Sep 25", calls: 12, infoSubmits: 8, leads: 20, price: 1200 },
      { month: "Oct 25", calls: 15, infoSubmits: 10, leads: 25, price: 1200 },
      { month: "Nov 25", calls: 9, infoSubmits: 6, leads: 15, price: 1200 },
      { month: "Dec 25", calls: 11, infoSubmits: 7, leads: 18, price: 1200 },
      { month: "Jan 26", calls: 14, infoSubmits: 9, leads: 23, price: 1200 },
      { month: "Feb 26", calls: 13, infoSubmits: 8, leads: 21, price: 1200 },
      { month: "Mar 26", calls: 16, infoSubmits: 11, leads: 27, price: 1200 },
    ],
  },
  {
    name: "Cherry Trader",
    fullName: "Cherry Trader",
    color: "#D97706",
    pricePerMonth: 500,
    billingCycle: "monthly",
    monthlyData: [
      { month: "Sep 25", calls: 3, infoSubmits: 2, leads: 5, price: 500 },
      { month: "Oct 25", calls: 5, infoSubmits: 3, leads: 8, price: 500 },
      { month: "Nov 25", calls: 4, infoSubmits: 2, leads: 6, price: 500 },
      { month: "Dec 25", calls: 3, infoSubmits: 1, leads: 4, price: 500 },
      { month: "Jan 26", calls: 6, infoSubmits: 3, leads: 9, price: 500 },
      { month: "Feb 26", calls: 4, infoSubmits: 2, leads: 6, price: 500 },
      { month: "Mar 26", calls: 7, infoSubmits: 4, leads: 11, price: 500 },
    ],
  },
];

// NHTTR — service/repair listing platforms (annual billing, linked to CallRail "NH Repair Shops")
// monthlyData.calls will come from CallRail — placeholder data for now
const nhttrPlatforms: PlatformData[] = [
  {
    name: "NTTS",
    fullName: "NTTS Breakdown Service",
    color: "#BE1E23",
    pricePerMonth: 0,
    billingCycle: "annual",
    annualCost: 100,
    renewalDate: "2026-04-02",
    monthlyData: [
      { month: "Oct 25", calls: 12, infoSubmits: 0, leads: 12, price: 0 },
      { month: "Nov 25", calls: 8, infoSubmits: 0, leads: 8, price: 0 },
      { month: "Dec 25", calls: 15, infoSubmits: 0, leads: 15, price: 0 },
      { month: "Jan 26", calls: 10, infoSubmits: 0, leads: 10, price: 0 },
      { month: "Feb 26", calls: 14, infoSubmits: 0, leads: 14, price: 0 },
      { month: "Mar 26", calls: 18, infoSubmits: 0, leads: 18, price: 0 },
    ],
  },
  {
    name: "Find Truck Service",
    fullName: "Find Truck Service",
    color: "#D97706",
    pricePerMonth: 0,
    billingCycle: "annual",
    annualCost: 996,
    renewalDate: "2026-06-28",
    monthlyData: [
      { month: "Oct 25", calls: 22, infoSubmits: 0, leads: 22, price: 0 },
      { month: "Nov 25", calls: 17, infoSubmits: 0, leads: 17, price: 0 },
      { month: "Dec 25", calls: 25, infoSubmits: 0, leads: 25, price: 0 },
      { month: "Jan 26", calls: 19, infoSubmits: 0, leads: 19, price: 0 },
      { month: "Feb 26", calls: 28, infoSubmits: 0, leads: 28, price: 0 },
      { month: "Mar 26", calls: 31, infoSubmits: 0, leads: 31, price: 0 },
    ],
  },
  {
    name: "TruckDown",
    fullName: "TruckDown",
    color: "#EA580C",
    pricePerMonth: 0,
    billingCycle: "annual",
    annualCost: 430,
    renewalDate: "2026-07-14",
    monthlyData: [
      { month: "Oct 25", calls: 9, infoSubmits: 0, leads: 9, price: 0 },
      { month: "Nov 25", calls: 6, infoSubmits: 0, leads: 6, price: 0 },
      { month: "Dec 25", calls: 11, infoSubmits: 0, leads: 11, price: 0 },
      { month: "Jan 26", calls: 7, infoSubmits: 0, leads: 7, price: 0 },
      { month: "Feb 26", calls: 13, infoSubmits: 0, leads: 13, price: 0 },
      { month: "Mar 26", calls: 10, infoSubmits: 0, leads: 10, price: 0 },
    ],
  },
];

// NFI Truck Sales — same structure as NH but different platforms
const nfiPlatforms: PlatformData[] = [
  {
    name: "NFI Website",
    fullName: "NFI Truck Sales Website",
    color: "#075895",
    pricePerMonth: 195,
    billingCycle: "monthly",
    monthlyData: [],
  },
  {
    name: "TruckPaper",
    fullName: "Truck Paper",
    color: "#002B54",
    pricePerMonth: 6800,
    billingCycle: "monthly",
    monthlyData: [],
  },
  {
    name: "My Little Salesman",
    fullName: "My Little Salesman",
    color: "#0284C7",
    pricePerMonth: 895,
    billingCycle: "monthly",
    monthlyData: [],
  },
  {
    name: "Commercial Truck Trader",
    fullName: "Commercial Truck Trader",
    color: "#0891B2",
    pricePerMonth: 1200,
    billingCycle: "monthly",
    monthlyData: [],
  },
  {
    name: "Cherry Trader",
    fullName: "Cherry Trader",
    color: "#D97706",
    pricePerMonth: 500,
    billingCycle: "monthly",
    monthlyData: [],
  },
];

const accountPlatforms: Record<string, PlatformData[]> = {
  "nationwide-haul": nhPlatforms,
  "nfi-truck-sales": nfiPlatforms,
  "nhttr": nhttrPlatforms,
};

export function getPlatformsForAccount(accountId: string): PlatformData[] {
  return accountPlatforms[accountId] || [];
}
