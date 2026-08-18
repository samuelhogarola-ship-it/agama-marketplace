import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Normas de la comunidad",
  description: "Normas de publicación y convivencia en TodoPlástico. Contenido permitido y prohibido en la plataforma.",
  alternates: { canonical: "/legal/comunidad" },
};

export default function ComunidadPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-800 [&_p]:mt-3 [&_p]:text-slate-600 [&_li]:text-slate-600">
      <h1 className="text-3xl font-bold text-slate-800">Normas de la comunidad</h1>
      <p className="mt-2 text-sm text-slate-400">Última actualización: agosto de 2026</p>
      <p>
        TodoPlástico es un directorio B2B especializado en la industria del plástico. Al usar el servicio, aceptas
        estas normas junto con los{" "}
        <a href="/legal/terminos" className="text-brand underline">
          Términos de uso
        </a>
        .
      </p>

      <h2>1. Solo industria del plástico</h2>
      <p>
        TodoPlástico está reservado exclusivamente para empresas y profesionales del sector plástico. Solo se
        permiten anuncios de productos, servicios y capacidades directamente relacionados con la cadena de valor del
        plástico: transformación, reciclado, moldes, maquinaria, envases, perfiles, tuberías, empaques y materias
        primas plásticas.
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-6">
        <li>Si tu empresa no es del sector plástico, esta plataforma no es para ti.</li>
        <li>Los anuncios de sectores ajenos (alimentación, textil, construcción genérica, etc.) serán rechazados.</li>
        <li>La empresa debe estar registrada legalmente en México y operar dentro del sector.</li>
      </ul>

      <h2>2. Un anuncio por producto o servicio</h2>
      <p>
        Cada oferta debe publicarse una sola vez. No está permitido duplicar anuncios para aparecer más veces en el
        directorio o en las búsquedas.
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-6">
        <li>No publiques el mismo producto o servicio con distintos títulos, categorías o ligeras variaciones.</li>
        <li>Si quieres actualizar un anuncio existente, edítalo en tu panel en lugar de publicar uno nuevo.</li>
        <li>Los anuncios duplicados serán retirados y las cuentas reincidentes podrán ser bloqueadas.</li>
      </ul>

      <h2>3. Publica información veraz</h2>
      <ul className="mt-2 list-disc space-y-1 pl-6">
        <li>Describe con precisión el producto, servicio o capacidad que ofreces.</li>
        <li>Usa fotografías propias y relacionadas con el anuncio.</li>
        <li>Mantén actualizados la disponibilidad, ubicación y datos de tu empresa.</li>
        <li>No uses títulos diseñados para atraer búsquedas irrelevantes o keywords de relleno.</li>
      </ul>

      <h2>4. Conducta profesional</h2>
      <ul className="mt-2 list-disc space-y-1 pl-6">
        <li>Comunícate con respeto y sin amenazas, acoso, discriminación o lenguaje de odio.</li>
        <li>No uses TodoPlástico para spam, fraude, suplantación o captación masiva.</li>
        <li>Respeta la propiedad intelectual y no publiques falsificaciones.</li>
        <li>Si una oferta deja de estar disponible, retira o pausa el anuncio desde tu panel.</li>
      </ul>

      <h2>5. Contenido no permitido</h2>
      <p>No aceptamos publicaciones que incluyan:</p>
      <ul className="mt-2 list-disc space-y-1 pl-6">
        <li>
          <strong>Pigmentos, masterbatch, concentrados de color, aditivos, colorantes o estabilizantes</strong>{" "}
          (estos productos tienen su canal propio a través de AGAMA).
        </li>
        <li>Anuncios duplicados o variantes del mismo producto publicadas como anuncios independientes.</li>
        <li>Datos de contacto escritos dentro del título, descripción o fotografías.</li>
        <li>Armas, materiales peligrosos, mercancía ilegal o productos falsificados.</li>
        <li>Contenido adulto, ofensivo o ajeno a la industria plástica.</li>
        <li>Spam, contenido creado para manipular búsquedas o captación masiva.</li>
      </ul>

      <h2>6. Contacto externo responsable</h2>
      <p>
        Los datos de contacto van exclusivamente en los campos habilitados para ello (teléfono, email, web,
        WhatsApp). Los enlaces de un anuncio deben dirigir a la web propia de la empresa anunciante. No se permiten
        acortadores, marketplaces externos, landings de terceros ni URLs que oculten el destino real.
      </p>

      <h2>7. Moderación y medidas</h2>
      <p>
        Revisamos los anuncios mediante reglas automáticas y revisión humana. Podemos rechazar, pausar, retirar
        anuncios o bloquear cuentas que incumplan estas normas. En usuarios con plan Pro se emitirá un primer aviso
        cuando la infracción sea corregible; una segunda infracción relevante supondrá el bloqueo sin devolución.
      </p>
      <p>
        Si crees que una decisión fue incorrecta, puedes abrir un ticket de soporte desde tu panel. Las normas
        pueden actualizarse para responder a nuevas situaciones.
      </p>
    </div>
  );
}
