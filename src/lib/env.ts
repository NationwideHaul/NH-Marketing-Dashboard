import { z } from "zod";

const envSchema = z.object({
  // NextAuth
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1).optional(),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Google Analytics
  GA4_PROPERTY_ID: z.string().optional(),

  // Google Ads
  GOOGLE_ADS_CUSTOMER_ID: z.string().optional(),
  GOOGLE_ADS_DEVELOPER_TOKEN: z.string().optional(),

  // Google My Business
  GMB_ACCOUNT_ID: z.string().optional(),
  GMB_LOCATION_ID: z.string().optional(),

  // YouTube
  YOUTUBE_CHANNEL_ID: z.string().optional(),

  // Meta
  META_APP_ID: z.string().optional(),
  META_APP_SECRET: z.string().optional(),
  META_ACCESS_TOKEN: z.string().optional(),
  META_AD_ACCOUNT_ID: z.string().optional(),

  // RingCentral
  RINGCENTRAL_SERVER_URL: z.string().url().optional(),
  RINGCENTRAL_CLIENT_ID: z.string().optional(),
  RINGCENTRAL_CLIENT_SECRET: z.string().optional(),
  RINGCENTRAL_JWT_TOKEN: z.string().optional(),

  // Go High Level
  GHL_API_KEY: z.string().optional(),
  GHL_LOCATION_ID: z.string().optional(),

  // LinkedIn
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
  LINKEDIN_ACCESS_TOKEN: z.string().optional(),
  LINKEDIN_ORGANIZATION_ID: z.string().optional(),
  LINKEDIN_AD_ACCOUNT_ID: z.string().optional(),
});

export const env = envSchema.parse(process.env);
