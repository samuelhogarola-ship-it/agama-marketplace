import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/panel", "/ingresar", "/registro", "/buscar", "/admin", "/auth"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
