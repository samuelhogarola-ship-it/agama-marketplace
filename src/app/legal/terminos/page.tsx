import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Términos de uso" };

export default function TerminosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 [&_h2]:font-bold [&_h2]:text-slate-800 [&_h2]:mt-8 [&_h2]:text-lg [&_p]:mt-3 [&_p]:text-slate-600 [&_li]:text-slate-600">
      <h1 className="text-3xl font-bold text-slate-800">Términos de uso</h1>
      <p className="text-sm text-slate-400 mt-2">Última actualización: julio de 2026</p>

      <h2>1. El servicio</h2>
      <p>
        AGAMA Marketplace (el «Servicio») es una plataforma operada por AGAMA (el «Operador») que permite a
        empresas y profesionales del sector plástico publicar productos y contactar entre sí. AGAMA Marketplace
        es un punto de encuentro: <strong>no somos parte de las operaciones de compraventa</strong>, no procesamos
        pagos entre usuarios y no intervenimos en envíos, garantías ni facturación entre las partes.
      </p>

      <h2>2. Cuentas</h2>
      <p>
        El registro está reservado a perfiles profesionales (empresas, fabricantes, distribuidores y prestadores de
        servicios del sector plástico). El titular de la cuenta es responsable de la veracidad de sus datos y de la
        actividad realizada con ella.
      </p>

      <h2>3. Contenido permitido</h2>
      <p>Solo se permite publicar productos de plástico y servicios directamente relacionados. Está prohibido publicar:</p>
      <ul className="list-disc pl-6 mt-2 space-y-1">
        <li>Pigmentos, masterbatch, concentrados de color y aditivos, en cualquier forma.</li>
        <li>Productos o servicios ajenos al sector plástico.</li>
        <li>Productos ilegales, falsificados o peligrosos.</li>
        <li>Datos de contacto (teléfono, email, WhatsApp) dentro de fichas de producto; el contacto se realiza por la mensajería interna.</li>
      </ul>
      <p>
        Toda publicación y mensaje pasa por sistemas de moderación automática y revisión humana. El Operador puede
        rechazar, pausar o eliminar contenido y cuentas que incumplan estas reglas, sin previo aviso.
      </p>

      <h2>4. Planes</h2>
      <p>
        El plan gratuito permite mantener hasta 5 productos publicados con un máximo de 5 fotos por producto.
        Los planes de pago, cuando estén disponibles, se regirán por sus condiciones específicas.
      </p>

      <h2>5. Responsabilidad</h2>
      <p>
        Las operaciones se realizan directamente entre comprador y vendedor. El Operador no garantiza la calidad,
        disponibilidad o legalidad de los productos publicados, sin perjuicio de la moderación descrita. En la máxima
        medida permitida por la ley, el Operador no responde por daños derivados de operaciones entre usuarios.
      </p>

      <h2>6. Datos</h2>
      <p>
        El tratamiento de datos personales se describe en el{" "}
        <Link href="/legal/privacidad" className="text-brand underline">Aviso de privacidad</Link>.
      </p>

      <h2>7. Modificaciones</h2>
      <p>
        El Operador puede actualizar estos términos. Los cambios sustanciales se comunicarán en la plataforma. El uso
        continuado del Servicio implica la aceptación de los términos vigentes.
      </p>

      <h2>8. Ley aplicable</h2>
      <p>Estos términos se rigen por las leyes de los Estados Unidos Mexicanos, con jurisdicción en la Ciudad de México.</p>
    </div>
  );
}
