"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SortSelectInner({ category }: { category: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sort = searchParams.get("sort") ?? "newest";

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`/c/${category}?${params.toString()}`);
  }

  return (
    <label className="flex items-center gap-2 text-sm text-slate-500">
      Ordenar
      <select
        value={sort}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand"
      >
        <option value="newest">Más recientes</option>
        <option value="price-asc">Precio menor</option>
        <option value="price-desc">Precio mayor</option>
      </select>
    </label>
  );
}

export default function SortSelect({ category }: { category: string }) {
  return (
    <Suspense
      fallback={
        <label className="flex items-center gap-2 text-sm text-slate-500">
          Ordenar
          <select className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-brand-dark outline-none">
            <option>Más recientes</option>
          </select>
        </label>
      }
    >
      <SortSelectInner category={category} />
    </Suspense>
  );
}
