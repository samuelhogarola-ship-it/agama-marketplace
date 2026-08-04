import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CATEGORIES } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Categorías de la industria plástica",
  description: "Todas las categorías de TodoPlástico para encontrar productos y proveedores de la industria plástica en México.",
};

const categoryImages: Record<string, string> = {
  "envases-y-botellas": "/category-envases.png",
  "bolsas-y-pelicula": "/category-bolsas.png",
  "tarimas-y-contenedores": "/category-tarimas.png",
  "cubetas-y-bidones": "/category-cubetas.png",
  "perfiles-y-laminas": "/category-perfiles.png",
  "tuberia-y-conexiones": "/category-tuberia.png",
};

export default async function CategoriasPage() {
  const supabase = await createClient();
  const counts = await Promise.all(
    CATEGORIES.map((cat) =>
      supabase
        .from("mkt_listings")
        .select("id", { count: "exact", head: true })
        .eq("status", "published")
        .eq("category", cat.slug)
        .then(({ count }) => count ?? 0)
    )
  );

  return (
    <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-sky">Índice de categorías</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-brand-dark sm:text-5xl">
          Categorías de la industria plástica.
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          Encuentra fabricantes, distribuidores y proveedores por tipo de producto en México.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-7 lg:gap-y-14">
        {CATEGORIES.map((category, index) => (
          <Link key={category.slug} href={`/c/${category.slug}`} className="group block">
            <div className="aspect-[4/3] overflow-hidden rounded-[4px] bg-slate-100">
              {categoryImages[category.slug] ? (
                <Image
                  src={categoryImages[category.slug]}
                  alt={category.name}
                  width={600}
                  height={450}
                  loading={index < 3 ? "eager" : "lazy"}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              ) : (
                <div className="h-full w-full bg-slate-100" />
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
                <span className="mt-1 block text-sm leading-6 text-slate-500">{category.description}</span>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 pt-5">
                <span aria-hidden="true" className="text-xl font-normal text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-hot">↗</span>
                {counts[index] > 0 && (
                  <span className="text-xs text-slate-400">{counts[index]} anuncio{counts[index] !== 1 ? "s" : ""}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
