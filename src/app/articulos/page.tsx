import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PUBLISHED_ARTICLES } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Artículos sobre la industria plástica — Guías y procesos",
  description: "Guías prácticas, procesos, marketing B2B y referencias técnicas para profesionales de la industria plástica en México.",
  alternates: { canonical: "/articulos" },
};

export default function ArticlesPage() {
  const [featured, ...rest] = PUBLISHED_ARTICLES;
  return (
    <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-sky">Contenido sectorial</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-brand-dark sm:text-6xl">Ideas para trabajar mejor el plástico.</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">Guías claras para comprar, fabricar, transformar y encontrar proveedores.</p>
      </div>
      <Link href={`/articulos/${featured.slug}`} className="group mt-12 grid overflow-hidden rounded-[4px] bg-brand-dark text-white md:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto"><Image src={featured.cover} alt={featured.title} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" /></div>
        <div className="flex flex-col justify-end p-7 sm:p-10"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">{featured.category}</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{featured.title}</h2><p className="mt-5 max-w-md leading-7 text-white/70">{featured.excerpt}</p><span className="mt-8 text-sm font-semibold text-hot">Leer artículo ↗</span></div>
      </Link>
      <div className="mt-14 grid gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
        {rest.map((article) => (
          <Link key={article.slug} href={`/articulos/${article.slug}`} className="group border-t border-slate-200 pt-4">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[4px] bg-slate-100"><Image src={article.cover} alt={article.title} fill sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" /></div>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-sky">{article.category}</p>
            <h2 className="mt-2 text-xl font-semibold leading-tight tracking-[-0.025em] text-brand-dark transition-colors group-hover:text-hot">{article.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{article.excerpt}</p>
            {article.author && <p className="mt-2 text-xs text-slate-400"><span className="font-medium text-slate-500">{article.author}</span> — {article.authorTitle}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
