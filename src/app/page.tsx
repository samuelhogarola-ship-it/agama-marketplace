import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";

export const revalidate = 300;

export default async function Home() {
  const supabase = await createClient();
  const { data: latest } = await supabase
    .from("mkt_products")
    .select("*, photos:mkt_product_photos(*), profile:mkt_profiles(company_name, slug, zone)")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <>
      <section className="bg-brand-light border-b border-blue-100">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <h1 className="text-3xl md:text-5xl font-bold text-brand-dark max-w-2xl leading-tight">
            El marketplace de productos de plástico de la Ciudad de México
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-xl">
            Conecta con proveedores de envases, tarimas, bolsas, resinas, reciclado y más. Publica gratis hasta 5 productos.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/registro" className="rounded-full bg-brand text-white px-6 py-3 font-medium hover:bg-brand-dark">
              Empieza a vender gratis
            </Link>
            <Link href="/categorias" className="rounded-full border border-brand text-brand-dark px-6 py-3 font-medium hover:bg-white">
              Explorar catálogo
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold text-slate-800">Categorías</h2>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/c/${c.slug}`}
              className="rounded-xl border border-slate-200 p-4 hover:border-brand hover:bg-brand-light transition-colors"
            >
              <p className="font-semibold text-slate-800">{c.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {latest && latest.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-2xl font-bold text-slate-800">Publicaciones recientes</h2>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {(latest as Product[]).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-2xl bg-brand-dark text-white p-8 md:p-12 grid md:grid-cols-3 gap-8">
          <div>
            <p className="text-3xl font-bold text-accent">Gratis</p>
            <p className="mt-2 text-slate-300">Publica hasta 5 productos con 5 fotos cada uno, sin costo.</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-accent">Directo</p>
            <p className="mt-2 text-slate-300">Habla con compradores por mensajería interna y acuerda el envío.</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-accent">Confiable</p>
            <p className="mt-2 text-slate-300">Solo perfiles profesionales y solo productos de plástico, con moderación en cada publicación.</p>
          </div>
        </div>
      </section>
    </>
  );
}
