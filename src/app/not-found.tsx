import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-5 py-20 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-sky">Error 404</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-brand-dark sm:text-5xl">
        Página no encontrada
      </h1>
      <p className="mt-5 text-lg leading-8 text-slate-600">
        La página que buscas no existe o ha sido movida. Explora nuestras secciones principales.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link href="/" className="rounded-full bg-brand-dark px-6 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">
          Ir al inicio
        </Link>
        <Link href="/categorias" className="rounded-full border border-slate-300 px-6 py-3.5 text-sm font-semibold text-brand-dark hover:border-brand">
          Ver categorías
        </Link>
        <Link href="/empresas" className="rounded-full border border-slate-300 px-6 py-3.5 text-sm font-semibold text-brand-dark hover:border-brand">
          Directorio de empresas
        </Link>
      </div>
    </div>
  );
}
