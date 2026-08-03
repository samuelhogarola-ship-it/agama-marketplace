import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import type { Company, Product } from "@/lib/types";
import { safeJsonLd } from "@/lib/jsonld";
import { CATEGORIES } from "@/lib/categories";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("mkt_companies").select("name, description, logo_url").eq("slug", slug).single();
  if (!data) return {};
  return {
    title: `${data.name} — empresa de la industria plástica`,
    description: data.description?.slice(0, 160) ?? `Perfil de ${data.name} en TodoPlástico.`,
    openGraph: data.logo_url ? { images: [data.logo_url] } : undefined,
  };
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase.from("mkt_companies").select("*").eq("slug", slug).single<Company>();
  if (!profile) notFound();

  const { data: products } = await supabase
    .from("mkt_listings")
    .select("*, photos:mkt_listing_photos(*), company:mkt_companies(name, slug, location)")
    .eq("status", "published")
    .eq("company_id", profile.id)
    .order("created_at", { ascending: false });

  const activeCategories = profile.categories
    ? CATEGORIES.filter((c) => (profile.categories as string[]).includes(c.slug))
    : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: profile.name,
    description: profile.description ?? undefined,
    areaServed: "México",
    address: profile.location
      ? { "@type": "PostalAddress", addressLocality: profile.location, addressCountry: "MX" }
      : undefined,
    url: profile.website ?? undefined,
    telephone: profile.phone ?? undefined,
    email: profile.email ?? undefined,
    logo: profile.logo_url ?? undefined,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <nav className="text-sm text-slate-500">
        <Link href="/empresas" className="hover:text-brand">
          Directorio
        </Link>
        {" / "}
        <span className="text-slate-700">{profile.name}</span>
      </nav>

      <div className="mt-8 flex flex-wrap items-start gap-6">
        {/* Avatar / logo */}
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          {profile.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.logo_url}
              alt={`Logo de ${profile.name}`}
              className="h-full w-full object-contain p-2"
            />
          ) : (
            <span className="text-3xl font-bold text-brand-dark">
              {profile.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">{profile.name}</h1>
            {profile.is_verified && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                Verificada
              </span>
            )}
          </div>
          {profile.location && (
            <p className="mt-1 text-sm text-slate-500">{profile.location}</p>
          )}

          {activeCategories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {activeCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/c/${cat.slug}`}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-brand-light hover:text-brand-dark"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {profile.description && (
        <p className="mt-6 max-w-2xl leading-7 text-slate-600">{profile.description}</p>
      )}

      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        {profile.website && (
          <a
            href={profile.website}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-200 px-4 py-2 hover:border-brand hover:text-brand-dark"
          >
            Sitio web ↗
          </a>
        )}
        {profile.phone && (
          <a
            href={`tel:${profile.phone}`}
            className="rounded-full border border-slate-200 px-4 py-2 hover:border-brand hover:text-brand-dark"
          >
            {profile.phone}
          </a>
        )}
        {profile.email && (
          <a
            href={`mailto:${profile.email}`}
            className="rounded-full border border-slate-200 px-4 py-2 hover:border-brand hover:text-brand-dark"
          >
            {profile.email}
          </a>
        )}
        {profile.whatsapp && (
          <a
            href={`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-200 px-4 py-2 hover:border-brand hover:text-brand-dark"
          >
            WhatsApp
          </a>
        )}
      </div>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <h2 className="text-xl font-semibold text-brand-dark">
            Anuncios ({products?.length ?? 0})
          </h2>
        </div>
        {products && products.length > 0 ? (
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {(products as Product[]).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="mt-8 text-center text-sm text-slate-500">
            Esta empresa aún no tiene anuncios publicados.
          </p>
        )}
      </section>
    </div>
  );
}
