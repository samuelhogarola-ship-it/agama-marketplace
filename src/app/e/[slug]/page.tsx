import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import type { Company, Product } from "@/lib/types";
import { safeJsonLd } from "@/lib/jsonld";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("mkt_companies").select("name, description").eq("slug", slug).single();
  if (!data) return {};
  return {
    title: `${data.name} — empresa de la industria plástica`,
    description: data.description?.slice(0, 160) ?? `Perfil de ${data.name} en TodoPlástico.`,
  };
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase.from("mkt_companies").select("*").eq("slug", slug).single<Company>();
  if (!profile) notFound();

  const { data: products } = await supabase
    .from("mkt_listings")
    .select("*, photos:mkt_listing_photos(*)")
    .eq("status", "published")
    .eq("company_id", profile.id)
    .order("created_at", { ascending: false });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: profile.name,
    description: profile.description ?? undefined,
    areaServed: "México",
    address: profile.location ? { "@type": "PostalAddress", addressLocality: profile.location, addressCountry: "MX" } : undefined,
    url: profile.website ?? undefined,
    telephone: profile.phone ?? undefined,
    email: profile.email ?? undefined,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-brand-light flex items-center justify-center text-2xl font-bold text-brand-dark">
          {profile.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{profile.name}</h1>
          {profile.location && <p className="text-slate-500 text-sm">{profile.location}</p>}
        </div>
      </div>
      {profile.description && <p className="mt-4 text-slate-600 max-w-2xl">{profile.description}</p>}
      <div className="mt-5 flex flex-wrap gap-2 text-sm">
        {profile.website && <a href={profile.website} target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 px-3 py-1.5 hover:border-brand">Web</a>}
        {profile.phone && <a href={`tel:${profile.phone}`} className="rounded-full border border-slate-200 px-3 py-1.5 hover:border-brand">Teléfono</a>}
        {profile.email && <a href={`mailto:${profile.email}`} className="rounded-full border border-slate-200 px-3 py-1.5 hover:border-brand">Email</a>}
        {profile.whatsapp && <a href={`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 px-3 py-1.5 hover:border-brand">WhatsApp</a>}
      </div>

      <h2 className="mt-10 text-xl font-bold text-slate-800">Anuncios ({products?.length ?? 0})</h2>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {(products as Product[] | null)?.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
