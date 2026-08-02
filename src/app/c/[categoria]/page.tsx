import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES, categoryBySlug } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";
import { safeJsonLd } from "@/lib/jsonld";
import CategoryFilters from "@/components/CategoryFilters";

export const revalidate = 300;

type Props = { params: Promise<{ categoria: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const CATEGORY_SUGGESTIONS: Record<string, readonly (readonly [string, string])[]> = {
  "envases-y-botellas": [["Botellas PET", "botellas"], ["Frascos plásticos", "frascos"], ["Tapas", "tapas"], ["Contenedores", "contenedores"]],
  "bolsas-y-pelicula": [["Bolsas industriales", "bolsas"], ["Película stretch", "pelicula-stretch"], ["Playo", "playo"], ["Sacos plásticos", "sacos"]],
  "tarimas-y-contenedores": [["Tarimas plásticas", "tarimas"], ["Cajas industriales", "cajas-industriales"], ["Contenedores apilables", "contenedores-apilables"]],
  "cubetas-y-bidones": [["Cubetas blancas", "cubetas"], ["Bidones", "bidones"], ["Tambos", "tambos"], ["Garrafones", "garrafones"]],
  "perfiles-y-laminas": [["Perfiles plásticos", "perfiles"], ["Láminas", "laminas"], ["Placas", "placas"], ["Planchas", "planchas"]],
  "tuberia-y-conexiones": [["Tubería PVC", "pvc"], ["Tubería PEAD", "pead"], ["Conexiones", "conexiones"], ["CPVC", "cpvc"]],
  "maquinaria-y-refacciones": [["Inyección", "inyeccion"], ["Soplado", "soplado"], ["Extrusión", "extrusion"], ["Refacciones", "refacciones"]],
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
    title: `${cat.name} para la industria plástica en México`,
    description: `${cat.description} Contacta directo a empresas y proveedores del sector plástico en México.`,
    alternates: { canonical: `/c/${cat.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { categoria } = await params;
  const filters = await searchParams;
  const cat = categoryBySlug(categoria);
  if (!cat) notFound();

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
    .select("*, photos:mkt_listing_photos(*), company:mkt_companies(name, slug, location)")
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
  const { data: products } = await request.limit(48);

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
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="text-brand-sky underline-offset-4 hover:underline">Inicio</Link>
        <span aria-hidden="true">/</span>
        <Link href="/categorias" className="text-brand-sky underline-offset-4 hover:underline">Categorías</Link>
        <span aria-hidden="true">/</span>
        <span className="text-slate-700">{cat.name}</span>
      </nav>
      <h1 className="text-3xl font-bold text-slate-800">{cat.name} para la industria plástica en México</h1>
      <p className="mt-2 max-w-2xl text-slate-600">
        {cat.description} Contacta directamente a empresas profesionales por sus canales públicos.
      </p>
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
            <p className="text-sm text-slate-500"><strong className="text-brand-dark">{products?.length ?? 0}</strong> anuncios encontrados</p>
            <form action={`/c/${cat.slug}`}>
              {location && <input type="hidden" name="location" value={location} />}
              {date && <input type="hidden" name="date" value={date} />}
              {type && <input type="hidden" name="type" value={type} />}
              {subcategory && <input type="hidden" name="subcategory" value={subcategory} />}
              {minPrice && <input type="hidden" name="minPrice" value={minPrice} />}
              {maxPrice && <input type="hidden" name="maxPrice" value={maxPrice} />}
              <label className="flex items-center gap-2 text-sm text-slate-500">Ordenar
                <select name="sort" defaultValue={sort} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand">
                  <option value="newest">Más recientes</option>
                  <option value="price-asc">Precio menor</option>
                  <option value="price-desc">Precio mayor</option>
                </select>
              </label>
              <button className="mt-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-brand-dark hover:border-brand hover:text-brand">Aplicar orden</button>
            </form>
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
        </section>
      </div>
    </div>
  );
}
