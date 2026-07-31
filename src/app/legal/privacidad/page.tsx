import type { Metadata } from "next";

export const metadata: Metadata = { title: "Aviso de privacidad" };

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 [&_h2]:font-bold [&_h2]:text-slate-800 [&_h2]:mt-8 [&_h2]:text-lg [&_p]:mt-3 [&_p]:text-slate-600 [&_li]:text-slate-600">
      <h1 className="text-3xl font-bold text-slate-800">Aviso de privacidad</h1>
      <p className="text-sm text-slate-400 mt-2">
        Conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).
      </p>

      <h2>Responsable</h2>
      <p>
        AGAMA (el «Responsable») es responsable del tratamiento de los datos personales recabados a través de
        TodoPlástico.
      </p>

      <h2>Datos que recabamos</h2>
      <ul className="list-disc pl-6 mt-2 space-y-1">
        <li>Datos de cuenta y empresa: nombre de la empresa, email, contraseña cifrada, ubicación, web, teléfono y WhatsApp.</li>
        <li>Contenido publicado: fichas de empresa, anuncios, fotos y enlaces externos.</li>
        <li>Datos de uso: búsquedas realizadas y métricas de navegación agregadas.</li>
      </ul>

      <h2>Finalidades</h2>
      <ul className="list-disc pl-6 mt-2 space-y-1">
        <li>Prestar el servicio: cuentas, directorio, catálogo, contacto externo visible y moderación de contenido.</li>
        <li>Seguridad: prevención de fraude, spam y contenido no permitido.</li>
        <li>Mejora del servicio: estadísticas agregadas de oferta y demanda del sector.</li>
        <li>Comunicaciones operativas relacionadas con tu cuenta.</li>
      </ul>

      <h2>Moderación automatizada</h2>
      <p>
        Las publicaciones se analizan con sistemas automatizados (incluida inteligencia artificial) para
        verificar el cumplimiento de las normas de contenido. Las decisiones de rechazo pueden solicitarse a revisión
        humana desde tu panel.
      </p>

      <h2>Transferencias</h2>
      <p>
        No vendemos tus datos. Utilizamos proveedores de infraestructura (alojamiento, base de datos, envío de email)
        que tratan los datos por cuenta del Responsable con las salvaguardas correspondientes.
      </p>

      <h2>Derechos ARCO</h2>
      <p>
        Puedes ejercer tus derechos de Acceso, Rectificación, Cancelación y Oposición, así como revocar tu
        consentimiento, escribiendo al contacto oficial de AGAMA indicado en la web principal de AGAMA. Responderemos
        en los plazos previstos por la LFPDPPP.
      </p>

      <h2>Conservación</h2>
      <p>
        Conservamos los datos mientras la cuenta esté activa y, tras su cierre, durante los plazos necesarios para
        cumplir obligaciones legales.
      </p>

      <h2>Cambios</h2>
      <p>Cualquier cambio a este aviso se publicará en esta página.</p>
    </div>
  );
}
