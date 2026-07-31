"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/categories";

export default function CategoryBrowseBar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <nav aria-label="Explorar categorías" className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl overflow-hidden px-5 sm:px-8 lg:px-12">
          <div className="flex min-w-max items-center gap-7 overflow-x-auto">
            <button
              type="button"
              aria-expanded={open}
              aria-controls="category-drawer"
              onClick={() => setOpen(true)}
              className="group flex shrink-0 items-center gap-3 border-b-2 border-brand-dark px-1 py-4 text-sm font-semibold text-brand-dark"
            >
              <span aria-hidden="true" className="flex w-5 flex-col gap-1">
                <span className="h-0.5 w-5 bg-current" />
                <span className="h-0.5 w-5 bg-current" />
                <span className="h-0.5 w-5 bg-current" />
              </span>
              Todas las categorías
            </button>
            {CATEGORIES.slice(0, 4).map((category) => (
              <Link key={category.slug} href={`/c/${category.slug}`} className="shrink-0 border-b-2 border-transparent px-1 py-4 text-sm font-medium text-slate-600 transition-colors hover:border-hot hover:text-hot">
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/35" role="presentation" onClick={() => setOpen(false)}>
          <aside
            id="category-drawer"
            aria-label="Todas las categorías"
            className="flex h-full w-[min(90vw,390px)] flex-col bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <h2 className="text-xl font-semibold tracking-[-0.02em] text-brand-dark">Todas las categorías</h2>
              <button type="button" aria-label="Cerrar categorías" onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center text-3xl font-light leading-none text-slate-500 hover:text-hot">
                ×
              </button>
            </div>
            <div className="overflow-y-auto px-6 pb-8">
              <Link href="/categorias" onClick={() => setOpen(false)} className="flex items-center justify-between border-b border-slate-200 py-4 text-base font-semibold text-brand-dark hover:text-hot">
                Ver todas
                <span aria-hidden="true">↗</span>
              </Link>
              {CATEGORIES.map((category) => (
                <Link key={category.slug} href={`/c/${category.slug}`} onClick={() => setOpen(false)} className="flex items-center justify-between border-b border-slate-200 py-4 text-base text-slate-600 transition-colors hover:text-hot">
                  {category.name}
                  <span aria-hidden="true" className="text-slate-300">›</span>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
