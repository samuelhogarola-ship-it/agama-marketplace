import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Categorías de productos de plástico",
  description: "Todas las categorías del marketplace: envases, bolsas, tarimas, resinas, reciclado, maquinaria y más.",
};

export default function CategoriasPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-800">Categorías</h1>
      <div className="mt-8 grid md:grid-cols-2 gap-4">
        {CATEGORIES.map((c) => (
          <Link key={c.slug} href={`/c/${c.slug}`} className="rounded-xl border border-slate-200 p-6 hover:border-brand hover:bg-brand-light">
            <h2 className="font-bold text-lg text-slate-800">{c.name}</h2>
            <p className="text-slate-500 mt-1 text-sm">{c.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
