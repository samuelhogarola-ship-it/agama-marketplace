import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";
import Link from "next/link";
import { PUBLISHED_ARTICLES } from "@/lib/articles";
import { CATEGORIES } from "@/lib/categories";
import SearchAnalytics from "@/components/SearchAnalytics";

export const metadata: Metadata = { title: "Buscar", robots: { index: false } };

type Props = { searchParams: Promise<{ q?: string; category?: string; location?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q, category, location } = await searchParams;
  const query = (q ?? "").trim().slice(0, 100);
  const safeQuery = query.replace(/[,()%_\\]/g, " ").trim();
  const safeLocation = (location ?? "").trim().slice(0, 80).replace(/[,()%_\\]/g, " ").trim();
  const supabase = await createClient();

  let products: Product[] = [];
  let companies: { id: string; name: string; slug: string; description: string | null; location: string | null }[] = [];

  if (safeQuery) {
    let listingsQ = supabase
      .from("mkt_listings")
      .select("*, photos:mkt_listing_photos(*), company:mkt_companies(name, slug, location)")
      .eq("status", "published")
      .or(`title.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`);
    let companiesQ = supabase
      .from("mkt_companies")
      .select("id, name, slug, description, location")
      .eq("status", "active")
      .or(`name.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`);

    if (category) {
      listingsQ = listingsQ.eq("category", category);
      companiesQ = companiesQ.contains("categories", [category]);
    }
    if (safeLocation) {
      listingsQ = listingsQ.ilike("location", `%${safeLocation}%`);
      companiesQ = companiesQ.ilike("location", `%${safeLocation}%`);
    }

    const [{ data: listingData }, { data: companyData }] = await Promise.all([
      listingsQ.limit(48),
      companiesQ.limit(24),
    ]);
    products = (listingData as Product[]) ?? [];
    companies = companyData ?? [];

    supabase.from("mkt_search_queries").insert({ query, results_count: products.length }).then(() => {}, () => {});
  }

  const matchingArticles = query
    ? PUBLISHED_ARTICLES.filter((a) => `${a.title} ${a.excerpt}`.toLowerCase().includes(safeQuery.toLowerCase()))
    : [];
  const resultsCount = products.length + companies.length + matchingArticles.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <SearchAnalytics
        query={query}
        category={category}
        location={location}
        resultsCount={resultsCount}
      />
      <h1 className="text-2xl font-bold text-slate-800">
        {query ? `Resultados para "${query}"` : "Buscar en TodoPlástico"}
      </h1>

      <form action="/buscar" className="mt-4 grid gap-3 border-b border-slate-200 pb-5 sm:grid-cols-[1fr_auto_auto_auto]">
        <div>
          <label htmlFor="search-q" className="sr-only">Buscar</label>
          <input
            id="search-q"
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Buscar empresas, productos o servicios…"
            className="w-full rounded-full border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:border-brand"
          />
        </div>
        <div>
          <label htmlFor="search-category" className="sr-only">Categoría</label>
          <select
            id="search-category"
            name="category"
            defaultValue={category ?? ""}
            className="w-full rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand"
          >
            <option value="">Todas las categorías</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.slug} value={cat.slug}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="search-location" className="sr-only">Ciudad o estado</label>
          <input
            id="search-location"
            name="location"
            defaultValue={location ?? ""}
            placeholder="Ciudad o estado"
            className="w-full rounded-full border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand"
          />
        </div>
        <button type="submit" className="rounded-full bg-brand-dark px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand">
          Buscar
        </button>
      </form>

      {!query && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-brand-dark">Explorar por categoría</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/c/${cat.slug}`}
                className="rounded-xl border border-slate-200 bg-white px-4 py-5 transition-all hover:border-brand hover:shadow-sm"
              >
                <p className="font-semibold text-brand-dark">{cat.name}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{cat.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {query && products.length === 0 && companies.length === 0 && matchingArticles.length === 0 && (
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

      {companies.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-brand-dark">Empresas</h2>
            <Link href="/empresas" className="text-sm font-semibold text-brand-dark underline underline-offset-8">Ver directorio ↗</Link>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {companies.map((company) => (
              <Link key={company.id} href={`/e/${company.slug}`} className="border-t border-slate-200 pt-4 hover:text-hot">
                <h3 className="font-semibold text-brand-dark">{company.name}</h3>
                {company.location && <p className="mt-1 text-sm text-slate-500">{company.location}</p>}
                {company.description && <p className="mt-3 line-clamp-2 text-sm text-slate-600">{company.description}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {matchingArticles.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-brand-dark">Contenido</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {matchingArticles.map((article) => (
              <Link key={article.slug} href={`/articulos/${article.slug}`} className="border-t border-slate-200 pt-4 hover:text-hot">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-sky">{article.category}</p>
                <h3 className="mt-2 font-semibold text-brand-dark">{article.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{article.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-brand-dark">Anuncios</h2>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
