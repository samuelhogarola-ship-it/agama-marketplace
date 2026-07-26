import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import CookieBanner from "@/components/CookieBanner";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "AGAMA Marketplace — Productos de plástico en CDMX",
    template: "%s | AGAMA Marketplace",
  },
  description:
    "El marketplace de productos de plástico de Ciudad de México. Encuentra proveedores de envases, tarimas, bolsas, resinas, reciclado y más. Un servicio de AGAMA.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="es-MX">
      <body className="min-h-screen flex flex-col">
        <div className="bg-brand-dark text-white text-xs">
          <div className="mx-auto max-w-6xl px-4 py-1.5 flex items-center justify-center gap-2 opacity-90">
            <Image src="/agama-logo.png" alt="AGAMA" width={16} height={16} className="rounded-full" />
            <span>Un servicio de <span className="font-semibold tracking-wide">AGAMA</span></span>
          </div>
        </div>
        <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
          <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <Image src="/agama-logo.png" alt="AGAMA" width={34} height={34} className="rounded-full" />
              <span className="font-bold text-xl text-brand-dark leading-none">
                Marketplace
                <span className="block text-[10px] font-medium tracking-[0.2em] text-brand-sky uppercase">Plásticos · CDMX</span>
              </span>
            </Link>
            <form action="/buscar" className="hidden md:block flex-1 max-w-md">
              <input
                type="search"
                name="q"
                placeholder="Buscar productos de plástico…"
                className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:border-brand"
              />
            </form>
            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link href="/categorias" className="hover:text-brand text-slate-700">Categorías</Link>
              {user ? (
                <>
                  <Link href="/mensajes" className="hover:text-brand text-slate-700">Mensajes</Link>
                  <Link href="/panel" className="rounded-full bg-brand text-white px-4 py-2 hover:bg-brand-dark">Mi panel</Link>
                </>
              ) : (
                <>
                  <Link href="/ingresar" className="hover:text-brand text-slate-700">Ingresar</Link>
                  <Link href="/registro" className="rounded-full bg-brand text-white px-4 py-2 hover:bg-brand-dark">
                    Vender
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-brand-dark text-white mt-16">
          <div className="mx-auto max-w-6xl px-4 py-12 grid md:grid-cols-3 gap-8 text-sm">
            <div>
              <div className="flex items-center gap-2.5">
                <Image src="/agama-logo.png" alt="AGAMA" width={36} height={36} className="rounded-full" />
                <p className="font-bold text-lg">AGAMA Marketplace</p>
              </div>
              <p className="mt-3 text-slate-300">
                El punto de encuentro del sector plástico en la Ciudad de México. Operado por AGAMA.
              </p>
            </div>
            <div>
              <p className="font-semibold text-white/90">Marketplace</p>
              <ul className="mt-3 space-y-2 text-slate-300">
                <li><Link href="/categorias" className="hover:text-white">Categorías</Link></li>
                <li><Link href="/registro" className="hover:text-white">Vende con nosotros</Link></li>
                <li><Link href="/ingresar" className="hover:text-white">Ingresar</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white/90">Legal</p>
              <ul className="mt-3 space-y-2 text-slate-300">
                <li><Link href="/legal/terminos" className="hover:text-white">Términos de uso</Link></li>
                <li><Link href="/legal/privacidad" className="hover:text-white">Aviso de privacidad</Link></li>
                <li><Link href="/legal/cookies" className="hover:text-white">Política de cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10">
            <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-slate-400 flex flex-col md:flex-row justify-between gap-2">
              <p>© {new Date().getFullYear()} AGAMA. Todos los derechos reservados.</p>
              <p>Solo productos de plástico. Toda publicación pasa por moderación.</p>
            </div>
          </div>
        </footer>
        <CookieBanner />
      </body>
    </html>
  );
}
