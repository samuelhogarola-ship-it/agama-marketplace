"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthMethod = "password" | "magic-link";

function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [method, setMethod] = useState<AuthMethod>("password");
  const [error, setError] = useState<string | null>(
    params.get("error") === "enlace-invalido"
      ? "El enlace expiró o ya fue usado. Solicita uno nuevo."
      : null
  );
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  const next = params.get("next") ?? "/panel";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      if (method === "magic-link") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        setLoading(false);
        if (error) {
          setError("No se pudo enviar el enlace. Verifica el email e inténtalo de nuevo.");
          return;
        }
        setSent(true);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        if (error.message.includes("Invalid login"))
          setError("Email o contraseña incorrectos.");
        else if (error.message.includes("Email not confirmed"))
          setError("Tu email no ha sido confirmado. Revisa tu correo.");
        else
          setError("No se pudo iniciar sesión. Inténtalo de nuevo.");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setLoading(false);
      setError("Error de conexión. Inténtalo de nuevo.");
    }
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
        {method === "password" && (
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <label htmlFor="login-password" className="text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <Link href="/ingresar/recuperar" className="text-xs text-brand hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <input
              id="login-password"
              required
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            ? method === "password" ? "Ingresando..." : "Enviando..."
            : method === "password" ? "Ingresar" : "Enviarme enlace de acceso"}
        </button>
      </form>
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => setMethod(method === "password" ? "magic-link" : "password")}
          className="text-sm text-slate-500 hover:text-brand"
        >
          {method === "password"
            ? "Prefiero ingresar sin contraseña (enlace mágico)"
            : "Prefiero ingresar con contraseña"}
        </button>
      </div>
    </>
  );
}

export default function IngresarPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-800">Ingresar</h1>
      <p className="mt-2 text-sm text-slate-500">
        Accede con tu contraseña o solicita un enlace mágico.
      </p>
      <Suspense>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-sm text-slate-500">
        ¿Aún no tienes cuenta? <Link href="/registro" className="text-brand font-medium">Crea tu perfil profesional</Link>
      </p>
    </div>
  );
}
