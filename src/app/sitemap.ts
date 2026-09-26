import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";
import { PUBLISHED_ARTICLES } from "@/lib/articles";
import { createClient } from "@/lib/supabase/server";

import { readSitemapRows } from "@/lib/sitemap-pages";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://todo-plastico.com";
  const supabase = await createClient();

  const [products, profiles] = await Promise.all([
    readSitemapRows((from, to) => supabase.from("mkt_listings").select("id, slug, created_at, updated_at").eq("status", "published").order("id").range(from, to)),
    readSitemapRows((from, to) => supabase.from("mkt_companies").select("id, slug").eq("status", "active").order("id").range(from, to)),
  ]);

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/categorias`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/empresas`, changeFrequency: "daily", priority: 0.85 },
    { url: `${base}/articulos`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/sponsor/agama`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/legal/terminos`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/privacidad`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/comunidad`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/cookies`, changeFrequency: "yearly", priority: 0.3 },
    ...CATEGORIES.map((c) => ({
      url: `${base}/c/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    ...(products ?? []).map((p) => ({
      url: `${base}/p/${p.slug || "anuncio"}-${p.id}`,
      lastModified: p.updated_at ?? p.created_at,
      priority: 0.6,
    })),
    ...(profiles ?? []).map((e) => ({
      url: `${base}/e/${e.slug}`,
      priority: 0.5,
    })),
    ...PUBLISHED_ARTICLES.map((article) => ({
      url: `${base}/articulos/${article.slug}`,
      lastModified: article.date,
      priority: 0.6,
    })),
  ];
}
