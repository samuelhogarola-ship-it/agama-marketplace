import type { Metadata } from "next";

export const metadata: Metadata = { title: "Normas de la comunidad" };

export default function ComunidadPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-800 [&_p]:mt-3 [&_p]:text-slate-600 [&_li]:text-slate-600">
      <h1 className="text-3xl font-bold text-slate-800">Normas de la comunidad</h1>
      <p className="mt-2 text-sm text-slate-400">Última actualización: julio de 2026</p>
      <p>
        TodoPlástico existe para facilitar relaciones profesionales dentro de la industria plástica. Al usar el
        servicio, aceptas estas normas, además de los <a href="/legal/terminos" className="text-brand underline">Términos de uso</a>.
      </p>

      <h2>1. Publica información veraz</h2>
      <ul className="mt-2 list-disc space-y-1 pl-6">
        <li>Describe con precisión el producto, servicio o capacidad que ofreces.</li>
        <li>Usa fotografías propias y relacionadas con el anuncio.</li>
        <li>Mantén actualizados la disponibilidad, ubicación y datos de tu empresa.</li>
        <li>No publiques anuncios duplicados, engañosos o con títulos diseñados para atraer búsquedas irrelevantes.</li>
      </ul>

      <h2>2. Mantén una conducta profesional</h2>
      <ul className="mt-2 list-disc space-y-1 pl-6">
        <li>Comunícate con respeto y sin amenazas, acoso, discriminación o lenguaje de odio.</li>
        <li>No uses TodoPlástico para spam, fraude, suplantación o captación masiva.</li>
        <li>Respeta la propiedad intelectual y no publiques falsificaciones.</li>
        <li>Si una oferta deja de estar disponible, retira o actualiza el anuncio.</li>
      </ul>

      <h2>3. Contenido no permitido</h2>
      <p>No aceptamos publicaciones que incluyan:</p>
      <ul className="mt-2 list-disc space-y-1 pl-6">
        <li>Pigmentos, masterbatch, concentrados de color, aditivos o colorantes.</li>
        <li>Armas, materiales peligrosos, mercancía ilegal o productos falsificados.</li>
        <li>Contenido adulto, ofensivo o ajeno a la industria plástica.</li>
        <li>Datos de contacto escritos dentro del título, descripción o fotografías.</li>
      </ul>

      <h2>4. Contacto externo responsable</h2>
      <p>
        Los datos de contacto deben colocarse únicamente en los campos específicos de empresa o anuncio. No uses
        textos, imágenes o enlaces para enviar spam, malware, formularios engañosos o redirecciones peligrosas.
      </p>

      <h2>5. Moderación y medidas</h2>
      <p>
        Revisamos los anuncios mediante reglas automáticas, sistemas de moderación asistida y, cuando corresponde,
        revisión humana. Podemos rechazar, pausar, retirar anuncios o bloquear cuentas que incumplan estas normas,
        especialmente ante fraude, reincidencia o riesgo para otras empresas.
      </p>
      <p>
        Si consideras que una decisión fue incorrecta, puedes solicitar una revisión desde tu panel cuando la opción
        esté disponible. Las normas pueden actualizarse para responder a nuevos riesgos y necesidades de la comunidad.
      </p>
    </div>
  );
}
