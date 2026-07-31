import Link from "next/link";
import Image from "next/image";
import { CATEGORIES } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import HeroCarousel from "@/components/HeroCarousel";
import type { Product } from "@/lib/types";

export const revalidate = 300;

const categoryImages: Record<string, string> = {
  "envases-y-botellas": "/category-envases.png",
  "bolsas-y-pelicula": "/category-bolsas.png",
  "tarimas-y-contenedores": "/category-tarimas.png",
  "cubetas-y-bidones": "/category-cubetas.png",
  "perfiles-y-laminas": "/category-perfiles.png",
  "tuberia-y-conexiones": "/category-tuberia.png",
  "reciclado-y-molido": "/category-reciclado.png",
  resinas: "/category-resinas.png",
  "maquinaria-y-refacciones": "/category-maquinaria.png",
  "productos-terminados": "/category-productos.png",
  servicios: "/category-servicios.png",
};

export default async function Home() {
  const supabase = await createClient();
  const { data: latest } = await supabase
    .from("mkt_listings")
    .select("*, photos:mkt_listing_photos(*), company:mkt_companies(name, slug, location)")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <>
      <section className="relative isolate min-h-[620px] overflow-hidden bg-brand-dark text-white">
        <HeroCarousel />
        <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
        <div className="absolute left-5 top-6 flex items-center gap-2 sm:left-8 lg:left-12">
          <Image src="/agama-logo.png" alt="AGAMA" width={28} height={28} className="rounded-full opacity-90" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/75">Patrocinado por: AGAMA Pigmentos y Masterbatch</span>
        </div>
        <div className="relative mx-auto flex min-h-[620px] max-w-7xl items-end px-5 pb-12 sm:px-8 md:pb-16 lg:px-12">
          <div className="max-w-xl">
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
              Directorio profesional · México
            </p>
            <h1 className="max-w-lg text-5xl font-semibold leading-[0.98] tracking-[-0.04em] sm:text-6xl md:text-7xl">
              Encuentra lo que mueve al plástico.
            </h1>
            <p className="mt-7 max-w-md text-base leading-7 text-white/78 sm:text-lg">
              Empresas, productos y servicios para encontrar oportunidades reales en la industria plástica.
            </p>
            <form action="/buscar" className="mt-8 flex max-w-xl flex-col gap-2 rounded-2xl bg-white p-2 text-brand-dark shadow-2xl shadow-black/20 sm:flex-row">
              <label htmlFor="hero-search" className="sr-only">Buscar en TodoPlástico</label>
              <input
                id="hero-search"
                name="q"
                type="search"
                placeholder="¿Qué necesitas encontrar?"
                className="min-w-0 flex-1 rounded-xl px-4 py-3 text-sm outline-none placeholder:text-slate-400"
              />
              <button type="submit" className="rounded-xl bg-brand-dark px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand">
                Buscar
              </button>
            </form>
            <div className="mt-7 flex flex-wrap items-center gap-5">
              <Link href="/registro" className="text-sm font-semibold text-white underline decoration-white/40 underline-offset-8 hover:decoration-white">
                Publicar un anuncio gratis
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-sky">Explora</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-brand-dark sm:text-4xl">Explora por categoría.</h2>
          </div>
          <Link href="/categorias" className="hidden text-sm font-semibold text-brand-dark underline decoration-slate-300 underline-offset-8 hover:decoration-brand sm:block">
            Ver todas las categorías ↗
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-7 lg:gap-y-14">
          {CATEGORIES.map((category, index) => (
            <Link
              key={category.slug}
              href={`/c/${category.slug}`}
              className="group block"
            >
              <div className="aspect-[4/3] overflow-hidden rounded-[4px] bg-slate-100">
                {categoryImages[category.slug] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={categoryImages[category.slug]}
                    alt={category.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                )}
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 pt-4">
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="mt-2 block text-lg font-semibold leading-tight tracking-[-0.025em] text-brand-dark transition-colors group-hover:text-hot">
                    {category.name}
                  </span>
                </div>
                <span aria-hidden="true" className="pt-5 text-xl font-normal text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-hot">↗</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {latest && latest.length > 0 && (
        <section className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-sky">Lo más reciente</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-brand-dark sm:text-4xl">Anuncios que están pasando.</h2>
              </div>
              <Link href="/buscar" className="hidden text-sm font-semibold text-brand-dark underline decoration-slate-300 underline-offset-8 hover:decoration-brand sm:block">
                Ver anuncios ↗
              </Link>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
              {(latest as Product[]).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="border-t border-brand-dark pt-7 sm:flex sm:items-start sm:justify-between sm:gap-10">
          <h2 className="max-w-xl text-4xl font-semibold leading-tight tracking-[-0.04em] text-brand-dark sm:text-5xl">Tu empresa también merece estar aquí.</h2>
          <div className="mt-7 max-w-sm sm:mt-1">
            <p className="text-base leading-7 text-slate-600">Crea tu ficha profesional y publica hasta cinco anuncios sin costo.</p>
            <Link href="/registro" className="mt-7 inline-flex items-center gap-3 rounded-full bg-brand-dark px-6 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">
              Publicar gratis <span aria-hidden="true" className="text-lg leading-none">↗</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
