import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";

export const metadata: Metadata = { title: "Buscar", robots: { index: false } };

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (q ?? "").trim().slice(0, 100);
  // Sin caracteres con significado en la sintaxis de filtros PostgREST ni comodines ilike
  const safe = query.replace(/[,()%_\\]/g, " ").trim();
  const supabase = await createClient();

  let products: Product[] = [];
  if (safe) {
    const { data } = await supabase
      .from("mkt_products")
      .select("*, photos:mkt_product_photos(*), profile:mkt_profiles(company_name, slug, zone)")
      .eq("status", "published")
      .or(`title.ilike.%${safe}%,description.ilike.%${safe}%`)
      .limit(48);
    products = (data as Product[]) ?? [];
    // Log de demanda: el dato más valioso del marketplace (fire-and-forget)
    await supabase.from("mkt_search_queries").insert({ query, results_count: products.length });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-800">
        {query ? `Resultados para "${query}"` : "Buscar"}
      </h1>
      <form action="/buscar" className="mt-4 max-w-md">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Buscar productos de plástico…"
          className="w-full rounded-full border border-slate-300 px-4 py-2 focus:outline-none focus:border-brand"
        />
      </form>
      {query && products.length === 0 && (
        <p className="mt-8 text-slate-500">Sin resultados. Prueba con otra palabra o explora las categorías.</p>
      )}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
