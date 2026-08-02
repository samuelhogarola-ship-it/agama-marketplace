"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
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
    setInfo("Te enviamos un enlace de acceso. Revisa tu correo y ábrelo desde este dispositivo.");
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input
          required
          type="email"
          placeholder="Email de empresa"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-brand-dark bg-brand-light rounded-lg p-3">{info}</p>}
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
