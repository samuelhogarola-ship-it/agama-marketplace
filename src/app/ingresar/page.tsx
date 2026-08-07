"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(
    params.get("error") === "enlace-invalido"
      ? "El enlace expiró o ya fue usado. Solicita uno nuevo."
      : null
  );
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(params.get("next") ?? "/panel")}`,
      },
    });
    setLoading(false);
    if (error) {
      setError("No se pudo enviar el enlace. Verifica el email e inténtalo de nuevo.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="mt-8 text-center">
        <div className="text-5xl mb-4">📬</div>
        <p className="text-slate-700 font-medium">Revisa tu correo</p>
        <p className="mt-2 text-sm text-slate-500">
          Enviamos un enlace a <strong>{email}</strong>. Ábrelo desde este mismo navegador.
        </p>
        <p className="mt-2 text-xs text-slate-400">¿No lo ves? Revisa la carpeta de spam.</p>
        <button onClick={() => setSent(false)} className="mt-6 text-sm text-brand font-medium hover:underline">
          Volver a intentarlo
        </button>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1">
            Email de empresa
          </label>
          <input
            id="login-email"
            required
            type="email"
            placeholder="ventas@tuempresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-full bg-brand text-white py-3 font-medium hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "Enviando..." : "Enviarme enlace de acceso"}
        </button>
      </form>
    </>
  );
}

export default function IngresarPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-800">Ingresar</h1>
      <p className="mt-2 text-sm text-slate-500">
        Acceso sin contraseña. La sesión queda recordada en este navegador.
      </p>
      <Suspense>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-sm text-slate-500">
        ¿Aún no tienes cuenta? <Link href="/registro" className="text-brand font-medium">Crea tu perfil profesional</Link>
      </p>
      {process.env.NODE_ENV !== "production" ? <Link href="/panel?preview=1" className="mt-8 block rounded-full border border-brand/30 px-4 py-3 text-center text-sm font-semibold text-brand-dark hover:bg-brand-light">Entrar como usuario demo</Link> : null}
    </div>
  );
}
