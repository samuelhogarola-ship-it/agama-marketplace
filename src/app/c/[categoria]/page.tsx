import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CATEGORIES, categoryBySlug } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";
import { safeJsonLd } from "@/lib/jsonld";
import CategoryFilters from "@/components/CategoryFilters";
import SortSelect from "@/components/SortSelect";

export const revalidate = 300;

type Props = { params: Promise<{ categoria: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const CATEGORY_SUGGESTIONS: Record<string, readonly (readonly [string, string])[]> = {
  "envases-y-botellas": [["Botellas PET", "botellas"], ["Frascos plásticos", "frascos"], ["Tapas", "tapas"], ["Contenedores", "contenedores"]],
  "bolsas-y-pelicula": [["Bolsas industriales", "bolsas"], ["Película stretch", "pelicula-stretch"], ["Playo", "playo"], ["Sacos plásticos", "sacos"]],
  "tarimas-y-contenedores": [["Tarimas plásticas", "tarimas"], ["Cajas industriales", "cajas-industriales"], ["Contenedores apilables", "contenedores-apilables"]],
  "cubetas-y-bidones": [["Cubetas blancas", "cubetas"], ["Bidones", "bidones"], ["Tambos", "tambos"], ["Garrafones", "garrafones"]],
  "perfiles-y-laminas": [["Perfiles plásticos", "perfiles"], ["Láminas", "laminas"], ["Placas", "placas"], ["Planchas", "planchas"]],
  "tuberia-y-conexiones": [["Tubería PVC", "pvc"], ["Tubería PEAD", "pead"], ["Conexiones", "conexiones"], ["CPVC", "cpvc"]],
  "muebles-y-sillas": [["Sillas apilables", "sillas"], ["Mesas de plástico", "mesas"], ["Bancos", "bancos"], ["Mobiliario exterior", "mobiliario-exterior"]],
  "reciclado-y-sustentabilidad": [["Plástico reciclado", "plastico-reciclado"], ["Molienda", "molienda"], ["Peletizado", "peletizado"], ["Scrap", "scrap"]],
  "moldes-y-troqueles": [["Moldes de inyección", "inyeccion"], ["Moldes de soplado", "soplado"], ["Extrusión", "extrusion"], ["Herramentales", "herramentales"]],
  "empaques-y-embalaje": [["Charolas", "charolas"], ["Blister", "blister"], ["Clamshell", "clamshell"], ["Termoformado", "termoformado"]],
  "productos-terminados": [["Cajas", "cajas"], ["Cestas", "cestas"], ["Botes", "botes"], ["Accesorios", "accesorios"]],
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ categoria: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria } = await params;
  const cat = categoryBySlug(categoria);
  if (!cat) return {};
  return {
    title: `Comprar ${cat.name} de plástico en México — Proveedores B2B`,
    description: `${cat.description} Contacta directo a empresas y proveedores del sector plástico en México. ${cat.keywords.slice(0, 3).join(", ")}.`,
    alternates: { canonical: `/c/${cat.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { categoria } = await params;
  const filters = await searchParams;
  const cat = categoryBySlug(categoria);
  if (!cat) notFound();

  const PAGE_SIZE = 24;
  const page = Math.max(1, Number(first(filters.page) ?? 1));
  const offset = (page - 1) * PAGE_SIZE;
  const location = first(filters.location)?.trim().slice(0, 80) || "";
  const subcategory = first(filters.subcategory)?.trim().slice(0, 50) || "";
  const date = first(filters.date) || "";
  const type = first(filters.type) || "";
  const minPrice = first(filters.minPrice) || "";
  const maxPrice = first(filters.maxPrice) || "";
  const sort = first(filters.sort) || "newest";
  const suggestions = CATEGORY_SUGGESTIONS[cat.slug] ?? [];

  const supabase = await createClient();
  let request = supabase
    .from("mkt_listings")
    .select("*, photos:mkt_listing_photos(*), company:mkt_companies(name, slug, location)", { count: "exact" })
    .eq("status", "published")
    .eq("category", cat.slug);
  if (location) request = request.ilike("location", `%${location.replace(/[,()%_\\]/g, " ")}%`);
  if (["product", "service", "ad"].includes(type)) request = request.eq("type", type);
  if (subcategory) request = request.contains("tags", [subcategory]);
  if (minPrice && Number.isFinite(Number(minPrice))) request = request.gte("price_mxn", Number(minPrice));
  if (maxPrice && Number.isFinite(Number(maxPrice))) request = request.lte("price_mxn", Number(maxPrice));
  // Server-side date boundaries keep the filter queryable while remaining independent from the browser.
  if (date === "today") { // eslint-disable-next-line react-hooks/purity
    request = request.gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  }
  if (date === "7d") { // eslint-disable-next-line react-hooks/purity
    request = request.gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
  }
  if (date === "30d") { // eslint-disable-next-line react-hooks/purity
    request = request.gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
  }
  if (sort === "price-asc") request = request.order("price_mxn", { ascending: true, nullsFirst: false });
  else if (sort === "price-desc") request = request.order("price_mxn", { ascending: false, nullsFirst: false });
  else request = request.order("created_at", { ascending: false });
  const { data: products, count: totalCount } = await request.range(offset, offset + PAGE_SIZE - 1);
  const totalPages = Math.ceil((totalCount ?? 0) / PAGE_SIZE);

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://todo-plastico.com";
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Comprar ${cat.name} de plástico en México`,
    description: cat.description,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: (products ?? []).slice(0, 20).map((p, i) => ({
        "@type": "ListItem",
        position: offset + i + 1,
        name: p.title,
        url: `${base}/p/${p.slug}-${p.id}`,
      })),
    },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: base },
      { "@type": "ListItem", position: 2, name: "Categorías", item: `${base}/categorias` },
      { "@type": "ListItem", position: 3, name: cat.name, item: `${base}/c/${cat.slug}` },
    ],
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="text-brand-sky underline-offset-4 hover:underline">Inicio</Link>
        <span aria-hidden="true">/</span>
        <Link href="/categorias" className="text-brand-sky underline-offset-4 hover:underline">Categorías</Link>
        <span aria-hidden="true">/</span>
        <span className="text-slate-700">{cat.name}</span>
      </nav>
      <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Comprar {cat.name} de plástico en México</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            {cat.description} Contacta directamente a empresas profesionales por sus canales públicos.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs text-slate-400 sm:pt-1 sm:text-right">
          <Image src="/agama-logo.png" alt="AGAMA" width={22} height={22} className="rounded-full opacity-65" />
          <span className="uppercase tracking-[0.14em]">Esponsor AGAMA</span>
        </div>
      </div>
      <section className="mt-8" aria-labelledby="suggestions-title">
        <h2 id="suggestions-title" className="text-2xl font-semibold text-brand-dark">Sugerencias para ti</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {suggestions.map(([label, value]) => (
            <Link key={value} href={`/c/${cat.slug}?subcategory=${encodeURIComponent(value)}`} className="rounded-full bg-slate-100 px-5 py-3 text-sm text-slate-700 transition-colors hover:bg-brand-light hover:text-brand-dark">
              {label}
            </Link>
          ))}
        </div>
      </section>
      <h2 className="mt-12 text-2xl font-semibold text-brand-dark">Novedades</h2>
      <div className="mt-8 flex flex-col gap-8 lg:grid lg:grid-cols-[250px_minmax(0,1fr)] lg:items-start">
        <CategoryFilters category={cat.slug} subcategory={subcategory} location={location} date={date} type={type} minPrice={minPrice} maxPrice={maxPrice} sort={sort} />
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <p className="text-sm text-slate-500"><strong className="text-brand-dark">{totalCount ?? 0}</strong> anuncios encontrados</p>
            <SortSelect category={cat.slug} />
          </div>
          {products && products.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
              {(products as Product[]).map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
              <p className="font-medium">No hay anuncios con estos filtros.</p>
              <p className="mt-1 text-sm">Prueba a quitar algún filtro o publica el primero en esta categoría.</p>
            </div>
          )}
          {totalPages > 1 && (
            <nav aria-label="Paginación" className="mt-10 flex items-center justify-between gap-4 border-t border-slate-200 pt-6">
              {page > 1 ? (
                <Link
                  href={`/c/${cat.slug}?${new URLSearchParams(Object.entries({ location, subcategory, date, type, minPrice, maxPrice, sort, page: String(page - 1) }).filter(([, v]) => v) as [string, string][]).toString()}`}
                  className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-brand-dark hover:border-brand"
                >
                  ← Anterior
                </Link>
              ) : <span />}
              <span className="text-sm text-slate-500">Página {page} de {totalPages}</span>
              {page < totalPages ? (
                <Link
                  href={`/c/${cat.slug}?${new URLSearchParams(Object.entries({ location, subcategory, date, type, minPrice, maxPrice, sort, page: String(page + 1) }).filter(([, v]) => v) as [string, string][]).toString()}`}
                  className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-brand-dark hover:border-brand"
                >
                  Siguiente →
                </Link>
              ) : <span />}
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
