import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";
import Link from "next/link";
import { ARTICLES } from "@/lib/articles";
import { CATEGORIES } from "@/lib/categories";

export const metadata: Metadata = { title: "Buscar", robots: { index: false } };

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (q ?? "").trim().slice(0, 100);
  // Sin caracteres con significado en la sintaxis de filtros PostgREST ni comodines ilike
  const safe = query.replace(/[,()%_\\]/g, " ").trim();
  const supabase = await createClient();

  let products: Product[] = [];
  let companies: { id: string; name: string; slug: string; description: string | null; location: string | null }[] = [];
  if (safe) {
    const [{ data: listingData }, { data: companyData }] = await Promise.all([
      supabase
      .from("mkt_listings")
      .select("*, photos:mkt_listing_photos(*), company:mkt_companies(name, slug, location)")
      .eq("status", "published")
      .or(`title.ilike.%${safe}%,description.ilike.%${safe}%`)
      .limit(48),
      supabase
      .from("mkt_companies")
      .select("id, name, slug, description, location")
      .eq("status", "active")
      .or(`name.ilike.%${safe}%,description.ilike.%${safe}%`)
      .limit(24),
    ]);
    products = (listingData as Product[]) ?? [];
    companies = companyData ?? [];
    // Log de demanda: el dato más valioso del marketplace (fire-and-forget)
    await supabase.from("mkt_search_queries").insert({ query, results_count: products.length });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-800">
        {query ? `Resultados para "${query}"` : "Buscar en TodoPlástico"}
      </h1>
      <form action="/buscar" className="mt-4 max-w-md">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Buscar empresas, productos o servicios…"
          className="w-full rounded-full border border-slate-300 px-4 py-2 focus:outline-none focus:border-brand"
        />
      </form>

      {/* Empty state sin query: grid de categorías */}
      {!query && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-brand-dark">Explorar por categoría</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/c/${cat.slug}`}
                className="rounded-xl border border-slate-200 bg-white px-4 py-5 hover:border-brand hover:shadow-sm transition-all"
              >
                <p className="font-semibold text-brand-dark">{cat.name}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500 line-clamp-2">{cat.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {query && products.length === 0 && companies.length === 0 && ARTICLES.filter((article) => `${article.title} ${article.excerpt}`.toLowerCase().includes(safe.toLowerCase())).length === 0 && (
        <div className="mt-10 rounded-xl border border-dashed border-slate-300 px-8 py-14 text-center">
          <p className="font-semibold text-brand-dark">Sin resultados para &ldquo;{query}&rdquo;</p>
          <p className="mt-2 text-sm text-slate-500">Prueba con otra palabra o explora una categoría:</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <Link key={cat.slug} href={`/c/${cat.slug}`} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:border-brand hover:text-brand-dark">
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}
      {companies.length > 0 && <section className="mt-10"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-brand-dark">Empresas</h2><Link href="/empresas" className="text-sm font-semibold text-brand-dark underline underline-offset-8">Ver directorio ↗</Link></div><div className="mt-4 grid gap-4 md:grid-cols-3">{companies.map((company) => <Link key={company.id} href={`/e/${company.slug}`} className="border-t border-slate-200 pt-4 hover:text-hot"><h3 className="font-semibold text-brand-dark">{company.name}</h3>{company.location && <p className="mt-1 text-sm text-slate-500">{company.location}</p>}{company.description && <p className="mt-3 line-clamp-2 text-sm text-slate-600">{company.description}</p>}</Link>)}</div></section>}
      {query && ARTICLES.filter((article) => `${article.title} ${article.excerpt}`.toLowerCase().includes(safe.toLowerCase())).length > 0 && <section className="mt-10"><h2 className="text-xl font-semibold text-brand-dark">Contenido</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{ARTICLES.filter((article) => `${article.title} ${article.excerpt}`.toLowerCase().includes(safe.toLowerCase())).map((article) => <Link key={article.slug} href={`/articulos/${article.slug}`} className="border-t border-slate-200 pt-4 hover:text-hot"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-sky">{article.category}</p><h3 className="mt-2 font-semibold text-brand-dark">{article.title}</h3><p className="mt-2 text-sm text-slate-600">{article.excerpt}</p></Link>)}</div></section>}
      {products.length > 0 && <h2 className="mt-10 text-xl font-semibold text-brand-dark">Anuncios</h2>}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
