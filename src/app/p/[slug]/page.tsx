import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { categoryBySlug } from "@/lib/categories";
import { photoUrl, type Product } from "@/lib/types";
import { formatPrice } from "@/components/ProductCard";
import ContactSellerButton from "@/components/ContactSellerButton";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

function parseId(slug: string): number | null {
  const m = slug.match(/-(\d+)$/);
  return m ? Number(m[1]) : null;
}

async function getProduct(id: number): Promise<Product | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mkt_products")
    .select("*, photos:mkt_product_photos(*), profile:mkt_profiles(company_name, slug, zone)")
    .eq("status", "published")
    .eq("id", id)
    .single();
  return data as Product | null;
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
    openGraph: product.photos?.[0] ? { images: [photoUrl(product.photos[0].path)] } : undefined,
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: photos.map((p) => photoUrl(p.path)),
    category: cat?.name,
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      areaServed: "Ciudad de México",
      ...(product.price_mxn !== null
        ? { price: product.price_mxn, priceCurrency: "MXN" }
        : {}),
      seller: { "@type": "Organization", name: product.profile?.company_name },
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-brand">Inicio</Link>
        {" / "}
        {cat && <Link href={`/c/${cat.slug}`} className="hover:text-brand">{cat.name}</Link>}
      </nav>

      <div className="mt-6 grid md:grid-cols-2 gap-10">
        <div>
          <div className="aspect-[4/3] rounded-xl bg-slate-100 overflow-hidden">
            {photos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl(photos[0].path)} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300 text-6xl">◇</div>
            )}
          </div>
          {photos.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {photos.slice(1).map((ph) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={ph.id} src={photoUrl(ph.path)} alt="" className="aspect-square rounded-lg object-cover bg-slate-100" />
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{product.title}</h1>
          <p className="mt-3 text-2xl font-bold text-brand-dark">
            {formatPrice(product.price_mxn)}
            {product.unit && product.price_mxn !== null && <span className="text-base font-normal text-slate-500"> / {product.unit}</span>}
          </p>
          {product.zone && <p className="mt-2 text-sm text-slate-500">📍 {product.zone}</p>}

          <div className="mt-6 rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Vendido por</p>
            {product.profile && (
              <Link href={`/e/${product.profile.slug}`} className="font-semibold text-brand-dark hover:underline">
                {product.profile.company_name}
              </Link>
            )}
            <ContactSellerButton productId={product.id} sellerId={product.owner_id} />
            <p className="mt-2 text-xs text-slate-400">El envío se acuerda directamente con el vendedor.</p>
          </div>

          <div className="mt-8">
            <h2 className="font-bold text-slate-800">Descripción</h2>
            <p className="mt-2 text-slate-600 whitespace-pre-line">{product.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
