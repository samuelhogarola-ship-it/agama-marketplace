"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/panel/perfil")}`,
    });
    setLoading(false);
    if (error) {
      setError("No se pudo enviar el correo. Verifica el email e inténtalo de nuevo.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="text-5xl mb-4">📬</div>
        <h1 className="text-2xl font-bold text-slate-800">Revisa tu correo</h1>
        <p className="mt-3 text-slate-600">
          Si el email <strong>{email}</strong> tiene una cuenta, recibirás un enlace para restablecer tu contraseña.
        </p>
        <p className="mt-3 text-sm text-slate-400">¿No lo ves? Revisa la carpeta de spam.</p>
        <Link href="/ingresar" className="mt-8 inline-block text-sm text-brand font-medium hover:underline">
          Volver a ingresar
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-800">Recuperar contraseña</h1>
      <p className="mt-2 text-sm text-slate-500">
        Te enviaremos un enlace para restablecer tu contraseña.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="recover-email" className="block text-sm font-medium text-slate-700 mb-1">
            Email de empresa
          </label>
          <input
            id="recover-email"
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
          {loading ? "Enviando..." : "Enviar enlace de recuperación"}
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-500">
        <Link href="/ingresar" className="text-brand font-medium">Volver a ingresar</Link>
      </p>
    </div>
  );
}
