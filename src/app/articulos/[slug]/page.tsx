import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PUBLISHED_ARTICLES, articleBySlug } from "@/lib/articles";
import { categoryBySlug } from "@/lib/categories";
import TrackedCatalogLink from "@/components/TrackedCatalogLink";
import { safeJsonLd } from "@/lib/jsonld";
import { articleSeo } from "@/lib/article-seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return PUBLISHED_ARTICLES.map((article) => ({ slug: article.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = articleBySlug((await params).slug);
  return article
    ? articleSeo(article, process.env.NEXT_PUBLIC_SITE_URL ?? "https://todo-plastico.com").metadata
    : {};
}

export default async function ArticlePage({ params }: Props) {
  const article = articleBySlug((await params).slug);
  if (!article) notFound();
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://todo-plastico.com";
  const { jsonLd } = articleSeo(article, base);
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: base },
      { "@type": "ListItem", position: 2, name: "Artículos", item: `${base}/articulos` },
      { "@type": "ListItem", position: 3, name: article.title, item: `${base}/articulos/${article.slug}` },
    ],
  };
  return (
    <article className="mx-auto max-w-4xl px-5 py-14 sm:px-8 lg:py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />
      <Link href="/articulos" className="text-sm font-semibold text-brand-dark underline decoration-slate-300 underline-offset-8 hover:decoration-brand">← Todo el contenido</Link>
      <header className="mt-10 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-sky">{article.category}</p>
        <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.045em] text-brand-dark sm:text-6xl">{article.title}</h1>
        <p className="mt-6 text-xl leading-8 text-slate-600">{article.excerpt}</p>
        <div className="mt-6 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
          <time dateTime={article.date} suppressHydrationWarning>{new Date(article.date + "T12:00:00").toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}</time>
          {article.updatedAt && <span>Actualizado: <time dateTime={article.updatedAt}>{new Date(article.updatedAt + "T12:00:00").toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}</time></span>}
          {article.author && (
            <>
              <span aria-hidden="true" className="hidden sm:inline">·</span>
              <span className="font-medium text-brand-dark">{article.author}</span>
              {article.authorTitle && <span className="text-slate-400">— {article.authorTitle}</span>}
            </>
          )}
        </div>
      </header>
      <div className="relative mt-10 aspect-[16/8] overflow-hidden rounded-[4px] bg-slate-100"><Image src={article.cover} alt={article.title} fill sizes="(min-width: 1024px) 896px, 100vw" className="object-cover" /></div>
      <div className="mx-auto mt-10 max-w-2xl space-y-8 text-lg leading-8 text-slate-700">
        {article.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        {article.sections?.map(section => <section key={section.heading}>
          <h2 className="mb-4 text-2xl font-semibold text-brand-dark">{section.heading}</h2>
          <div className="space-y-4">{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
        </section>)}
        {article.familySlugs && <nav aria-label="Consultar productos" className="rounded-xl bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-brand-dark">Consulta productos y proveedores</h2>
          <p className="mt-2 text-base">Revisa los anuncios disponibles y contacta directamente con cada empresa.</p>
          <div className="mt-4 flex flex-col gap-3">{article.familySlugs.map(slug => <TrackedCatalogLink key={slug} href={`/c/${slug}`} eventName="content_catalog_click" category={slug} article={article.slug} className="font-semibold text-brand-dark underline underline-offset-4">{categoryBySlug(slug)?.name}</TrackedCatalogLink>)}</div>
        </nav>}
        {article.sources && <section className="border-t border-slate-200 pt-6 text-sm leading-6">
          <h2 className="font-semibold text-brand-dark">Referencias técnicas</h2>
          <ul className="mt-3 space-y-2">{article.sources.map(source => <li key={source.url}><a href={source.url} className="underline underline-offset-4" rel="noreferrer">{source.label}</a></li>)}</ul>
          <p className="mt-3">Consulta la ficha del modelo concreto con su fabricante. Estas referencias no acreditan a los anunciantes del directorio.</p>
        </section>}
      </div>
    </article>
  );
}
