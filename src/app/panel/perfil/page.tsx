"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DEMO_COMPANY } from "@/lib/demo-data";

function PerfilContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const previewMode = searchParams.get("preview") === "1";
  const [form, setForm] = useState({ name: "", description: "", location: "", website: "", phone: "", email: "", whatsapp: "" });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (previewMode) {
      setForm({
        name: DEMO_COMPANY.name,
        description: DEMO_COMPANY.description ?? "",
        location: DEMO_COMPANY.location ?? "",
        website: DEMO_COMPANY.website ?? "",
        phone: DEMO_COMPANY.phone ?? "",
        email: DEMO_COMPANY.email ?? "",
        whatsapp: DEMO_COMPANY.whatsapp ?? "",
      });
      setLoading(false);
      return;
    }
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        router.replace("/ingresar?next=/panel/perfil");
        return;
      }
      const { data } = await supabase.rpc("mkt_my_company");
      if (data) {
        setForm({
          name: data.name ?? "",
          description: data.description ?? "",
          location: data.location ?? "",
          website: data.website ?? "",
          phone: data.phone ?? "",
          email: data.email ?? "",
          whatsapp: data.whatsapp ?? "",
        });
      }
      setLoading(false);
    })();
  }, [previewMode, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (previewMode) {
      setSaved(true);
      return;
    }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("mkt_companies").update(form).eq("id", user.id);
    setSaved(true);
    setTimeout(() => router.push("/panel"), 800);
  }

  if (loading) return <div className="mx-auto max-w-2xl px-4 py-16 text-slate-400">Cargando…</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {previewMode ? <div className="mb-8 rounded-2xl border border-brand/20 bg-brand-light px-5 py-4 text-sm text-slate-700"><span className="font-semibold text-brand-dark">Vista previa local de AGAMA.</span> Esta ficha muestra cómo verá la empresa el usuario final.</div> : null}
      <h1 className="text-2xl font-bold text-slate-800">Ficha de empresa</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700">Nombre de la empresa</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Descripción</label>
          <textarea
            rows={4}
            maxLength={1000}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="A qué se dedica tu empresa, desde cuándo, qué fabricas o distribuyes…"
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Ubicación</label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Iztapalapa, CDMX"
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Teléfono público</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+52 55 0000 0000"
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Web pública</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://tuempresa.com"
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Email público</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="ventas@tuempresa.com"
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">WhatsApp público</label>
            <input
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              placeholder="+52 55 0000 0000"
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
            />
          </div>
        </div>
        <button className="rounded-full bg-brand text-white px-8 py-3 font-medium hover:bg-brand-dark">
          {saved ? (previewMode ? "Cambios de demo guardados ✓" : "Guardado ✓") : "Guardar"}
        </button>
      </form>
    </div>
  );
}

export default function PerfilPage() {
  return <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-16 text-slate-400">Cargando ficha…</div>}><PerfilContent /></Suspense>;
}
