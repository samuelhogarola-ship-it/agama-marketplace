import Script from "next/script";
import { resolvePublicUmamiConfig } from "@/lib/umami-public";

const { url: UMAMI_URL, websiteId: UMAMI_ID } = resolvePublicUmamiConfig();

// Umami es cookieless → no requiere consentimiento (GDPR/LFPDPPP compliant)
export default function Analytics() {
  return (
    <Script
      src={`${UMAMI_URL}/script.js`}
      data-website-id={UMAMI_ID}
      data-domains="todo-plastico.com,www.todo-plastico.com"
      strategy="afterInteractive"
    />
  );
}
