import type { NextConfig } from "next";

// Dev requires 'unsafe-eval' (React fast-refresh debug). Production does not.
// NODE_ENV is unreliable inside next.config in some setups, so derive dev
// from the app's own base URL contract: http = local development,
// https = deployed (Vercel forces HTTPS).
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
const isDev = !appUrl.startsWith("https://");

const securityHeaders: Array<{ key: string; value: string }> = [
  // Force HTTPS for two years on the domain and its subdomains.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // Block MIME-type sniffing (type confusion attacks).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // No page of this app may be embedded in a frame (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Never leak the full URL to third-party origins.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features the app never uses.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // Content-Security-Policy: the app loads no third-party scripts, styles,
  // fonts, or media. `object-src 'none'` and `base-uri 'self'` harden against
  // injection; `frame-ancestors 'none'` is the CSP-native clickjacking guard.
  // Next.js requires 'unsafe-inline' for its inline hydration scripts and
  // (in dev only) 'unsafe-eval' for React fast-refresh.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: "/:path*",
      headers: securityHeaders,
    },
  ],
};

export default nextConfig;