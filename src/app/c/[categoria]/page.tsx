import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATEGORIES, categoryBySlug } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";
import { safeJsonLd } from "@/lib/jsonld";

export const revalidate = 300;

type Props = { params: Promise<{ categoria: string }> };

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ categoria: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria } = await params;
  const cat = categoryBySlug(categoria);
  if (!cat) return {};
  return {
    title: `${cat.name} para la industria plástica en México`,
    description: `${cat.description} Contacta directo a empresas y proveedores del sector plástico en México.`,
    alternates: { canonical: `/c/${cat.slug}` },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { categoria } = await params;
  const cat = categoryBySlug(categoria);
  if (!cat) notFound();

  const supabase = await createClient();
  const { data: products } = await supabase
    .from("mkt_listings")
    .select("*, photos:mkt_listing_photos(*), company:mkt_companies(name, slug, location)")
    .eq("status", "published")
    .eq("category", cat.slug)
    .order("created_at", { ascending: false })
    .limit(48);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${cat.name} para la industria plástica en México`,
    description: cat.description,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: (products ?? []).slice(0, 20).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: p.title,
        url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/p/${p.slug}-${p.id}`,
      })),
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <h1 className="text-3xl font-bold text-slate-800">{cat.name} para la industria plástica en México</h1>
      <p className="mt-2 text-slate-600 max-w-2xl">
        {cat.description} Contacta directamente a empresas profesionales por sus canales públicos.
      </p>
      {products && products.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {(products as Product[]).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="mt-12 rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
          <p className="font-medium">Aún no hay anuncios en esta categoría.</p>
          <p className="mt-1 text-sm">¿Vendes {cat.name.toLowerCase()}? Sé el primero en publicar gratis.</p>
        </div>
      )}
    </div>
  );
}
