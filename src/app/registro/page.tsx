"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/categories";

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ company: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { company_name: form.company } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    if (data.session && data.user) {
      // Crear ficha de empresa (el slug único se resuelve en BD si colisiona)
      await supabase.from("mkt_companies").insert({
        id: data.user.id,
        name: form.company,
        slug: `${slugify(form.company)}-${data.user.id.slice(0, 6)}`,
      });
      router.push("/panel");
      router.refresh();
    } else {
      setInfo("Revisa tu correo para confirmar la cuenta y después inicia sesión.");
      setLoading(false);
    }
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
        <input
          required
          type="password"
          minLength={8}
          placeholder="Contraseña (mín. 8 caracteres)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-brand-dark bg-brand-light rounded-lg p-3">{info}</p>}
        <button
          disabled={loading}
          className="w-full rounded-full bg-brand text-white py-3 font-medium hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-500">
        ¿Ya tienes cuenta? <Link href="/ingresar" className="text-brand font-medium">Ingresar</Link>
      </p>
    </div>
  );
}
