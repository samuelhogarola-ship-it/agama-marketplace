"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, slugify } from "@/lib/categories";
import { compressImage } from "@/lib/compress-image";

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState({ title: "", description: "", type: "product", category: CATEGORIES[0].slug, price: "", unit: "", location: "", external_url: "" });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace(`/ingresar?next=/panel/editar/${params.id}`); return; }
      const { data, error: fetchError } = await supabase.from("mkt_listings").select("*").eq("id", params.id).eq("company_id", user.id).single();
      if (fetchError || !data) { setError("No se encontró el anuncio."); setLoading(false); return; }
      setForm({ title: data.title ?? "", description: data.description ?? "", type: data.type ?? "product", category: data.category ?? CATEGORIES[0].slug, price: data.price_mxn == null ? "" : String(data.price_mxn), unit: data.unit ?? "", location: data.location ?? "", external_url: data.external_url ?? "" });
      setLoading(false);
    })();
  }, [params.id, router]);

  async function onFiles(event: React.ChangeEvent<HTMLInputElement>) {
    setFiles(await Promise.all(Array.from(event.target.files ?? []).slice(0, 5).map(compressImage)));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault(); setError(null); setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.from("mkt_listings").update({ title: form.title.trim(), slug: slugify(form.title), description: form.description.trim(), type: form.type, category: form.category, price_mxn: form.price ? Number(form.price) : null, unit: form.unit || null, location: form.location || null, external_url: form.external_url || null, status: "pending_review", rejection_reason: null, updated_at: new Date().toISOString() }).eq("id", params.id);
    if (updateError) { setError("No se pudo guardar el anuncio. " + updateError.message); setSaving(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (user && files.length > 0) {
      const { data: existing } = await supabase.from("mkt_listing_photos").select("position").eq("listing_id", params.id).order("position", { ascending: false }).limit(1);
      const start = Math.min(4, (existing?.[0]?.position ?? -1) + 1);
      for (let index = 0; index < files.length && start + index < 5; index++) {
        const file = files[index];
        const path = `${user.id}/${params.id}/${start + index + 1}.jpg`;
        const { error: uploadError } = await supabase.storage.from("mkt-photos").upload(path, file, { upsert: true });
        if (!uploadError) await supabase.from("mkt_listing_photos").insert({ listing_id: Number(params.id), storage_path: path, position: start + index });
      }
    }
    const moderation = await fetch("/api/moderate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listing_id: Number(params.id) }) });
    const result = await moderation.json().catch(() => ({}));
    if (!moderation.ok) { setError(result.error ?? "No se pudo enviar a moderación."); setSaving(false); return; }
    router.push("/panel"); router.refresh();
  }

  if (loading) return <div className="mx-auto max-w-2xl px-5 py-16 text-slate-400">Cargando anuncio…</div>;
  return <div className="mx-auto max-w-2xl px-5 py-12"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-sky">Mi panel</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-brand-dark">Editar anuncio</h1><p className="mt-3 text-sm text-slate-500">Al guardar, el anuncio volverá a pasar por moderación antes de publicarse.</p><form onSubmit={onSubmit} className="mt-8 space-y-5"><input required minLength={10} maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título del anuncio" className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-brand" /><div className="grid grid-cols-2 gap-4"><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-brand"><option value="product">Producto</option><option value="service">Servicio</option><option value="ad">Anuncio B2B</option></select><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-brand">{CATEGORIES.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></div><textarea required minLength={30} maxLength={3000} rows={7} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-brand" /><div className="grid grid-cols-3 gap-4"><input type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Precio MXN" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-brand" /><input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="Unidad" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-brand" /><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ubicación" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-brand" /></div><input type="url" value={form.external_url} onChange={(e) => setForm({ ...form, external_url: e.target.value })} placeholder="Enlace externo opcional" className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-brand" /><div><label className="block text-sm font-medium text-slate-700">Añadir fotos</label><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onFiles} className="mt-2 block text-sm" />{files.length > 0 && <p className="mt-1 text-xs text-slate-500">{files.length} foto(s) preparadas</p>}</div>{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={saving} className="rounded-full bg-brand-dark px-7 py-3 text-sm font-semibold text-white hover:bg-brand disabled:opacity-50">{saving ? "Guardando y moderando…" : "Guardar cambios"}</button></form></div>;
}
