"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, CATEGORY_SUBCATEGORIES, slugify } from "@/lib/categories";
import { SALE_UNITS } from "@/lib/listing-options";
import {
  CONTACT_METHODS,
  buildContactOverride,
  contactPlaceholder,
  isOwnAdvertiserUrl,
} from "@/lib/listing-policy";
import { compressImage } from "@/lib/compress-image";
import { photoUrl } from "@/lib/types";
import { DEMO_LISTINGS } from "@/lib/demo-data";

const TITLE_MAX = 120;
const DESC_MAX = 3000;

type ExistingPhoto = { id: number; storage_path: string; position: number };

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
    priceOnRequest: false,
    unit: "unidad",
    min_purchase_qty: "1",
    location: "",
    contact_method: "email",
    contact_value: "",
    external_url: "",
    tags: [] as string[],
  });
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletePhotoId, setDeletePhotoId] = useState<number | null>(null);

  const subcategories = CATEGORY_SUBCATEGORIES[form.category] ?? [];

  useEffect(() => {
    if (previewMode) {
      const demo =
        DEMO_LISTINGS.find((item) => String(item.id) === String(params.id)) ??
        DEMO_LISTINGS[0];
      setForm({
        title: demo.title,
        description: demo.description,
        type: demo.type,
        category: demo.category,
        price: demo.price_mxn == null ? "" : String(demo.price_mxn),
        priceOnRequest: demo.price_mxn == null,
        unit: demo.unit ?? "unidad",
        min_purchase_qty: String(demo.min_purchase_qty ?? 1),
        location: demo.location ?? "",
        contact_method: demo.contact_override?.method ?? "email",
        contact_value: demo.contact_override?.value ?? "",
        external_url: demo.external_url ?? "",
        tags: demo.tags ?? [],
      });
      setExistingPhotos((demo.photos ?? []) as ExistingPhoto[]);
      setLoading(false);
      return;
    }
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace(`/ingresar?next=/panel/editar/${params.id}`);
        return;
      }

      const [{ data, error: fetchError }, { data: photoData }] =
        await Promise.all([
          supabase
            .from("mkt_listings")
            .select("*")
            .eq("id", params.id)
            .eq("company_id", user.id)
            .single(),
          supabase
            .from("mkt_listing_photos")
            .select("id, storage_path, position")
            .eq("listing_id", params.id)
            .order("position"),
        ]);

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
        priceOnRequest: data.price_mxn == null,
        unit: data.unit ?? "unidad",
        min_purchase_qty: String(data.min_purchase_qty ?? 1),
        location: data.location ?? "",
        contact_method: data.contact_override?.method ?? "email",
        contact_value: data.contact_override?.value ?? "",
        external_url: data.external_url ?? "",
        tags: data.tags ?? [],
      });
      setExistingPhotos((photoData ?? []) as ExistingPhoto[]);
      setLoading(false);
    })();
  }, [params.id, previewMode, router]);

  async function deleteExistingPhoto(photo: ExistingPhoto) {
    if (previewMode) return;
    setDeletePhotoId(photo.id);
    const supabase = createClient();
    await supabase.storage
      .from("mkt-photos")
      .remove([photo.storage_path]);
    await supabase
      .from("mkt_listing_photos")
      .delete()
      .eq("id", photo.id);
    setExistingPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    setDeletePhotoId(null);
  }

  async function onFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(event.target.files ?? []).slice(0, 5 - existingPhotos.length);
    const compressed = await Promise.all(list.map(compressImage));
    setFiles(compressed);
    setPreviews(compressed.map((f) => URL.createObjectURL(f)));
  }

  function removeNewFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }

  function toggleTag(value: string) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(value)
        ? f.tags.filter((t) => t !== value)
        : [...f.tags, value],
    }));
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
    const contactOverride = buildContactOverride(
      form.contact_method,
      form.contact_value
    );

    if (
      !form.priceOnRequest &&
      (form.price === "" || Number(form.price) < 0)
    ) {
      setError("Indica el precio o marca «Precio a consultar».");
      setSaving(false);
      return;
    }
    if (
      !form.unit ||
      !Number.isInteger(minPurchaseQty) ||
      minPurchaseQty < 1 ||
      form.location.trim().length < 2
    ) {
      setError("Completa cómo se vende, la compra mínima y la ubicación.");
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
    if (
      form.external_url &&
      !isOwnAdvertiserUrl(form.external_url, company?.website)
    ) {
      setError(
        "El enlace debe pertenecer a la web propia de tu empresa. Configúrala en tu ficha antes de añadir enlaces."
      );
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
        tags: form.tags.length > 0 ? form.tags : null,
        price_mxn: form.priceOnRequest ? null : Number(form.price),
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

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user && files.length > 0) {
      const start = existingPhotos.length;
      for (let index = 0; index < files.length && start + index < 5; index++) {
        const file = files[index];
        const ext =
          { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[
            file.type
          ] ?? "jpg";
        const path = `${user.id}/${params.id}/${start + index + 1}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("mkt-photos")
          .upload(path, file, { upsert: true });
        if (!uploadError)
          await supabase.from("mkt_listing_photos").insert({
            listing_id: Number(params.id),
            storage_path: path,
            position: start + index,
          });
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

  const totalPhotos = existingPhotos.length + files.length;

  if (loading)
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-slate-400">
        Cargando anuncio...
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      {previewMode ? (
        <div className="mb-8 rounded-2xl border border-brand/20 bg-brand-light px-5 py-4 text-sm text-slate-700">
          <span className="font-semibold text-brand-dark">
            Vista previa local de AGAMA.
          </span>{" "}
          Puedes revisar el formulario de edición; el guardado real requiere una
          sesión autenticada.
        </div>
      ) : null}
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-sky">
        Mi panel
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-brand-dark">
        Editar anuncio
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Al guardar, el anuncio volverá a pasar por moderación antes de
        publicarse.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        {/* Título */}
        <div>
          <div className="flex items-baseline justify-between">
            <label className="block text-sm font-medium text-slate-700">
              Título
            </label>
            <span className={`text-xs ${form.title.length > TITLE_MAX - 20 ? "text-amber-600" : "text-slate-400"}`}>
              {form.title.length}/{TITLE_MAX}
            </span>
          </div>
          <input
            required
            minLength={10}
            maxLength={TITLE_MAX}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Título del anuncio"
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-brand"
          />
        </div>

        {/* Tipo y Categoría */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Tipo
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="mt-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-brand w-full"
            >
              <option value="product">Producto</option>
              <option value="service">Servicio</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Categoría
            </label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value, tags: [] })
              }
              className="mt-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-brand w-full"
            >
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subcategorías / Tags */}
        {subcategories.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Subcategorías (opcional)
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {subcategories.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleTag(value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    form.tags.includes(value)
                      ? "border-brand bg-brand-light text-brand-dark"
                      : "border-slate-200 text-slate-600 hover:border-brand hover:text-brand-dark"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Descripción */}
        <div>
          <div className="flex items-baseline justify-between">
            <label className="block text-sm font-medium text-slate-700">
              Descripción
            </label>
            <span className={`text-xs ${form.description.length > DESC_MAX - 200 ? "text-amber-600" : "text-slate-400"}`}>
              {form.description.length}/{DESC_MAX}
            </span>
          </div>
          <textarea
            required
            minLength={30}
            maxLength={DESC_MAX}
            rows={7}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-brand"
          />
        </div>

        {/* Precio */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.priceOnRequest}
              onChange={(e) =>
                setForm({
                  ...form,
                  priceOnRequest: e.target.checked,
                  price: e.target.checked ? "" : form.price,
                })
              }
              className="h-4 w-4 rounded border-slate-300 accent-brand"
            />
            <span className="font-medium text-slate-700">Precio a consultar</span>
          </label>
          <div className="grid gap-4 sm:grid-cols-4">
            <input
              type="number"
              min={0}
              step="0.01"
              disabled={form.priceOnRequest}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="Precio MXN"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-brand disabled:bg-slate-50 disabled:text-slate-400"
            />
            <select
              required
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand"
            >
              {SALE_UNITS.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
            <input
              required
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={form.min_purchase_qty}
              onChange={(e) =>
                setForm({ ...form, min_purchase_qty: e.target.value })
              }
              placeholder="Compra mínima"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-brand"
            />
            <input
              required
              minLength={2}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Ubicación"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-brand"
            />
          </div>
        </div>

        {/* Contacto */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Forma de contacto
          </label>
          <div className="mt-1 grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
            <select
              required
              value={form.contact_method}
              onChange={(e) =>
                setForm({ ...form, contact_method: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-brand"
            >
              {CONTACT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <input
              required
              value={form.contact_value}
              onChange={(e) =>
                setForm({ ...form, contact_value: e.target.value })
              }
              placeholder={contactPlaceholder(form.contact_method)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-brand"
            />
          </div>
        </div>

        {/* Enlace */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Enlace externo (opcional)
          </label>
          <input
            type="url"
            value={form.external_url}
            onChange={(e) =>
              setForm({ ...form, external_url: e.target.value })
            }
            placeholder="https://tuempresa.com/producto"
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-brand"
          />
          <p className="mt-1 text-xs text-slate-500">
            Solo enlaces de la web propia de tu empresa.
          </p>
        </div>

        {/* Fotos existentes */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Fotos ({totalPhotos}/5)
          </label>

          {existingPhotos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {existingPhotos.map((photo, i) => (
                <div key={photo.id} className="group relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl(photo.storage_path)}
                    alt={`Foto ${i + 1}`}
                    className="h-20 w-20 rounded-lg object-cover ring-1 ring-slate-200"
                  />
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1 py-0.5 text-[9px] font-semibold text-white">
                      Principal
                    </span>
                  )}
                  {!previewMode && (
                    <button
                      type="button"
                      disabled={deletePhotoId === photo.id}
                      onClick={() => deleteExistingPhoto(photo)}
                      aria-label="Eliminar foto"
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {totalPhotos < 5 && (
            <>
              <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500 hover:border-brand hover:text-brand">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                {files.length === 0
                  ? `Añadir fotos (${5 - existingPhotos.length} disponibles)`
                  : `${files.length} foto(s) nuevas — Cambiar`}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={onFiles}
                  className="sr-only"
                />
              </label>

              {previews.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {previews.map((src, i) => (
                    <div key={i} className="group relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`Vista previa ${i + 1}`}
                        className="h-20 w-20 rounded-lg object-cover ring-1 ring-blue-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewFile(i)}
                        aria-label={`Eliminar foto nueva ${i + 1}`}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        ×
                      </button>
                      <span className="absolute bottom-1 left-1 rounded bg-blue-600/70 px-1 py-0.5 text-[9px] font-semibold text-white">
                        Nueva
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          disabled={saving}
          className="rounded-full bg-brand-dark px-7 py-3 text-sm font-semibold text-white hover:bg-brand disabled:opacity-50"
        >
          {saving ? "Guardando y moderando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}

export default function EditListingPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-5 py-16 text-slate-400">
          Cargando anuncio…
        </div>
      }
    >
      <EditListingContent />
    </Suspense>
  );
}
