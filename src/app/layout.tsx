import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import CookieBanner from "@/components/CookieBanner";
import Analytics from "@/components/Analytics";
import CategoryBrowseBar from "@/components/CategoryBrowseBar";
import MobileNav from "@/components/MobileNav";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "TodoPlástico — Mercado para comprar productos plásticos en México",
    template: "%s | TodoPlástico",
  },
  description:
    "Mercado B2B gratuito para comprar productos plásticos en México: envases, bolsas, sillas, maquinaria, resinas y más. Impulsado por AGAMA.",
  icons: {
    icon: [{ url: "/todoplastico-symbol.png", type: "image/png" }],
    apple: "/todoplastico-symbol.png",
  },
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "TodoPlástico",
    images: [{ url: "/todoplastico-symbol.png", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="es-MX">
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
          <div className="relative mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-2 md:py-4">
            <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="TodoPlástico, inicio">
              <Image src="/todoplastico-symbol.png" alt="TodoPlástico" width={42} height={26} priority className="h-[26px] w-[42px] object-contain" />
              <span className="text-lg font-bold leading-none text-brand-dark sm:text-xl">
                TodoPlástico
                <span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.14em] text-brand-sky sm:text-[10px]">Mercado para la industria plástica</span>
              </span>
            </Link>
            <form action="/buscar" className="hidden md:flex flex-1 max-w-md items-center gap-0">
              <input
                type="search"
                name="q"
                placeholder="Buscar empresas, productos o servicios…"
                className="w-full rounded-l-full border border-r-0 border-slate-300 px-4 py-2 text-sm focus:outline-none focus:border-brand"
              />
              <button type="submit" aria-label="Buscar" className="flex h-[38px] items-center rounded-r-full border border-slate-300 bg-slate-50 px-3 text-slate-500 hover:bg-brand hover:text-white hover:border-brand">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </button>
            </form>
            <nav aria-label="Navegación principal" className="flex items-center gap-4 text-sm font-medium">
              <Link href="/empresas" className="hidden text-slate-700 hover:text-brand lg:block">Empresas</Link>
              <Link href="/articulos" className="hidden text-slate-700 hover:text-brand lg:block">Contenido</Link>
              <Link href="/categorias" className="hidden text-slate-700 hover:text-brand md:block">Categorías</Link>
              {user ? (
                <Link href="/panel" className="hidden rounded-full bg-brand px-4 py-2 text-white hover:bg-brand-dark md:block">Mi panel</Link>
              ) : (
                <>
                  <Link href="/ingresar" className="hidden text-slate-700 hover:text-brand md:block">Ingresar</Link>
                  <Link href="/registro" className="hidden rounded-full bg-brand px-4 py-2 text-white hover:bg-brand-dark md:block">Publicar</Link>
                </>
              )}
              <MobileNav isLoggedIn={!!user} />
            </nav>
          </div>
        </header>
        <CategoryBrowseBar />
        <main className="flex-1">{children}</main>
        <footer className="bg-brand-dark text-white mt-16">
          <div className="mx-auto max-w-7xl px-4 py-12 grid md:grid-cols-3 gap-8 text-sm">
            <div>
              <div className="flex items-center gap-2.5">
                <Image src="/agama-logo.png" alt="AGAMA" width={36} height={36} className="rounded-full" />
                <p className="font-bold text-lg">TodoPlástico</p>
              </div>
              <p className="mt-3 text-slate-300">
                Directorio B2B gratuito para la industria del plástico en México.
              </p>
              <p className="mt-5 text-xs uppercase tracking-[0.16em] text-white/60">Patrocinador</p>
              <Link href="/sponsor/agama" className="mt-1 block font-semibold text-white hover:text-brand-sky">AGAMA Pigmentos y Masterbatch</Link>
            </div>
            <div>
              <p className="font-semibold text-white/90">TodoPlástico</p>
              <ul className="mt-3 space-y-2 text-slate-300">
                <li><Link href="/categorias" className="hover:text-white">Categorías</Link></li>
                <li><Link href="/empresas" className="hover:text-white">Directorio de empresas</Link></li>
                <li><Link href="/articulos" className="hover:text-white">Contenido sectorial</Link></li>
                <li><Link href="/registro" className="hover:text-white">Publica tu empresa</Link></li>
                <li><Link href="/ingresar" className="hover:text-white">Ingresar</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white/90">Legal</p>
              <ul className="mt-3 space-y-2 text-slate-300">
                <li><Link href="/legal/terminos" className="hover:text-white">Términos de uso</Link></li>
                <li><Link href="/legal/comunidad" className="hover:text-white">Normas de la comunidad</Link></li>
                <li><Link href="/legal/privacidad" className="hover:text-white">Aviso de privacidad</Link></li>
                <li><Link href="/legal/cookies" className="hover:text-white">Política de cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10">
            <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-slate-400 flex flex-col md:flex-row justify-between gap-2">
              <p>© {new Date().getFullYear()} TodoPlástico. Todos los derechos reservados.</p>
              <p>Productos, servicios y anuncios B2B del sector plástico. Toda publicación pasa por moderación.</p>
            </div>
          </div>
        </footer>
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
}
