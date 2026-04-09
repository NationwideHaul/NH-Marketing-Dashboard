export interface GMBLocationInfo {
  id: string;
  name: string;
  address: string;
  verified: boolean;
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
  tabs: string[]; // Which sidebar tabs to show
  config: {
    ga4PropertyId?: string;
    googleAdsCustomerId?: string;
    callrailCompanyId?: string;
    ghlLocationId?: string;
    metaAdAccountId?: string;
    youtubeChannelId?: string;
  };
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
    tabs: [
      "overview", "google-analytics", "google-ads", "gmb",
      "social-media", "meta-ads", "inventory-platforms",
      "call-logs", "email-marketing", "budget",
    ],
    config: {
      ga4PropertyId: "333711970",
      googleAdsCustomerId: "4504773990",
      ghlLocationId: "IEs4Gwg925sPu0AYNpdS",
      youtubeChannelId: "UCjWMfLksDwfwVA-u3xkhnhg",
      metaAdAccountId: "act_233729070644721",
    },
    inventoryPlatforms: ["NH Website", "TruckPaper", "My Little Salesman", "Commercial Truck Trader", "Cherry Trader"],
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
    tabs: [
      "overview", "google-analytics", "google-ads",
      "inventory-platforms", "call-logs", "email-marketing",
    ],
    config: {
      ga4PropertyId: "354503352",
      googleAdsCustomerId: "4307362539",
      ghlLocationId: "bQFOVHhca9fD7V3faeS1",
    },
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
    tabs: [
      "overview", "google-analytics", "google-ads", "gmb",
      "inventory-platforms", "call-logs",
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
    inventoryPlatforms: ["NTTS", "Find Truck Service", "TruckDown"],
    gmbLocations: [
      {
        id: "0871542938401481844",
        name: "Nationwide Haul - RV & Bus Repair & Service",
        address: "5021 Frontage Rd N, Suite RV, Lakeland, FL 33810",
        verified: false,
      },
      {
        id: "16514751471730111176",
        name: "Nationwide Haul - Truck & Trailer Repair",
        address: "5021 Frontage Rd N, Suite Shop, Lakeland, FL 33810",
        verified: true,
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
      sidebar: "#1A1A1A",
      accent: "#225296",
    },
    tabs: ["overview"], // TBD — add more tabs when configured
    config: {},
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
  { id: "call-logs", label: "Call Logs", href: "/call-logs", icon: "PhoneCall" },
  { id: "email-marketing", label: "Email Marketing", href: "/go-high-level", icon: "Mail" },
  { id: "budget", label: "Budget", href: "/budget", icon: "Wallet" },
];
