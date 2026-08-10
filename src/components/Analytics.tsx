"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const GA_ID = "G-9R04G31JCZ";

export default function Analytics() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    function check() {
      setConsented(localStorage.getItem("mkt-cookie-consent") === "accepted");
    }
    check();
    window.addEventListener("storage", check);
    window.addEventListener("mkt-consent-change", check);
    return () => {
      window.removeEventListener("storage", check);
      window.removeEventListener("mkt-consent-change", check);
    };
  }, []);

  if (!consented) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}
