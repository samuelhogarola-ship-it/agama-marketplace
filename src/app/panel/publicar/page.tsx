"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, slugify } from "@/lib/categories";
import { CATEGORY_SUBCATEGORIES } from "@/lib/categories";
import { compressImage } from "@/lib/compress-image";
import { SALE_UNITS } from "@/lib/listing-options";
import {
  CONTACT_METHODS,
  buildContactOverride,
  contactPlaceholder,
  isOwnAdvertiserUrl,
} from "@/lib/listing-policy";

const MAX_PHOTOS = 5;
const TITLE_MAX = 120;
const DESC_MAX = 3000;

export default function PublicarPage() {
  const router = useRouter();
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
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const subcategories = CATEGORY_SUBCATEGORIES[form.category] ?? [];

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS);
    const compressed = await Promise.all(list.map(compressImage));
    setFiles(compressed);
    setPreviews(compressed.map((f) => URL.createObjectURL(f)));
  }

  function removeFile(index: number) {
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

  async function uploadPhotos(
    supabase: ReturnType<typeof createClient>,
    userId: string,
    listingId: number
  ) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext =
        { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[
          file.type
        ] ?? "jpg";
      const path = `${userId}/${listingId}/${i + 1}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("mkt-photos")
        .upload(path, file, { upsert: true });
      if (upErr) {
        setError(`Error al subir foto ${i + 1}: ${upErr.message}`);
        continue;
      }
      await supabase
        .from("mkt_listing_photos")
        .insert({ listing_id: listingId, storage_path: path, position: i });
    }
  }

  async function buildListing(userId: string, status: "draft" | "pending_review") {
    const supabase = createClient();
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
      return null;
    }
    if (
      !form.unit ||
      !Number.isInteger(minPurchaseQty) ||
      minPurchaseQty < 1 ||
      form.location.trim().length < 2
    ) {
      setError("Completa cómo se vende, la compra mínima y la ubicación.");
      return null;
    }
    if (!contactOverride) {
      setError("Elige una forma de contacto y completa el dato de contacto.");
      return null;
    }

    const { data: company } = await supabase.rpc("mkt_my_company");
    if (
      form.external_url &&
      !isOwnAdvertiserUrl(form.external_url, company?.website)
    ) {
      setError(
        "El enlace debe pertenecer a la web propia de tu empresa. Configúrala en tu ficha antes de añadir enlaces."
      );
      return null;
    }

    const { data: listing, error: insErr } = await supabase
      .from("mkt_listings")
      .insert({
        company_id: userId,
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
        status,
      })
      .select()
      .single();

    if (insErr || !listing) {
      setError(
        insErr?.message.includes("mkt_listing_limit")
          ? "Has alcanzado el límite de 5 anuncios del plan gratuito."
          : `No se pudo crear el anuncio. ${insErr?.message ?? ""}`
      );
      return null;
    }

    return { supabase, listing, userId };
  }

  async function saveDraft(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSavingDraft(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSavingDraft(false);
      setShowAuthModal(true);
      return;
    }
    const result = await buildListing(user.id, "draft");
    if (!result) {
      setSavingDraft(false);
      return;
    }
    await uploadPhotos(result.supabase, result.userId, result.listing.id);
    router.push("/panel");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setShowAuthModal(true);
      return;
    }

    const result = await buildListing(user.id, "draft");
    if (!result) {
      setLoading(false);
      return;
    }

    await uploadPhotos(result.supabase, result.userId, result.listing.id);

    const modRes = await fetch("/api/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing_id: result.listing.id }),
    });
    const modData = await modRes.json().catch(() => ({}));

    if (!modRes.ok) {
      setError(
        `No se pudo enviar a revisión: ${modData.error ?? modRes.status}`
      );
      setLoading(false);
      return;
    }

    if (modData.verdict === "reject") {
      setError(
        `Publicación rechazada: ${modData.reason ?? "Contenido no permitido."} Corrige el anuncio y vuelve a enviar.`
      );
      setLoading(false);
      return;
    }

    router.push("/panel");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-sky">
        Mi panel
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-brand-dark">
        Publicar producto
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Productos y servicios de la industria plástica. No se permiten
        pigmentos, masterbatch ni aditivos.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        {/* Título */}
        <div>
          <div className="flex items-baseline justify-between">
            <label className="block text-sm font-medium text-slate-700">
              Título <span className="text-red-400">*</span>
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
            placeholder="Ej. Tarima de plástico 1200×1000 mm, carga 1500 kg"
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
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
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:outline-none focus:border-brand"
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
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:outline-none focus:border-brand"
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
              Descripción <span className="text-red-400">*</span>
            </label>
            <span className={`text-xs ${form.description.length > DESC_MAX - 200 ? "text-amber-600" : "text-slate-400"}`}>
              {form.description.length}/{DESC_MAX}
            </span>
          </div>
          <textarea
            required
            minLength={30}
            maxLength={DESC_MAX}
            rows={6}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Materiales, medidas, capacidad, cantidades mínimas, condiciones, aplicaciones… Los datos de contacto van en tu perfil."
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
          />
        </div>

        {/* Precio, unidad, compra mínima, ubicación */}
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
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Precio MXN {!form.priceOnRequest && <span className="text-red-400">*</span>}
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                disabled={form.priceOnRequest}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Cómo se vende <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:outline-none focus:border-brand"
              >
                {SALE_UNITS.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Compra mínima <span className="text-red-400">*</span>
              </label>
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
                placeholder="1"
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Ubicación <span className="text-red-400">*</span>
              </label>
              <input
                required
                minLength={2}
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Iztapalapa, CDMX"
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
              />
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Forma de contacto <span className="text-red-400">*</span>
          </label>
          <div className="mt-1 grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
            <select
              required
              value={form.contact_method}
              onChange={(e) =>
                setForm({ ...form, contact_method: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:outline-none focus:border-brand"
            >
              {CONTACT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
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
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        {/* Enlace externo */}
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
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
          />
          <p className="mt-1 text-xs text-slate-500">
            Solo enlaces de la web propia de tu empresa.
          </p>
        </div>

        {/* Fotos */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Fotos (hasta 5)
          </label>
          <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500 hover:border-brand hover:text-brand">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            {files.length === 0
              ? "Seleccionar fotos (JPG, PNG, WebP)"
              : `${files.length}/${MAX_PHOTOS} foto(s) seleccionada(s) — Cambiar`}
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
                    className="h-20 w-20 rounded-lg object-cover ring-1 ring-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    aria-label={`Eliminar foto ${i + 1}`}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    ×
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1 py-0.5 text-[9px] font-semibold text-white">
                      Principal
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || savingDraft}
            className="rounded-full bg-brand px-8 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? "Publicando…" : "Enviar a revisión"}
          </button>
          <button
            type="button"
            disabled={loading || savingDraft}
            onClick={saveDraft}
            className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-600 hover:border-brand hover:text-brand-dark disabled:opacity-50"
          >
            {savingDraft ? "Guardando…" : "Guardar borrador"}
          </button>
        </div>
      </form>

      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
            <h2 className="text-xl font-semibold text-brand-dark">
              Crea tu cuenta gratis
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Para publicar tu producto necesitas registrar tu empresa. Es gratis y tarda menos de un minuto.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <a
                href="/registro"
                className="block rounded-full bg-brand px-6 py-3 text-center text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Crear cuenta — es gratis
              </a>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Seguir explorando
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
