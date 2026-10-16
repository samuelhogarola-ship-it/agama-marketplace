import type { NextConfig } from "next";
import { confirmationHeaders } from "./src/lib/auth-confirmation.js";

function publicUmamiOrigin() {
  const umamiUrl = process.env.NEXT_PUBLIC_UMAMI_URL?.trim();
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim();
  if (!umamiUrl || !websiteId) return null;

  try {
    return new URL(umamiUrl).origin;
  } catch {
    return null;
  }
}

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: { "/api/codigos-postales": ["./src/data/mx-postal.json.gz"] },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  async headers() {
    const developmentScriptPolicy = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
    const umamiOrigin = publicUmamiOrigin();
    const umamiScriptSource = umamiOrigin ? ` ${umamiOrigin}` : "";
    const security = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "Content-Security-Policy", value: `default-src 'self'; script-src 'self' 'unsafe-inline'${developmentScriptPolicy} https://www.googletagmanager.com https://www.google-analytics.com${umamiScriptSource}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.supabase.co; font-src 'self'; connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://analytics.google.com${umamiScriptSource}; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` },
    ];
    return [
      { source: "/:path*", headers: security },
      { source: "/auth/confirm", headers: Object.entries(confirmationHeaders).map(([key, value]) => ({key, value})) },
    ];
  },
};

export default nextConfig;
