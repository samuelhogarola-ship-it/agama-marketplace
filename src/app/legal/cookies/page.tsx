import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de cookies", description: "Política de cookies de TodoPlástico. Solo usamos cookies esenciales para la sesión de usuario.", alternates: { canonical: "/legal/cookies" } };

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 [&_h2]:font-bold [&_h2]:text-slate-800 [&_h2]:mt-8 [&_h2]:text-lg [&_p]:mt-3 [&_p]:text-slate-600 [&_li]:text-slate-600">
      <h1 className="text-3xl font-bold text-slate-800">Política de cookies</h1>

      <h2>Qué cookies usamos</h2>
      <p>TodoPlástico utiliza únicamente cookies esenciales:</p>
      <ul className="list-disc pl-6 mt-2 space-y-1">
        <li>
          <strong>Cookies de sesión</strong> (proveedor de autenticación): mantienen tu sesión iniciada de forma
          segura. Sin ellas no es posible usar el panel.
        </li>
        <li>
          <strong>Preferencia de consentimiento</strong>: recordamos tu elección sobre esta política (almacenamiento
          local del navegador).
        </li>
      </ul>

      <h2>Lo que NO usamos</h2>
      <p>
        No utilizamos cookies publicitarias ni de seguimiento de terceros. Si en el futuro incorporamos analítica,
        esta política se actualizará y se solicitará el consentimiento correspondiente.
      </p>

      <h2>Cómo gestionarlas</h2>
      <p>
        Puedes borrar o bloquear las cookies desde la configuración de tu navegador. Ten en cuenta que bloquear las
        cookies esenciales impedirá iniciar sesión.
      </p>
    </div>
  );
}
