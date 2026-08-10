"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type AuthMethod = "password" | "magic-link";

export default function RegistroPage() {
  const [form, setForm] = useState({ company: "", email: "", password: "" });
  const [method, setMethod] = useState<AuthMethod>("password");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const supabase = createClient();

      if (method === "magic-link") {
        const { error } = await supabase.auth.signInWithOtp({
          email: form.email,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/panel")}`,
            data: { company_name: form.company },
          },
        });
        setLoading(false);
        if (error) {
          setError("No se pudo enviar el enlace. Verifica el email e inténtalo de nuevo.");
          return;
        }
        setInfo("Te enviamos un enlace de acceso. Al abrirlo se creará tu panel de empresa.");
        return;
      }

      if (form.password.length < 8) {
        setError("La contraseña debe tener al menos 8 caracteres.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/panel")}`,
          data: { company_name: form.company },
        },
      });
      setLoading(false);
      if (error) {
        if (error.message.includes("already registered"))
          setError("Este email ya tiene una cuenta. Intenta ingresar.");
        else
          setError("No se pudo crear la cuenta. Inténtalo de nuevo.");
        return;
      }
      setInfo("Te enviamos un correo de confirmación. Ábrelo para activar tu cuenta.");
    } catch {
      setLoading(false);
      setError("Error de conexión. Inténtalo de nuevo.");
    }
  }

  if (info) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="text-5xl mb-4">📬</div>
        <h1 className="text-2xl font-bold text-slate-800">Revisa tu correo</h1>
        <p className="mt-3 text-slate-600">
          Enviamos {method === "magic-link" ? "un enlace de acceso" : "un correo de confirmación"} a <strong>{form.email}</strong>.
        </p>
        <p className="mt-3 text-sm text-slate-400">¿No lo ves? Revisa la carpeta de spam.</p>
        <button
          onClick={() => setInfo(null)}
          className="mt-8 text-sm text-brand font-medium hover:underline"
        >
          Volver a intentarlo
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-800">Crea tu perfil profesional</h1>
      <p className="mt-2 text-sm text-slate-500">
        Solo para empresas y proveedores del sector plástico. Publica gratis hasta 5 productos.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="reg-company" className="block text-sm font-medium text-slate-700 mb-1">
            Nombre de la empresa
          </label>
          <input
            id="reg-company"
            required
            minLength={3}
            placeholder="Plásticos del Norte S.A."
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
          />
        </div>
        <div>
          <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 mb-1">
            Email de empresa
          </label>
          <input
            id="reg-email"
            required
            type="email"
            placeholder="ventas@tuempresa.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
          />
        </div>
        {method === "password" && (
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700 mb-1">
              Contraseña
            </label>
            <input
              id="reg-password"
              required
              type="password"
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
            />
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-full bg-brand text-white py-3 font-medium hover:bg-brand-dark disabled:opacity-50"
        >
          {loading
            ? "Creando cuenta..."
            : method === "password"
              ? "Crear cuenta"
              : "Crear cuenta con enlace mágico"}
        </button>
      </form>
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => setMethod(method === "password" ? "magic-link" : "password")}
          className="text-sm text-slate-500 hover:text-brand"
        >
          {method === "password"
            ? "Prefiero registrarme sin contraseña (enlace mágico)"
            : "Prefiero registrarme con contraseña"}
        </button>
      </div>
      <p className="mt-6 text-sm text-slate-500">
        ¿Ya tienes cuenta? <Link href="/ingresar" className="text-brand font-medium">Ingresar</Link>
      </p>
    </div>
  );
}
