import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import type { Product, Profile } from "@/lib/types";
import { safeJsonLd } from "@/lib/jsonld";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("mkt_profiles").select("company_name, description").eq("slug", slug).single();
  if (!data) return {};
  return {
    title: `${data.company_name} — proveedor de plásticos`,
    description: data.description?.slice(0, 160) ?? `Catálogo de ${data.company_name} en AGAMA Marketplace.`,
  };
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase.from("mkt_profiles").select("*").eq("slug", slug).single<Profile>();
  if (!profile) notFound();

  const { data: products } = await supabase
    .from("mkt_products")
    .select("*, photos:mkt_product_photos(*)")
    .eq("status", "published")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: profile.company_name,
    description: profile.description ?? undefined,
    areaServed: "Ciudad de México",
    address: profile.zone ? { "@type": "PostalAddress", addressLocality: profile.zone, addressRegion: "CDMX" } : undefined,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-brand-light flex items-center justify-center text-2xl font-bold text-brand-dark">
          {profile.company_name.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{profile.company_name}</h1>
          {profile.zone && <p className="text-slate-500 text-sm">📍 {profile.zone}</p>}
        </div>
      </div>
      {profile.description && <p className="mt-4 text-slate-600 max-w-2xl">{profile.description}</p>}

      <h2 className="mt-10 text-xl font-bold text-slate-800">Productos ({products?.length ?? 0})</h2>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {(products as Product[] | null)?.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
