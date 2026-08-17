import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://todo-plastico.com";
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
