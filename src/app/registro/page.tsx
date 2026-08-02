"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegistroPage() {
  const [form, setForm] = useState({ company: "", email: "" });
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
      email: form.email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/panel")}`,
        data: { company_name: form.company },
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setInfo("Te enviamos un enlace de acceso. Al abrirlo se creará tu panel de empresa.");
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-800">Crea tu perfil profesional</h1>
      <p className="mt-2 text-sm text-slate-500">
        Solo para empresas y proveedores del sector plástico. Publica gratis hasta 5 anuncios.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <input
          required
          minLength={3}
          placeholder="Nombre de la empresa"
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
        />
        <input
          required
          type="email"
          placeholder="Email de la empresa"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-brand-dark bg-brand-light rounded-lg p-3">{info}</p>}
        <button
          disabled={loading}
          className="w-full rounded-full bg-brand text-white py-3 font-medium hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "Enviando..." : "Crear cuenta con enlace mágico"}
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-500">
        ¿Ya tienes cuenta? <Link href="/ingresar" className="text-brand font-medium">Ingresar</Link>
      </p>
      {process.env.NODE_ENV !== "production" ? <Link href="/panel?preview=1" className="mt-8 block rounded-full border border-brand/30 px-4 py-3 text-center text-sm font-semibold text-brand-dark hover:bg-brand-light">Entrar como usuario demo</Link> : null}
    </div>
  );
}
