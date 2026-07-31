"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, slugify } from "@/lib/categories";
import { compressImage } from "@/lib/compress-image";

const MAX_PHOTOS = 5;

export default function PublicarPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "product",
    category: CATEGORIES[0].slug,
    price: "",
    unit: "",
    location: "",
    external_url: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS);
    setFiles(await Promise.all(list.map(compressImage)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/ingresar"); return; }

    // 1. Crear anuncio (queda pending tras enviar a moderación)
    const { data: listing, error: insErr } = await supabase
      .from("mkt_listings")
      .insert({
        company_id: user.id,
        title: form.title.trim(),
        slug: slugify(form.title),
        description: form.description.trim(),
        type: form.type,
        category: form.category,
        price_mxn: form.price ? Number(form.price) : null,
        unit: form.unit || null,
        location: form.location || null,
        external_url: form.external_url || null,
        status: "draft",
      })
      .select()
      .single();

    if (insErr || !listing) {
      setError(insErr?.message.includes("mkt_listing_limit")
        ? "Has alcanzado el límite de 5 anuncios del plan gratuito."
        : `No se pudo crear el anuncio. ${insErr?.message ?? ""}`);
      setLoading(false);
      return;
    }

    // 2. Subir fotos (máx. 5, también validado en BD)
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type] ?? "jpg";
      const path = `${user.id}/${listing.id}/${i + 1}.${ext}`;
      const { error: upErr } = await supabase.storage.from("mkt-photos").upload(path, file, { upsert: true });
      if (!upErr) {
        await supabase.from("mkt_listing_photos").insert({ listing_id: listing.id, storage_path: path, position: i });
      }
    }

    // 3. Enviar a moderación IA (API route Next.js: regex + Claude Haiku texto + visión)
    const modRes = await fetch("/api/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing_id: listing.id }),
    });
    const modData = await modRes.json().catch(() => ({}));

    if (!modRes.ok) {
      setError(`No se pudo enviar a revisión: ${modData.error ?? modRes.status}`);
      setLoading(false);
      return;
    }

    if (modData.verdict === "reject") {
      setError(`Publicación rechazada: ${modData.reason ?? "Contenido no permitido."} Corrige el anuncio y vuelve a enviar.`);
      setLoading(false);
      return;
    }

    // "approve" o "review" → redirigir al panel (el estado se muestra ahí)
    router.push("/panel");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-800">Publicar anuncio</h1>
      <p className="mt-2 text-sm text-slate-500">
        Productos, servicios y anuncios B2B de la industria plástica. No se permiten pigmentos, masterbatch ni aditivos.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700">Título</label>
          <input
            required
            minLength={10}
            maxLength={120}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Ej. Tarima de plástico 1200×1000 mm, carga 1500 kg"
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Tipo</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 bg-white focus:outline-none focus:border-brand"
          >
            <option value="product">Producto</option>
            <option value="service">Servicio</option>
            <option value="ad">Anuncio B2B</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Categoría</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 bg-white focus:outline-none focus:border-brand"
          >
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Descripción</label>
          <textarea
            required
            minLength={30}
            maxLength={3000}
            rows={6}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Materiales, medidas, capacidad, cantidades mínimas, condiciones, aplicaciones… Los datos de contacto van en tu perfil."
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Precio MXN</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="Vacío = a consultar"
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Unidad</label>
            <input
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="pieza, kg, millar…"
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Ubicación</label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Iztapalapa, CDMX"
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Enlace externo opcional</label>
          <input
            type="url"
            value={form.external_url}
            onChange={(e) => setForm({ ...form, external_url: e.target.value })}
            placeholder="https://tuempresa.com/producto"
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Fotos (hasta 5)</label>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onFiles} className="mt-1 block text-sm" />
          {files.length > 0 && <p className="text-xs text-slate-500 mt-1">{files.length} foto(s) seleccionada(s)</p>}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

        <button
          disabled={loading}
          className="rounded-full bg-brand text-white px-8 py-3 font-medium hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "Publicando…" : "Enviar a revisión"}
        </button>
      </form>
    </div>
  );
}
