import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { categoryBySlug } from "@/lib/categories";
import { type Product } from "@/lib/types";
import { formatPrice } from "@/components/ProductCard";
import ListingGallery from "@/components/ListingGallery";
import ShareButton from "@/components/ShareButton";
import ProductCard from "@/components/ProductCard";
import { safeJsonLd } from "@/lib/jsonld";
import { photoUrl } from "@/lib/types";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

function parseId(slug: string): number | null {
  const m = slug.match(/-(\d+)$/);
  return m ? Number(m[1]) : null;
}

function contactHref(method?: string | null, value?: string | null) {
  if (!method || !value) return null;
  if (method === "email") return `mailto:${value}`;
  if (method === "phone") return `tel:${value}`;
  if (method === "whatsapp") return `https://wa.me/${value.replace(/\D/g, "")}`;
  return null;
}

function contactLabel(method?: string | null) {
  if (method === "email") return "Contactar por email";
  if (method === "phone") return "Llamar";
  if (method === "whatsapp") return "Contactar por WhatsApp";
  return "Contactar";
}

function formatDate(value?: string | null) {
  if (!value) return "Publicado recientemente";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

async function getProduct(id: number): Promise<Product | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mkt_listings")
    .select(
      "*, photos:mkt_listing_photos(*), company:mkt_companies(name, slug, location, website, phone, email, whatsapp, logo_url)"
    )
    .eq("status", "published")
    .eq("id", id)
    .single();
  return data as Product | null;
}

function ContactActions({
  product,
  primary = false,
}: {
  product: Product;
  primary?: boolean;
}) {
  const listingContactHref = contactHref(
    product.contact_override?.method,
    product.contact_override?.value
  );
  return (
    <div className={primary ? "mt-5 space-y-3" : "mt-4 flex flex-wrap gap-2 text-sm"}>
      {listingContactHref ? (
        <a
          href={listingContactHref}
          target={
            product.contact_override?.method === "whatsapp" ? "_blank" : undefined
          }
          rel="noreferrer"
          className={
            primary
              ? "block rounded-full bg-brand px-5 py-3 text-center text-sm font-semibold text-white hover:bg-brand-dark"
              : "rounded-full bg-brand px-3 py-1.5 text-white hover:bg-brand-dark"
          }
        >
          {contactLabel(product.contact_override?.method)}
        </a>
      ) : null}
      {product.external_url ? (
        <a
          href={product.external_url}
          target="_blank"
          rel="noreferrer"
          className={
            primary
              ? "block rounded-full border border-brand px-5 py-3 text-center text-sm font-semibold text-brand-dark hover:bg-brand-light"
              : "rounded-full border border-brand px-3 py-1.5 text-brand-dark hover:bg-brand-light"
          }
        >
          Ver en la web del anunciante
        </a>
      ) : null}
      {!primary && product.company?.website ? (
        <a
          href={product.company.website}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-slate-200 px-3 py-1.5 hover:border-brand"
        >
          Web empresa
        </a>
      ) : null}
    </div>
  );
}

