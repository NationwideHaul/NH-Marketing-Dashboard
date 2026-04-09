export interface GMBLocationInfo {
  id: string;
  name: string;
  address: string;
  verified: boolean;
  subServiceId?: string; // links to subServices[].id for filtering
}

export interface SubAccount {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  colors: {
    primary: string;
    secondary: string;
    sidebar: string;
    accent: string;
  };
  /** Ordered chart palette — first 2 match primary/secondary, rest are on-brand variants */
  chartPalette: string[];
  /** Positive indicator color (trends, answered calls, remaining budget) */
  positiveColor: string;
  tabs: string[]; // Which sidebar tabs to show
  config: {
    ga4PropertyId?: string;
    googleAdsCustomerId?: string;
    callrailCompanyId?: string;
    ghlLocationId?: string;
    metaAdAccountId?: string;
    youtubeChannelId?: string;
  };
  website: string; // Primary website URL for display
  inventoryPlatforms?: string[]; // Which inventory platforms this account uses
  subServices?: { id: string; name: string; ga4PropertyId: string; googleAdsCustomerId: string; website: string }[];
  gmbLocations?: GMBLocationInfo[];
}

export const accounts: SubAccount[] = [
  {
    id: "nationwide-haul",
    name: "Nationwide Haul",
    shortName: "NH",
    logo: "/nh-logo.png",
    colors: {
      primary: "#BE1E23",
      secondary: "#8C0F14",
      sidebar: "#1A1A1A",
      accent: "#BE1E23",
    },
    chartPalette: ["#BE1E23", "#8C0F14", "#D97706", "#DC2626", "#EA580C", "#F97316", "#B91C1C", "#C2410C", "#991B1B", "#E85D04"],
    positiveColor: "#D97706",
    tabs: [
      "overview", "google-analytics", "google-ads", "gmb",
      "social-media", "meta-ads", "inventory-platforms",
      "call-logs", "email-marketing", "roi-metrics", "budget",
    ],
    config: {
      ga4PropertyId: "333711970",
      googleAdsCustomerId: "4504773990",
      ghlLocationId: "IEs4Gwg925sPu0AYNpdS",
      youtubeChannelId: "UCjWMfLksDwfwVA-u3xkhnhg",
      metaAdAccountId: "act_233729070644721",
    },
    website: "nationwidehaul.com",
    inventoryPlatforms: ["NH Website", "TruckPaper", "My Little Salesman", "Commercial Truck Trader", "Cherry Trader"],
    gmbLocations: [
      {
        id: "05301472236058634460",
        name: "Nationwide Haul Dealership — Lakeland",
        address: "5021 Frontage Rd N, Suite Sales, Lakeland, FL 33810",
        verified: true,
      },
      {
        id: "05301472236058634461",
        name: "Nationwide Haul Dealership — Macon",
        address: "137 Debbie Court, Macon, GA 31206",
        verified: true,
      },
      {
        id: "05301472236058634462",
        name: "Nationwide Haul Dealership — Pompano Beach",
        address: "2221 NW 22nd St, Pompano Beach, FL 33069",
        verified: true,
      },
    ],
  },
  {
    id: "nfi-truck-sales",
    name: "NFI Truck Sales",
    shortName: "NFI",
    logo: "/nfi-logo.png",
    colors: {
      primary: "#075895",
      secondary: "#002B54",
      sidebar: "#002B54",
      accent: "#075895",
    },
    chartPalette: ["#075895", "#002B54", "#2563EB", "#0284C7", "#0891B2", "#1D4ED8", "#0369A1", "#155E75", "#1E40AF", "#164E63"],
    positiveColor: "#16A34A",
    tabs: [
      "overview", "google-analytics", "google-ads",
      "inventory-platforms", "call-logs", "email-marketing",
      "roi-metrics", "budget",
    ],
    config: {
      ga4PropertyId: "354503352",
      googleAdsCustomerId: "4307362539",
      ghlLocationId: "bQFOVHhca9fD7V3faeS1",
    },
    website: "nfitrucksales.com",
    inventoryPlatforms: ["NFI Website", "TruckPaper", "My Little Salesman", "Commercial Truck Trader", "Cherry Trader"],
  },
  {
    id: "nhttr",
    name: "NHTTR Service & Repair",
    shortName: "NHTTR",
    logo: "/nhttr-logo.png",
    colors: {
      primary: "#BE1E23",
      secondary: "#8C0F14",
      sidebar: "#1A1A1A",
      accent: "#BE1E23",
    },
    chartPalette: ["#BE1E23", "#8C0F14", "#D97706", "#DC2626", "#EA580C", "#F97316", "#B91C1C", "#C2410C", "#991B1B", "#E85D04"],
    positiveColor: "#D97706",
    tabs: [
      "overview", "google-analytics", "google-ads", "gmb",
      "inventory-platforms", "call-logs", "roi-metrics", "budget",
    ],
    config: {
      // Dual properties — RV and TTR
      ga4PropertyId: "528221425", // NH RV (default view)
      googleAdsCustomerId: "1073209892", // NH RV (default view)
      callrailCompanyId: "NH Repair Shops",
    },
    // Extra config for the toggle
    subServices: [
      { id: "rv", name: "RV & Bus Repair", ga4PropertyId: "528221425", googleAdsCustomerId: "1073209892", website: "nhrvrepair.com" },
      { id: "ttr", name: "Truck & Trailer Repair", ga4PropertyId: "528269534", googleAdsCustomerId: "6515085474", website: "nhtrucktrailerrepair.com" },
    ],
    website: "nhtrucktrailerrepair.com",
    inventoryPlatforms: ["NTTS", "Find Truck Service", "TruckDown"],
    gmbLocations: [
      {
        id: "0871542938401481844",
        name: "Nationwide Haul - RV & Bus Repair & Service",
        address: "5021 Frontage Rd N, Suite RV, Lakeland, FL 33810",
        verified: false,
        subServiceId: "rv",
      },
      {
        id: "16514751471730111176",
        name: "Nationwide Haul - Truck & Trailer Repair",
        address: "5021 Frontage Rd N, Suite Shop, Lakeland, FL 33810",
        verified: true,
        subServiceId: "ttr",
      },
    ],
  },
  {
    id: "road-ready",
    name: "Road Ready Insurance",
    shortName: "RRI",
    logo: "/rr-logo.png",
    colors: {
      primary: "#225296",
      secondary: "#00FFFC",
      sidebar: "#0F1B2D",
      accent: "#225296",
    },
    chartPalette: ["#225296", "#00CCCC", "#1D4ED8", "#00E5E5", "#2563EB", "#00B3B3", "#3B82F6", "#009999", "#164E63", "#00FFFC"],
    positiveColor: "#00CCCC",
    tabs: [
      "overview", "google-analytics", "gmb", "referral-sources",
      "social-media", "meta-ads", "email-marketing", "call-logs",
      "roi-metrics", "budget",
    ],
    website: "roadreadyinsurance.com",
    config: {
      ga4PropertyId: "RRI-GA4",
      ghlLocationId: "RRI-GHL",
      metaAdAccountId: "RRI-META",
    },
  },
];

