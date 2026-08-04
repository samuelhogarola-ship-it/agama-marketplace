import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  // Mientras no haya dominio final, next.config.ts añade X-Robots-Tag: noindex global
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/panel", "/mensajes", "/ingresar", "/registro", "/buscar", "/admin"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
