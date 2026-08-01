import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import CookieBanner from "@/components/CookieBanner";
import CategoryBrowseBar from "@/components/CategoryBrowseBar";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "TodoPlástico — Directorio B2B de la industria plástica en México",
    template: "%s | TodoPlástico",
  },
  description:
    "Directorio B2B gratuito de empresas, productos, servicios y anuncios de la industria del plástico en México. Impulsado por AGAMA.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="es-MX">
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
          <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-2 md:py-4">
            <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="TodoPlástico, inicio">
              <Image src="/agama-logo.png" alt="AGAMA" width={34} height={34} priority className="rounded-full" />
              <span className="text-lg font-bold leading-none text-brand-dark sm:text-xl">
                TodoPlástico
                <span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.14em] text-brand-sky sm:text-[10px]">Marketplace para la industria plástica</span>
              </span>
            </Link>
            <form action="/buscar" className="hidden md:block flex-1 max-w-md">
              <input
                type="search"
                name="q"
                placeholder="Buscar empresas, productos o servicios…"
                className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:border-brand"
              />
            </form>
            <nav aria-label="Navegación principal" className="flex items-center gap-4 text-sm font-medium">
              <Link href="/empresas" className="hidden text-slate-700 hover:text-brand lg:block">Empresas</Link>
              <Link href="/articulos" className="hidden text-slate-700 hover:text-brand lg:block">Contenido</Link>
              <Link href="/categorias" className="hover:text-brand text-slate-700">Categorías</Link>
              {user ? (
                <>
                  <Link href="/panel" className="rounded-full bg-brand text-white px-4 py-2 hover:bg-brand-dark">Mi panel</Link>
                </>
              ) : (
                <>
                  <Link href="/ingresar" className="hover:text-brand text-slate-700">Ingresar</Link>
                  <Link href="/registro" className="rounded-full bg-brand text-white px-4 py-2 hover:bg-brand-dark">
                    Publicar
                  </Link>
                </>
              )}
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
              <p className="mt-5 text-xs uppercase tracking-[0.16em] text-white/60">Esponsor</p>
              <p className="mt-1 font-semibold text-white">AGAMA Pigmentos y Masterbatch</p>
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
      </body>
    </html>
  );
}
