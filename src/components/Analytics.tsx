import Script from "next/script";
import { resolvePublicUmamiConfig } from "@/lib/umami-public";

const UMAMI_CONFIG = resolvePublicUmamiConfig();

// Umami es cookieless → no requiere consentimiento (GDPR/LFPDPPP compliant)
export default function Analytics() {
  if (!UMAMI_CONFIG) return null;

  return (
    <Script
      src={`${UMAMI_CONFIG.url}/script.js`}
      data-website-id={UMAMI_CONFIG.websiteId}
      data-domains="todo-plastico.com,www.todo-plastico.com"
      strategy="afterInteractive"
    />
  );
}
