"use client";

import { useState } from "react";
import Link from "next/link";

export default function MobileNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 md:hidden">
        <button
          type="button"
          aria-label="Buscar"
          onClick={() => setSearchOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-brand hover:text-brand"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] rounded-full border border-slate-200 text-slate-600 hover:border-brand hover:text-brand"
        >
          <span className="h-0.5 w-4 bg-current transition-transform" />
          <span className="h-0.5 w-4 bg-current" />
          <span className="h-0.5 w-4 bg-current transition-transform" />
        </button>
      </div>

      {searchOpen && (
        <div className="absolute left-0 right-0 top-full z-40 border-b border-slate-200 bg-white px-4 py-3 shadow-md md:hidden">
          <form action="/buscar" onSubmit={() => setSearchOpen(false)}>
            <input
              autoFocus // eslint-disable-line jsx-a11y/no-autofocus
              type="search"
              name="q"
              placeholder="Buscar empresas, productos o servicios…"
              className="w-full rounded-full border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:border-brand"
            />
          </form>
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <nav
            aria-label="Menú principal"
            className="absolute right-0 top-0 flex h-full w-72 flex-col bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <span className="text-base font-semibold text-brand-dark">TodoPlástico</span>
              <button
                type="button"
                aria-label="Cerrar menú"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-2xl font-light text-slate-500 hover:text-hot"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2">
              {[
                { href: "/empresas", label: "Directorio de empresas" },
                { href: "/articulos", label: "Contenido sectorial" },
                { href: "/categorias", label: "Categorías" },
                { href: "/buscar", label: "Buscar" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center rounded-lg px-3 py-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-brand"
                >
                  {label}
                </Link>
              ))}
            </div>

            <div className="border-t border-slate-200 px-5 py-5">
              {isLoggedIn ? (
                <Link
                  href="/panel"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center justify-center rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
                >
                  Mi panel
                </Link>
              ) : (
                <div className="space-y-3">
                  <Link
                    href="/registro"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center justify-center rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
                  >
                    Publicar gratis
                  </Link>
                  <Link
                    href="/ingresar"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center justify-center rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-brand-dark hover:bg-slate-50"
                  >
                    Ingresar
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
