import type { Metadata } from 'next';
import type { Article } from './articles';

export function articleSeo(article: Article, base: string) {
  const url = new URL(`/articulos/${article.slug}`, base).href;
  const image = new URL(article.cover, base).href;
  const modified = article.updatedAt ?? article.date;
  const metadata: Metadata = {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: 'article', title: article.title, description: article.excerpt,
      url, siteName: 'TodoPlásticos', locale: 'es_MX',
      images: [{ url: image, alt: article.title }],
      publishedTime: article.date, modifiedTime: modified,
    },
    twitter: {
      card: 'summary_large_image', title: article.title,
      description: article.excerpt, images: [image],
    },
  };
  const author = article.author
    ? { '@type': 'Person', name: article.author, ...(article.authorTitle ? { jobTitle: article.authorTitle } : {}) }
    : { '@type': 'Organization', name: 'TodoPlásticos' };
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: article.title, description: article.excerpt,
    url, mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image, datePublished: article.date, dateModified: modified,
    author, inLanguage: 'es-MX',
  };
  return { metadata, jsonLd };
}
