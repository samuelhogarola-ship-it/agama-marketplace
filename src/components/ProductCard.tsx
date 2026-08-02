import Link from "next/link";
import { photoUrl, productPath, type Product } from "@/lib/types";
import { categoryBySlug } from "@/lib/categories";

export function formatPrice(p: number | null): string {
  if (p === null) return "A consultar";
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 }).format(p);
}

export default function ProductCard({ product }: { product: Product }) {
  const photo = product.photos?.[0];
  return (
    <Link
      href={productPath(product)}
      className="group rounded-xl border border-slate-200 overflow-hidden bg-white hover:shadow-md transition-shadow"
    >
      <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl(photo.storage_path)}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-4xl">◇</div>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-brand font-medium">{categoryBySlug(product.category)?.name ?? product.category}</p>
        <h3 className="font-semibold text-slate-800 line-clamp-2 mt-1">{product.title}</h3>
        <p className="text-brand-dark font-bold mt-2">{formatPrice(product.price_mxn)}</p>
        {product.location && <p className="text-xs text-slate-500 mt-1">{product.location}</p>}
      </div>
    </Link>
  );
}
