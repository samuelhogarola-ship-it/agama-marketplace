"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const supabase = createClient();

    if (mode === "password") {
      const { error } = await supabase.auth.signInWithPassword(form);
      if (error) {
        setError("Email o contraseña incorrectos.");
        setLoading(false);
        return;
      }
      router.push(params.get("next") ?? "/panel");
      router.refresh();
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email: form.email,
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
  }

  return (
    <>
      <div className="mt-6 grid grid-cols-2 rounded-full border border-slate-200 p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setMode("password")}
          className={`rounded-full py-2 ${mode === "password" ? "bg-brand-dark text-white" : "text-slate-500 hover:text-slate-700"}`}
        >
          Contraseña
        </button>
        <button
          type="button"
          onClick={() => setMode("magic")}
          className={`rounded-full py-2 ${mode === "magic" ? "bg-brand-dark text-white" : "text-slate-500 hover:text-slate-700"}`}
        >
          Enlace mágico
        </button>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
        />
        {mode === "password" && (
          <input
            required
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
          />
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-brand-dark bg-brand-light rounded-lg p-3">{info}</p>}
        <button
          disabled={loading}
          className="w-full rounded-full bg-brand text-white py-3 font-medium hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "Un momento…" : mode === "password" ? "Ingresar" : "Enviarme enlace de acceso"}
        </button>
      </form>
    </>
  );
}

export default function IngresarPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-800">Ingresar</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-sm text-slate-500">
        ¿Aún no tienes cuenta? <Link href="/registro" className="text-brand font-medium">Crea tu perfil profesional</Link>
      </p>
    </div>
  );
}
