"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Company } from "@/lib/types";

type FormState = {
  email: string;
  newPassword: string;
  confirmPassword: string;
};

export default function AjustesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Company | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [form, setForm] = useState<FormState>({ email: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/ingresar?next=/panel/ajustes"); return; }
      setUserEmail(user.email ?? "");
      setForm((f) => ({ ...f, email: user.email ?? "" }));
      const { data } = await supabase
        .from("mkt_companies")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      setProfile(data);
      setLoading(false);
    })();
  }, [router]);

  async function handleSaveEmail() {
    if (form.email === userEmail) return;
    setSaving(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: form.email });
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "ok", text: "Te enviamos un email de confirmación al nuevo correo." });
    }
    setSaving(false);
  }

  async function handleChangePassword() {
    if (!form.newPassword || form.newPassword.length < 8) {
      setMessage({ type: "error", text: "La contraseña debe tener al menos 8 caracteres." });
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setMessage({ type: "error", text: "Las contraseñas no coinciden." });
      return;
    }
    setSaving(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: form.newPassword });
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "ok", text: "Contraseña actualizada correctamente." });
      setForm((f) => ({ ...f, newPassword: "", confirmPassword: "" }));
    }
    setSaving(false);
  }

  async function handleDeleteAccount() {
    setMessage({ type: "error", text: "Para eliminar tu cuenta, contacta con soporte desde el panel." });
    setShowDeleteConfirm(false);
  }

  if (loading) {
    return <div className="mx-auto max-w-3xl px-5 py-16 text-sm text-slate-400 sm:px-8">Cargando…</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8 lg:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-sky">Ajustes</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-brand-dark sm:text-4xl">
        Configuración de tu cuenta
      </h1>

      {message && (
        <div
          role="alert"
          className={`mt-6 rounded-xl px-4 py-3 text-sm ${
            message.type === "ok"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Plan */}
      <section className="mt-8 rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-brand-dark">Tu plan</h2>
        </div>
        <div className="px-5 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-brand-dark">
                {profile?.plan === "pro" ? "Plan Pro" : "Plan Gratuito"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {profile?.plan === "pro"
                  ? "Anuncios ilimitados y estadísticas detalladas."
                  : "Hasta 5 anuncios activos."}
              </p>
            </div>
            {profile?.plan !== "pro" && (
              <Link
                href="/panel"
                className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Subir a Pro
              </Link>
            )}
          </div>
          {profile?.plan === "pro" && (
            <p className="mt-3 text-xs text-slate-400">
              Para gestionar tu suscripción o facturación, contacta con soporte.
            </p>
          )}
        </div>
      </section>

      {/* Cuenta */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-brand-dark">Cuenta</h2>
        </div>
        <div className="space-y-5 px-5 py-5">
          <div>
            <label htmlFor="settings-email" className="block text-sm font-medium text-slate-700">
              Email de acceso
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                id="settings-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <button
                onClick={handleSaveEmail}
                disabled={saving || form.email === userEmail}
                className="rounded-lg bg-brand-dark px-4 py-2 text-sm font-semibold text-white hover:bg-brand disabled:opacity-40"
              >
                Cambiar
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <p className="text-sm font-medium text-slate-700">Cambiar contraseña</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="new-password" className="block text-xs text-slate-500">
                  Nueva contraseña
                </label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-xs text-slate-500">
                  Repetir contraseña
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>
            <button
              onClick={handleChangePassword}
              disabled={saving || !form.newPassword}
              className="mt-3 rounded-lg bg-brand-dark px-4 py-2 text-sm font-semibold text-white hover:bg-brand disabled:opacity-40"
            >
              Actualizar contraseña
            </button>
          </div>
        </div>
      </section>

      {/* Empresa */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-brand-dark">Empresa</h2>
        </div>
        <div className="space-y-3 px-5 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">{profile?.name ?? "Sin nombre"}</p>
              <p className="text-xs text-slate-400">
                Ref: {profile?.ref_code ?? "—"} · Miembro desde{" "}
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString("es-MX", { month: "long", year: "numeric" })
                  : "—"}
              </p>
            </div>
            <Link
              href="/panel/perfil"
              className="text-sm font-semibold text-brand hover:text-brand-dark"
            >
              Editar
            </Link>
          </div>
          {profile?.slug && (
            <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
              Perfil público: <span className="font-medium text-slate-700">todo-plastico.com/e/{profile.slug}</span>
            </div>
          )}
        </div>
      </section>

      {/* Zona peligrosa */}
      <section className="mt-6 rounded-xl border border-red-200 bg-white">
        <div className="border-b border-red-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-red-600">Zona peligrosa</h2>
        </div>
        <div className="px-5 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Eliminar cuenta</p>
              <p className="text-xs text-slate-500">Se eliminarán todos tus anuncios y datos.</p>
            </div>
            {showDeleteConfirm ? (
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                Eliminar
              </button>
            )}
          </div>
        </div>
      </section>

      <p className="mt-8 text-center text-xs text-slate-400">
        ¿Necesitas ayuda?{" "}
        <Link href="/panel#soporte" className="font-semibold text-brand hover:text-brand-dark">
          Contacta con soporte
        </Link>
      </p>
    </div>
  );
}