function SummaryPanel({
  product,
  categoryName,
  siteUrl,
}: {
  product: Product;
  categoryName?: string;
  siteUrl: string;
}) {
  const fullUrl = `${siteUrl}/p/${product.slug}-${product.id}`;
  return (
    <aside className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-sky">
        {categoryName ?? "Producto"}
      </p>
      <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.03em] text-brand-dark">
        {product.title}
      </h1>
      <p className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-brand-dark">
        {formatPrice(product.price_mxn)}
        {product.unit && product.price_mxn !== null ? (
          <span className="text-base font-normal text-slate-500">
            {" "}/ {product.unit}
          </span>
        ) : null}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-[6px] bg-slate-50 px-3 py-3">
          <p className="text-xs text-slate-400">Compra mínima</p>
          <p className="mt-1 font-semibold text-brand-dark">
            {product.min_purchase_qty ?? 1} {product.unit ?? "unidad"}
          </p>
        </div>
        <div className="rounded-[6px] bg-slate-50 px-3 py-3">
          <p className="text-xs text-slate-400">Ubicación</p>
          <p className="mt-1 font-semibold text-brand-dark">
            {product.location ?? "México"}
          </p>
        </div>
      </div>
      <ContactActions product={product} primary />
      <div className="mt-4">
        <ShareButton title={product.title} url={fullUrl} />
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-400">
        TodoPlástico no procesa pagos ni intermedia operaciones. El acuerdo se
        realiza directamente entre empresas.
      </p>
    </aside>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const id = parseId(slug);
  if (!id) return {};
  const product = await getProduct(id);
  if (!product) return {};
  return {
    title: product.title,
    description: product.description.slice(0, 160),
    alternates: { canonical: `/p/${product.slug}-${product.id}` },
    openGraph: product.photos?.[0]
      ? { images: [photoUrl(product.photos[0].storage_path)] }
      : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const id = parseId(slug);
  if (!id) notFound();
  const product = await getProduct(id);
  if (!product) notFound();

  const cat = categoryBySlug(product.category);
  const photos = (product.photos ?? []).sort((a, b) => a.position - b.position);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://todo-plastico.com";

  // Related: same company + same category (parallel)
  const supabase = await createClient();
  const [{ data: sameCompany }, { data: sameCategory }] = await Promise.all([
    supabase
      .from("mkt_listings")
      .select("*, photos:mkt_listing_photos(*), company:mkt_companies(name, slug, location)")
      .eq("status", "published")
      .eq("company_id", product.company_id)
      .neq("id", product.id)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("mkt_listings")
      .select("*, photos:mkt_listing_photos(*), company:mkt_companies(name, slug, location)")
      .eq("status", "published")
      .eq("category", product.category)
      .neq("id", product.id)
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: photos.map((p) => photoUrl(p.storage_path)),
    category: cat?.name,
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      areaServed: "México",
      price: product.price_mxn,
      priceCurrency: "MXN",
      seller: { "@type": "Organization", name: product.company?.name },
    },
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-brand">
          Inicio
        </Link>
        {" / "}
        {cat ? (
          <Link href={`/c/${cat.slug}`} className="hover:text-brand">
            {cat.name}
          </Link>
        ) : (
          "Anuncio"
        )}
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="min-w-0">
          <ListingGallery photos={photos} title={product.title} />

          <div className="mt-6 lg:hidden">
            <SummaryPanel
              product={product}
              categoryName={cat?.name}
              siteUrl={siteUrl}
            />
          </div>

          <section className="mt-8 border-t border-slate-200 py-6">
            <h2 className="text-lg font-semibold text-brand-dark">
              Descripción
            </h2>
            <p className="mt-4 whitespace-pre-line text-base leading-8 text-slate-600">
              {product.description}
            </p>
          </section>

          <section className="border-t border-slate-200 py-6">
            <h2 className="text-lg font-semibold text-brand-dark">
              Características
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                ["Categoría", cat?.name ?? product.category],
                [
                  "Tipo",
                  product.type === "product"
                    ? "Producto"
                    : "Servicio",
                ],
                ["Cómo se vende", product.unit ?? "unidad"],
                ["Compra mínima", String(product.min_purchase_qty ?? 1)],
              ].map(([dt, dd]) => (
                <div
                  key={dt}
                  className="flex justify-between gap-4 border-b border-slate-100 pb-3"
                >
                  <dt className="text-sm text-slate-400">{dt}</dt>
                  <dd className="text-right text-sm font-semibold text-brand-dark">
                    {dd}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="border-t border-slate-200 py-6">
            <h2 className="text-lg font-semibold text-brand-dark">
              Empresa anunciante
            </h2>
            {product.company ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50">
                    {product.company.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.company.logo_url}
                        alt={`Logo de ${product.company.name}`}
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-brand-dark">
                        {product.company.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <Link
                      href={`/e/${product.company.slug}`}
                      className="text-base font-semibold text-brand-dark hover:underline"
                    >
                      {product.company.name}
                    </Link>
                    <p className="mt-1 text-sm text-slate-500">
                      {product.company.location ??
                        product.location ??
                        "México"}
                    </p>
                  </div>
                </div>
                <ContactActions product={product} />
              </div>
            ) : null}
          </section>

          <section className="border-t border-slate-200 py-4 text-sm text-slate-400">
            <span>
              {product.updated_at
                ? `Actualizado ${formatDate(product.updated_at)}`
                : `Publicado ${formatDate(product.created_at)}`}
            </span>
          </section>

          {/* Más de esta empresa */}
          {sameCompany && sameCompany.length > 0 && (
            <section className="border-t border-slate-200 pt-10">
              <div className="flex items-end justify-between gap-4">
                <h2 className="text-xl font-semibold tracking-[-0.02em] text-brand-dark">
                  Más de {product.company?.name ?? "esta empresa"}
                </h2>
                {product.company && (
                  <Link
                    href={`/e/${product.company.slug}`}
                    className="text-sm font-semibold text-brand-dark underline decoration-slate-300 underline-offset-8 hover:decoration-brand"
                  >
                    Ver ficha ↗
                  </Link>
                )}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(sameCompany as Product[]).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}

          {/* Más en esta categoría */}
          {sameCategory && sameCategory.length > 0 && (
            <section className="mt-10 border-t border-slate-200 pt-10">
              <div className="flex items-end justify-between gap-4">
                <h2 className="text-xl font-semibold tracking-[-0.02em] text-brand-dark">
                  Más en {cat?.name ?? "esta categoría"}
                </h2>
                {cat && (
                  <Link
                    href={`/c/${cat.slug}`}
                    className="text-sm font-semibold text-brand-dark underline decoration-slate-300 underline-offset-8 hover:decoration-brand"
                  >
                    Ver categoría ↗
                  </Link>
                )}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(sameCategory as Product[]).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
        </section>

        <div className="hidden lg:sticky lg:top-24 lg:block">
          <SummaryPanel
            product={product}
            categoryName={cat?.name}
            siteUrl={siteUrl}
          />
        </div>
      </div>
    </main>
  );
}
