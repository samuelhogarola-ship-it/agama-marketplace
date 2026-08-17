import Script from "next/script";

const UMAMI_URL = process.env.NEXT_PUBLIC_UMAMI_URL;
const UMAMI_ID  = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

// Umami es cookieless → no requiere consentimiento (GDPR/LFPDPPP compliant)
export default function Analytics() {
  if (!UMAMI_URL || !UMAMI_ID) return null;

  return (
    <Script
      src={`${UMAMI_URL}/script.js`}
      data-website-id={UMAMI_ID}
      strategy="afterInteractive"
    />
  );
}