export function getAccount(id: string): SubAccount | undefined {
  return accounts.find((a) => a.id === id);
}

export function getDefaultAccount(): SubAccount {
  return accounts[0];
}

// Tab definitions
export const allTabs = [
  { id: "overview", label: "Overview", href: "/", icon: "LayoutDashboard" },
  { id: "google-analytics", label: "Google Analytics", href: "/google-analytics", icon: "BarChart3" },
  { id: "google-ads", label: "Google Ads", href: "/google-ads", icon: "DollarSign" },
  { id: "gmb", label: "Google My Business", href: "/gmb", icon: "MapPin" },
  { id: "social-media", label: "Social Media", href: "/social-media", icon: "Share2" },
  { id: "meta-ads", label: "Meta Ads", href: "/meta-ads", icon: "Megaphone" },
  { id: "inventory-platforms", label: "Inventory Platforms", href: "/inventory-platforms", icon: "Layers" },
  { id: "referral-sources", label: "Referral Sources", href: "/referral-sources", icon: "Link2" },
  { id: "call-logs", label: "Call Logs", href: "/call-logs", icon: "PhoneCall" },
  { id: "email-marketing", label: "Email Marketing", href: "/go-high-level", icon: "Mail" },
  { id: "roi-metrics", label: "ROI & Revenue", href: "/roi-metrics", icon: "TrendingUp" },
  { id: "budget", label: "Budget", href: "/budget", icon: "Wallet" },
];
