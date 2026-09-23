import Script from "next/script";
import { resolvePublicUmamiConfig } from "@/lib/umami-public";

const { url: UMAMI_URL, websiteId: UMAMI_ID } = resolvePublicUmamiConfig();

// Umami es cookieless → no requiere consentimiento (GDPR/LFPDPPP compliant)
export default function Analytics() {
  return (
    <Script
      src={`${UMAMI_URL}/script.js`}
      data-website-id={UMAMI_ID}
      data-domains="xn--todoplsticos-hbb.com,www.xn--todoplsticos-hbb.com"
      strategy="afterInteractive"
    />
  );
}
