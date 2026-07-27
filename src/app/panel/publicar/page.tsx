"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, slugify } from "@/lib/categories";

const MAX_PHOTOS = 5;

export default function PublicarPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", description: "", category: CATEGORIES[0].slug, price: "", unit: "", zone: "" });
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS);
    setFiles(list);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/ingresar"); return; }

    // 1. Crear producto (queda pending tras enviar a moderación)
    const { data: product, error: insErr } = await supabase
      .from("mkt_products")
      .insert({
        owner_id: user.id,
        title: form.title.trim(),
        slug: slugify(form.title),
        description: form.description.trim(),
        category: form.category,
        price_mxn: form.price ? Number(form.price) : null,
        unit: form.unit || null,
        zone: form.zone || null,
        status: "draft",
      })
      .select()
      .single();

    if (insErr || !product) {
      setError(insErr?.message.includes("mkt_product_limit")
        ? "Has alcanzado el límite de 5 productos del plan gratuito."
        : `No se pudo crear el producto. ${insErr?.message ?? ""}`);
      setLoading(false);
      return;
    }

    // 2. Subir fotos (máx. 5, también validado en BD)
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type] ?? "jpg";
      const path = `${user.id}/${product.id}/${i + 1}.${ext}`;
      const { error: upErr } = await supabase.storage.from("mkt-photos").upload(path, file, { upsert: true });
      if (!upErr) {
        await supabase.from("mkt_product_photos").insert({ product_id: product.id, path, position: i });
      }
    }

    // 3. Enviar a moderación IA (API route Next.js: regex + Claude Haiku texto + visión)
    const modRes = await fetch("/api/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: product.id }),
    });
    const modData = await modRes.json().catch(() => ({}));

    if (!modRes.ok) {
      setError(`No se pudo enviar a revisión: ${modData.error ?? modRes.status}`);
      setLoading(false);
      return;
    }

    if (modData.verdict === "reject") {
      setError(`Publicación rechazada: ${modData.reason ?? "Contenido no permitido."} Corrige el producto y vuelve a enviar.`);
      setLoading(false);
      return;
    }

    // "approve" o "review" → redirigir al panel (el estado se muestra ahí)
    router.push("/panel");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-800">Publicar producto</h1>
      <p className="mt-2 text-sm text-slate-500">
        Solo productos de plástico. No se permiten pigmentos, masterbatch ni aditivos. Toda publicación pasa por moderación.
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
            placeholder="Material, medidas, capacidad, cantidades mínimas, condiciones… Sin teléfonos ni emails: el contacto es por mensajería interna."
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
            <label className="block text-sm font-medium text-slate-700">Zona</label>
            <input
              value={form.zone}
              onChange={(e) => setForm({ ...form, zone: e.target.value })}
              placeholder="Iztapalapa, CDMX"
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
            />
          </div>
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
