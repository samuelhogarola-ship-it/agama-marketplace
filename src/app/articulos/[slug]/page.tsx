import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ARTICLES, articleBySlug } from "@/lib/articles";
import { safeJsonLd } from "@/lib/jsonld";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return ARTICLES.map((article) => ({ slug: article.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = articleBySlug((await params).slug);
  return article
    ? {
        title: article.title,
        description: article.excerpt,
        openGraph: { images: [article.cover] },
      }
    : {};
}

export default async function ArticlePage({ params }: Props) {
  const article = articleBySlug((await params).slug);
  if (!article) notFound();
  const jsonLd = { "@context": "https://schema.org", "@type": "Article", headline: article.title, description: article.excerpt, datePublished: article.date, image: article.cover, author: { "@type": "Organization", name: "TodoPlástico" } };
  return (
    <article className="mx-auto max-w-4xl px-5 py-14 sm:px-8 lg:py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <Link href="/articulos" className="text-sm font-semibold text-brand-dark underline decoration-slate-300 underline-offset-8 hover:decoration-brand">← Todo el contenido</Link>
      <header className="mt-10 max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-sky">{article.category}</p><h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.045em] text-brand-dark sm:text-6xl">{article.title}</h1><p className="mt-6 text-xl leading-8 text-slate-600">{article.excerpt}</p></header>
      <div className="relative mt-10 aspect-[16/8] overflow-hidden rounded-[4px] bg-slate-100"><Image src={article.cover} alt="" fill sizes="(min-width: 1024px) 896px, 100vw" className="object-cover" /></div>
      <div className="mx-auto mt-10 max-w-2xl space-y-6 text-lg leading-8 text-slate-700">{article.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
    </article>
  );
}
