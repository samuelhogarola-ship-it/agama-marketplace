"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, slugify } from "@/lib/categories";
import { SALE_UNITS } from "@/lib/listing-options";
import { CONTACT_METHODS, buildContactOverride, contactPlaceholder, isOwnAdvertiserUrl } from "@/lib/listing-policy";
import { compressImage } from "@/lib/compress-image";
import { DEMO_LISTINGS } from "@/lib/demo-data";

function EditListingContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const previewMode = searchParams.get("preview") === "1";
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "product",
    category: CATEGORIES[0].slug,
    price: "",
    unit: "unidad",
    min_purchase_qty: "1",
    location: "",
    contact_method: "email",
    contact_value: "",
    external_url: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (previewMode) {
      const demo = DEMO_LISTINGS.find((item) => String(item.id) === String(params.id)) ?? DEMO_LISTINGS[0];
      setForm({
        title: demo.title,
        description: demo.description,
        type: demo.type,
        category: demo.category,
        price: demo.price_mxn == null ? "" : String(demo.price_mxn),
        unit: demo.unit ?? "unidad",
        min_purchase_qty: String(demo.min_purchase_qty ?? 1),
        location: demo.location ?? "",
        contact_method: demo.contact_override?.method ?? "email",
        contact_value: demo.contact_override?.value ?? "",
        external_url: demo.external_url ?? "",
      });
      setLoading(false);
      return;
    }
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace(`/ingresar?next=/panel/editar/${params.id}`);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("mkt_listings")
        .select("*")
        .eq("id", params.id)
        .eq("company_id", user.id)
        .single();

      if (fetchError || !data) {
        setError("No se encontró el anuncio.");
        setLoading(false);
        return;
      }

      setForm({
        title: data.title ?? "",
        description: data.description ?? "",
        type: data.type ?? "product",
        category: data.category ?? CATEGORIES[0].slug,
        price: data.price_mxn == null ? "" : String(data.price_mxn),
        unit: data.unit ?? "unidad",
        min_purchase_qty: String(data.min_purchase_qty ?? 1),
        location: data.location ?? "",
        contact_method: data.contact_override?.method ?? "email",
        contact_value: data.contact_override?.value ?? "",
        external_url: data.external_url ?? "",
      });
      setLoading(false);
    })();
  }, [params.id, previewMode, router]);

  async function onFiles(event: React.ChangeEvent<HTMLInputElement>) {
    setFiles(await Promise.all(Array.from(event.target.files ?? []).slice(0, 5).map(compressImage)));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    if (previewMode) {
      setSaving(false);
      router.push("/panel?preview=1");
      return;
    }

    const minPurchaseQty = Number(form.min_purchase_qty);
    const contactOverride = buildContactOverride(form.contact_method, form.contact_value);
    if (!form.price || Number(form.price) < 0 || !form.unit || !Number.isInteger(minPurchaseQty) || minPurchaseQty < 1 || form.location.trim().length < 2) {
      setError("Precio, cómo se vende, compra mínima y ubicación son obligatorios.");
      setSaving(false);
      return;
    }
    if (!contactOverride) {
      setError("Elige una forma de contacto y completa el dato de contacto.");
      setSaving(false);
      return;
    }

    const supabase = createClient();
    const { data: company } = await supabase.rpc("mkt_my_company");
    if (form.external_url && !isOwnAdvertiserUrl(form.external_url, company?.website)) {
      setError("El enlace debe pertenecer a la web propia de tu empresa. Configúrala en tu ficha antes de añadir enlaces.");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("mkt_listings")
      .update({
        title: form.title.trim(),
        slug: slugify(form.title),
        description: form.description.trim(),
        type: form.type,
        category: form.category,
        price_mxn: Number(form.price),
        unit: form.unit,
        min_purchase_qty: minPurchaseQty,
        location: form.location.trim(),
        contact_override: contactOverride,
        external_url: form.external_url || null,
        status: "pending_review",
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    if (updateError) {
      setError("No se pudo guardar el anuncio. " + updateError.message);
      setSaving(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user && files.length > 0) {
      const { data: existing } = await supabase
        .from("mkt_listing_photos")
        .select("position")
        .eq("listing_id", params.id)
        .order("position", { ascending: false })
        .limit(1);
      const start = Math.min(4, (existing?.[0]?.position ?? -1) + 1);
      for (let index = 0; index < files.length && start + index < 5; index++) {
        const file = files[index];
        const path = `${user.id}/${params.id}/${start + index + 1}.jpg`;
        const { error: uploadError } = await supabase.storage.from("mkt-photos").upload(path, file, { upsert: true });
        if (!uploadError) await supabase.from("mkt_listing_photos").insert({ listing_id: Number(params.id), storage_path: path, position: start + index });
      }
    }

    const moderation = await fetch("/api/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing_id: Number(params.id) }),
    });
    const result = await moderation.json().catch(() => ({}));
    if (!moderation.ok) {
      setError(result.error ?? "No se pudo enviar a moderación.");
      setSaving(false);
      return;
    }

    router.push("/panel");
    router.refresh();
  }

  if (loading) return <div className="mx-auto max-w-2xl px-5 py-16 text-slate-400">Cargando anuncio...</div>;

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      {previewMode ? <div className="mb-8 rounded-2xl border border-brand/20 bg-brand-light px-5 py-4 text-sm text-slate-700"><span className="font-semibold text-brand-dark">Vista previa local de AGAMA.</span> Puedes revisar el formulario de edición; el guardado real requiere una sesión autenticada.</div> : null}
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-sky">Mi panel</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-brand-dark">Editar anuncio</h1>
      <p className="mt-3 text-sm text-slate-500">Al guardar, el anuncio volverá a pasar por moderación antes de publicarse.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <input required minLength={10} maxLength={120} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Título del anuncio" className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-brand" />

        <div className="grid gap-4 sm:grid-cols-2">
          <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-brand">
            <option value="product">Producto</option>
            <option value="service">Servicio</option>
            <option value="ad">Anuncio B2B</option>
          </select>
          <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-brand">
            {CATEGORIES.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
          </select>
        </div>

        <textarea required minLength={30} maxLength={3000} rows={7} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-brand" />

        <div className="grid gap-4 sm:grid-cols-4">
          <input required type="number" min={0} step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="Precio MXN" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-brand" />
          <select required value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand">
            {SALE_UNITS.map((unit) => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
          </select>
          <input required type="number" min={1} step={1} inputMode="numeric" value={form.min_purchase_qty} onChange={(event) => setForm({ ...form, min_purchase_qty: event.target.value })} placeholder="Compra mínima" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-brand" />
          <input required minLength={2} value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Ubicación" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-brand" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Forma de contacto</label>
          <div className="mt-1 grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
            <select required value={form.contact_method} onChange={(event) => setForm({ ...form, contact_method: event.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-brand">
              {CONTACT_METHODS.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
            </select>
            <input required value={form.contact_value} onChange={(event) => setForm({ ...form, contact_value: event.target.value })} placeholder={contactPlaceholder(form.contact_method)} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-brand" />
          </div>
        </div>

        <input type="url" value={form.external_url} onChange={(event) => setForm({ ...form, external_url: event.target.value })} placeholder="Enlace externo opcional" className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-brand" />
        <p className="-mt-3 text-xs text-slate-500">Solo enlaces de la web propia de tu empresa. No se permiten acortadores ni webs de terceros.</p>

        <div>
          <label className="block text-sm font-medium text-slate-700">Añadir fotos</label>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onFiles} className="mt-2 block text-sm" />
          {files.length > 0 && <p className="mt-1 text-xs text-slate-500">{files.length} foto(s) preparadas</p>}
        </div>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={saving} className="rounded-full bg-brand-dark px-7 py-3 text-sm font-semibold text-white hover:bg-brand disabled:opacity-50">
          {saving ? "Guardando y moderando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}

export default function EditListingPage() {
  return <Suspense fallback={<div className="mx-auto max-w-2xl px-5 py-16 text-slate-400">Cargando anuncio…</div>}><EditListingContent /></Suspense>;
}
