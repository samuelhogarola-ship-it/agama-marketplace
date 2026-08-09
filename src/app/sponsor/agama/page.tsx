import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { safeJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "AGAMA Pigmentos y Masterbatch — Patrocinador oficial",
  description:
    "AGAMA es fabricante líder de pigmentos y masterbatch en México. Conoce su catálogo de productos, colores y soluciones para la industria del plástico.",
  alternates: { canonical: "/sponsor/agama" },
};

const AGAMA_URL = "https://agama.com.mx";

const PRODUCT_CATALOG = [
  { name: "Masterbatch Blanco", sku: "MB-BL-01", application: "Inyección, soplado, extrusión", image: null },
  { name: "Masterbatch Negro", sku: "MB-NG-01", application: "Todo proceso", image: null },
  { name: "Pigmento Rojo 48:2", sku: "PG-RJ-482", application: "Plásticos de ingeniería", image: null },
  { name: "Pigmento Azul 15:3", sku: "PG-AZ-153", application: "Envases y empaques", image: null },
  { name: "Pigmento Amarillo 83", sku: "PG-AM-83", application: "Película y fibras", image: null },
  { name: "Pigmento Verde 7", sku: "PG-VD-07", application: "Inyección y extrusión", image: null },
  { name: "Masterbatch Naranja", sku: "MB-NR-01", application: "Soplado, inyección", image: null },
  { name: "Aditivo UV Estabilizador", sku: "AD-UV-01", application: "Productos de exterior", image: null },
  { name: "Aditivo Antiestático", sku: "AD-AE-01", application: "Película y empaques", image: null },
  { name: "Masterbatch Beige", sku: "MB-BG-01", application: "Muebles y perfiles", image: null },
  { name: "Pigmento Violeta 23", sku: "PG-VL-23", application: "Cosméticos y envases", image: null },
  { name: "Masterbatch Café", sku: "MB-CF-01", application: "Inyección, extrusión", image: null },
  { name: "Aditivo Deslizante", sku: "AD-DS-01", application: "Película y bolsas", image: null },
  { name: "Masterbatch Gris", sku: "MB-GR-01", application: "Perfiles y láminas", image: null },
  { name: "Pigmento Turquesa", sku: "PG-TQ-01", application: "Envases premium", image: null },
  { name: "Aditivo Antibloqueo", sku: "AD-AB-01", application: "Película stretch", image: null },
  { name: "Masterbatch Rosa", sku: "MB-RS-01", application: "Inyección", image: null },
  { name: "Pigmento Dorado", sku: "PG-DR-01", application: "Cosméticos y lujo", image: null },
  { name: "Masterbatch Fluorescente", sku: "MB-FL-01", application: "Señalización", image: null },
  { name: "Aditivo Retardante de Flama", sku: "AD-RF-01", application: "Construcción y eléctrico", image: null },
] as const;

const ADVANTAGES = [
  { title: "Fabricante directo", description: "Sin intermediarios. Precios de fábrica para volumen industrial." },
  { title: "Laboratorio de color", description: "Igualación de color exacta con equipo espectrofotométrico." },
  { title: "Entregas en 48h", description: "Producción ágil y red logística en todo México." },
  { title: "Soporte técnico", description: "Asesoría en formulación, dispersión y compatibilidad de resinas." },
] as const;

export default function AgamaSponsorPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://todo-plastico.com";
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AGAMA Pigmentos y Masterbatch",
    url: AGAMA_URL,
    logo: `${siteUrl}/agama-logo.png`,
    description: "Fabricante de pigmentos, masterbatch y aditivos para la industria del plástico en México.",
    contactPoint: { "@type": "ContactPoint", contactType: "sales", url: AGAMA_URL },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(orgJsonLd) }} />

      <section className="relative overflow-hidden bg-brand-dark text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-brand-dark to-brand/40" />
        <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:gap-16">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-white/10 p-4 lg:h-32 lg:w-32">
              <Image src="/agama-logo.png" alt="AGAMA" width={80} height={80} className="rounded-full" priority />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">Patrocinador oficial de TodoPlástico</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                AGAMA Pigmentos y Masterbatch
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">
                Fabricante mexicano de pigmentos, masterbatch y aditivos para la industria del plástico.
                Color preciso, calidad constante, entrega rápida.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href={AGAMA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-brand-dark transition-transform hover:-translate-y-0.5"
                >
                  Visitar agama.com.mx <span aria-hidden="true">↗</span>
                </a>
                <a
                  href={`${AGAMA_URL}/contacto`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Solicitar cotización
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-sky">Ventajas</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-brand-dark sm:text-4xl">
          ¿Por qué elegir AGAMA?
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {ADVANTAGES.map((adv) => (
            <div key={adv.title} className="rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-brand-dark">{adv.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{adv.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-sky">Catálogo</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-brand-dark sm:text-4xl">
                Productos AGAMA
              </h2>
              <p className="mt-3 max-w-2xl text-base text-slate-600">
                Masterbatch, pigmentos orgánicos e inorgánicos, y aditivos funcionales para todos los procesos de transformación.
              </p>
            </div>
            <a
              href={AGAMA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden text-sm font-semibold text-brand-dark underline decoration-slate-300 underline-offset-8 hover:decoration-brand sm:block"
            >
              Ver catálogo completo ↗
            </a>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {PRODUCT_CATALOG.map((product) => (
              <a
                key={product.sku}
                href={AGAMA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex h-28 items-center justify-center rounded-lg bg-slate-100">
                  <Image src="/agama-logo.png" alt={product.name} width={48} height={48} className="opacity-30" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-brand-dark group-hover:text-hot">{product.name}</h3>
                <p className="mt-1 text-xs text-slate-500">SKU: {product.sku}</p>
                <p className="mt-2 text-xs text-slate-600">{product.application}</p>
              </a>
            ))}
          </div>

          <div className="mt-10 text-center">
            <a
              href={AGAMA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-brand-dark px-8 py-4 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              Ver todos los productos en agama.com.mx <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="rounded-2xl bg-[#f4faef] p-8 sm:p-12 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:p-16">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-brand-dark sm:text-3xl">
              ¿Necesitas pigmentos o masterbatch?
            </h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
              Contacta directamente con AGAMA para cotización, muestras de color o asesoría técnica sin compromiso.
            </p>
          </div>
          <div className="mt-6 flex shrink-0 flex-wrap gap-4 lg:mt-0">
            <a
              href={`${AGAMA_URL}/contacto`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-brand-dark px-6 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              Contactar AGAMA <span aria-hidden="true">↗</span>
            </a>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-6 py-3.5 text-sm font-semibold text-brand-dark hover:border-brand"
            >
              Volver a TodoPlástico
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
