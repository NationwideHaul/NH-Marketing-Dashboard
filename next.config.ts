import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent the site from being embedded in a <frame>/<iframe> on another domain.
  { key: "X-Frame-Options", value: "DENY" },
  // Tell browsers not to MIME-sniff responses.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't leak full URLs in the Referer header to third parties.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Force HTTPS for 2 years, including subdomains.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Disable powerful browser APIs we don't use.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
