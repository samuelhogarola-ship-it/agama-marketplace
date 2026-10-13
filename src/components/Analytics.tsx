import Script from "next/script";
import { resolvePublicUmamiConfig } from "@/lib/umami-public";

const umamiConfig = resolvePublicUmamiConfig();

// Umami es cookieless → no requiere consentimiento (GDPR/LFPDPPP compliant)
export default function Analytics() {
  if (!umamiConfig) return null;

  return (
    <Script
      src={`${umamiConfig.url}/script.js`}
      data-website-id={umamiConfig.websiteId}
      data-domains="todo-plastico.com,www.todo-plastico.com"
      strategy="afterInteractive"
    />
  );
}
