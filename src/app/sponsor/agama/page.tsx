import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { safeJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "AGAMA para la industria plástica - Patrocinador oficial",
  description:
    "AGAMA acompaña a TodoPlástico como patrocinador especializado en color, masterbatch y soluciones técnicas para transformadores plásticos.",
  alternates: { canonical: "/sponsor/agama" },
};

const AGAMA_URL = "https://agama.com.mx";

const SOLUTIONS = [
  {
    title: "Masterbatch a medida",
    description:
      "Concentrados de color formulados para inyección, soplado, extrusión y película.",
  },
  {
    title: "Pigmentos técnicos",
    description:
      "Opciones orgánicas e inorgánicas para piezas con requerimientos de tono, opacidad o resistencia.",
  },
  {
    title: "Aditivos funcionales",
    description:
      "Soluciones UV, antiestáticas, deslizantes y de desempeño para productos plásticos exigentes.",
  },
  {
    title: "Igualación de color",
    description:
      "Acompañamiento técnico para llevar una muestra física a una formulación reproducible.",
  },
] as const;

const WORKFLOW = [
  "Revisar aplicación, resina y proceso de transformación.",
  "Definir color, desempeño esperado y volumen de compra.",
  "Solicitar muestra o cotización directamente con el equipo AGAMA.",
] as const;

export default function AgamaSponsorPage() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://todo-plastico.com";
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AGAMA Pigmentos y Masterbatch",
    url: AGAMA_URL,
    logo: `${siteUrl}/agama-logo.png`,
    description:
      "Fabricante de pigmentos, masterbatch y aditivos para la industria del plástico en México.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      url: `${AGAMA_URL}/contacto`,
    },
  };

  return (
    <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(orgJsonLd) }}
      />

      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-sm text-slate-500"
      >
        <Link
          href="/"
          className="text-brand-sky underline-offset-4 hover:underline"
        >
          Inicio
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-slate-700">AGAMA</span>
      </nav>

      <section className="mt-10 grid gap-10 border-b border-slate-200 pb-14 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-sky">
            TodoPlástico · Patrocinador oficial
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.03] tracking-[-0.045em] text-brand-dark sm:text-6xl">
            AGAMA para la industria plástica.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            En TodoPlástico mantenemos el marketplace enfocado en proveedores
            B2B de productos y servicios plásticos. Cuando una empresa necesita
            color, masterbatch o soporte técnico especializado, el canal
            recomendado es AGAMA.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={`${AGAMA_URL}/contacto`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-brand-dark px-6 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              Contactar AGAMA <span aria-hidden="true">↗</span>
            </a>
            <a
              href={AGAMA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-brand-dark underline decoration-slate-300 underline-offset-8 hover:decoration-brand"
            >
              Visitar agama.com.mx ↗
            </a>
          </div>
        </div>

        <aside className="border-t border-brand-dark pt-6 lg:border-t-0 lg:pt-0">
          <div className="flex items-center gap-4">
            <Image
              src="/agama-logo.png"
              alt="AGAMA"
              width={72}
              height={72}
              className="rounded-full"
              priority
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Una iniciativa apoyada por
              </p>
              <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-dark">
                AGAMA Pigmentos y Masterbatch
              </p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-600">
            AGAMA es el punto de contacto externo para pigmentos, masterbatch y
            aditivos. Estos productos no se publican como anuncios dentro del
            marketplace para mantener clara la política comercial de
            TodoPlástico.
          </p>
        </aside>
      </section>

      <section className="py-14 lg:py-20">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-sky">
              Especialidad AGAMA
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-brand-dark sm:text-4xl">
              Soluciones destacadas
            </h2>
          </div>
          <a
            href={AGAMA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-sm font-semibold text-brand-dark underline decoration-slate-300 underline-offset-8 hover:decoration-brand sm:block"
          >
            Ver sitio AGAMA ↗
          </a>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {SOLUTIONS.map((solution, index) => (
            <a
              key={solution.title}
              href={AGAMA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group block border-t border-slate-200 pt-5"
            >
              <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-lg font-semibold leading-tight tracking-[-0.025em] text-brand-dark transition-colors group-hover:text-hot">
                {solution.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {solution.description}
              </p>
            </a>
          ))}
        </div>
      </section>

      <section className="grid gap-10 border-t border-slate-200 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:py-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-sky">
            Cómo continuar
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-brand-dark sm:text-4xl">
            Si buscas pigmentos o masterbatch, ve directo al canal AGAMA.
          </h2>
        </div>
        <div className="space-y-5">
          {WORKFLOW.map((step, index) => (
            <div key={step} className="border-t border-slate-200 pt-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Paso {index + 1}
              </span>
              <p className="mt-2 text-base leading-7 text-slate-700">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-brand-dark py-10 sm:flex sm:items-start sm:justify-between sm:gap-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-sky">
            TodoPlástico
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-brand-dark sm:text-4xl">
            El marketplace sigue siendo para productos y servicios plásticos
            permitidos.
          </h2>
        </div>
        <div className="mt-7 flex shrink-0 flex-wrap gap-4 sm:mt-1">
          <Link
            href="/categorias"
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-6 py-3.5 text-sm font-semibold text-brand-dark hover:border-brand"
          >
            Explorar categorías
          </Link>
          <Link
            href="/registro"
            className="inline-flex items-center gap-2 rounded-full bg-brand-dark px-6 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            Publicar gratis <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
