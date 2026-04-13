// Server-side account credentials mapping
// This file is ONLY used in API routes (server-side)
// Each account has its own set of API credentials

// Read env var and strip whitespace (newlines, tabs, spaces) that
// commonly slip in when pasting secrets into the Vercel UI.
const env = new Proxy({} as Record<string, string | undefined>, {
  get: (_, key: string) => {
    const v = process.env[key];
    return typeof v === "string" ? v.trim() : v;
  },
});

export interface GMBLocation {
  id: string;
  name: string;
  address: string;
  verified: boolean;
}

export interface AccountCredentials {
  ga4PropertyId?: string;
  googleAdsCustomerId?: string;
  googleAdsDeveloperToken?: string;
  callrailCompanyName?: string;
  ghlLocationId?: string;
  ghlApiKey?: string;
  metaAdAccountId?: string;
  metaAccessToken?: string;
  metaPageId?: string;
  metaIgUserId?: string;
  youtubeChannelId?: string;
  ringcentralEnabled?: boolean;
  gmbLocations?: GMBLocation[];
}

const accountCredentials: Record<string, AccountCredentials> = {
  "nationwide-haul": {
    ga4PropertyId: "333711970",
    googleAdsCustomerId: "4504773990",
    googleAdsDeveloperToken: env.GOOGLE_ADS_DEVELOPER_TOKEN,
    callrailCompanyName: "Nationwide Haul",
    ghlLocationId: env.GHL_LOCATION_ID || "IEs4Gwg925sPu0AYNpdS",
    ghlApiKey: env.GHL_API_KEY,
    metaAdAccountId: env.META_AD_ACCOUNT_ID,
    metaAccessToken: env.META_ACCESS_TOKEN,
    metaPageId: env.META_PAGE_ID,
    metaIgUserId: env.META_IG_USER_ID,
    youtubeChannelId: "UCjWMfLksDwfwVA-u3xkhnhg",
    ringcentralEnabled: true,
  },
  "nfi-truck-sales": {
    ga4PropertyId: "354503352",
    googleAdsCustomerId: "4307362539",
    googleAdsDeveloperToken: env.GOOGLE_ADS_DEVELOPER_TOKEN,
    callrailCompanyName: "NFI Truck Sales",
    ghlLocationId: "bQFOVHhca9fD7V3faeS1",
    ghlApiKey: env.GHL_API_KEY, // Same agency key, different location
    ringcentralEnabled: true,
  },
  "nhttr": {
    // Default to RV — toggle handled by subService param
    ga4PropertyId: "528221425",
    googleAdsCustomerId: "1073209892",
    googleAdsDeveloperToken: env.GOOGLE_ADS_DEVELOPER_TOKEN,
    callrailCompanyName: "NH Repair Shops",
    ringcentralEnabled: true,
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
  "nhttr-rv": {
    ga4PropertyId: "528221425",
    googleAdsCustomerId: "1073209892",
    googleAdsDeveloperToken: env.GOOGLE_ADS_DEVELOPER_TOKEN,
    callrailCompanyName: "NH Repair Shops",
    ringcentralEnabled: true,
    gmbLocations: [
      {
        id: "0871542938401481844",
        name: "Nationwide Haul - RV & Bus Repair & Service",
        address: "5021 Frontage Rd N, Suite RV, Lakeland, FL 33810",
        verified: false,
      },
    ],
  },
  "nhttr-ttr": {
    ga4PropertyId: "528269534",
    googleAdsCustomerId: "6515085474",
    googleAdsDeveloperToken: env.GOOGLE_ADS_DEVELOPER_TOKEN,
    callrailCompanyName: "NH Repair Shops",
    ringcentralEnabled: true,
    gmbLocations: [
      {
        id: "16514751471730111176",
        name: "Nationwide Haul - Truck & Trailer Repair",
        address: "5021 Frontage Rd N, Suite Shop, Lakeland, FL 33810",
        verified: true,
      },
    ],
  },
  "road-ready": {
    ga4PropertyId: "350112166",
    googleAdsCustomerId: "1866416925",
    googleAdsDeveloperToken: env.GOOGLE_ADS_DEVELOPER_TOKEN,
  },
};

export function getAccountCredentials(accountId: string): AccountCredentials {
  return accountCredentials[accountId] || accountCredentials["nationwide-haul"];
}
