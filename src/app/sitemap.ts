import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";
import { PUBLISHED_ARTICLES } from "@/lib/articles";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://todo-plastico.com";
  const supabase = await createClient();

  const [{ data: products }, { data: profiles }] = await Promise.all([
    supabase.from("mkt_listings").select("id, slug, created_at, updated_at").eq("status", "published").limit(5000),
    supabase.from("mkt_companies").select("slug, created_at").eq("status", "active").limit(5000),
  ]);

  const now = new Date().toISOString();

  return [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/categorias`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/empresas`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${base}/articulos`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/sponsor/agama`, lastModified: "2026-07-01", changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/legal/terminos`, lastModified: "2026-07-01", changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/privacidad`, lastModified: "2026-07-01", changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/comunidad`, lastModified: "2026-07-01", changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/cookies`, lastModified: "2026-07-01", changeFrequency: "yearly", priority: 0.3 },
    ...CATEGORIES.map((c) => ({
      url: `${base}/c/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    ...(products ?? []).map((p) => ({
      url: `${base}/p/${p.slug}-${p.id}`,
      lastModified: p.updated_at ?? p.created_at,
      priority: 0.6,
    })),
    ...(profiles ?? []).map((e) => ({
      url: `${base}/e/${e.slug}`,
      lastModified: e.created_at,
      priority: 0.5,
    })),
    ...PUBLISHED_ARTICLES.map((article) => ({
      url: `${base}/articulos/${article.slug}`,
      lastModified: article.date,
      priority: 0.6,
    })),
  ];
}
