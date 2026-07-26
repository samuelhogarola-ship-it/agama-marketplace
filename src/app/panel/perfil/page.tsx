"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PerfilPage() {
  const router = useRouter();
  const [form, setForm] = useState({ company_name: "", description: "", zone: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("mkt_profiles").select("*").eq("id", user.id).single();
      if (data) {
        setForm({
          company_name: data.company_name ?? "",
          description: data.description ?? "",
          zone: data.zone ?? "",
          phone: data.phone ?? "",
        });
      }
      setLoading(false);
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("mkt_profiles").update(form).eq("id", user.id);
    setSaved(true);
    setTimeout(() => router.push("/panel"), 800);
  }

  if (loading) return <div className="mx-auto max-w-2xl px-4 py-16 text-slate-400">Cargando…</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-800">Ficha de empresa</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700">Nombre de la empresa</label>
          <input
            required
            value={form.company_name}
            onChange={(e) => setForm({ ...form, company_name: e.target.value })}
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
            <label className="block text-sm font-medium text-slate-700">Zona (alcaldía/municipio)</label>
            <input
              value={form.zone}
              onChange={(e) => setForm({ ...form, zone: e.target.value })}
              placeholder="Iztapalapa, CDMX"
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Teléfono (privado)</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="No se muestra públicamente"
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
            />
          </div>
        </div>
        <button className="rounded-full bg-brand text-white px-8 py-3 font-medium hover:bg-brand-dark">
          {saved ? "Guardado ✓" : "Guardar"}
        </button>
      </form>
    </div>
  );
}
