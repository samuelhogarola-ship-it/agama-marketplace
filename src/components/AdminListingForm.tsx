"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import { SALE_UNITS } from "@/lib/listing-options";
import { CONTACT_METHODS, contactPlaceholder } from "@/lib/listing-policy";
import { AGAMA_SAMPLE_LISTING, LISTING_MODEL_FIELDS, LISTING_MODEL_RULES } from "@/lib/listing-model";

type CompanyOption = { id: string; name: string; location: string | null; website: string | null };

export default function AdminListingForm({ companies, previewMode }: { companies: CompanyOption[]; previewMode: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState({ company_id: companies[0]?.id ?? "", title: "", description: "", type: "product", category: CATEGORIES[0].slug, price_mxn: "", unit: "unidad", min_purchase_qty: "1", location: "", contact_method: "email", contact_value: "", external_url: "" });
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(name: string, value: string) { setForm((current) => ({ ...current, [name]: value })); }
  function useAgamaModel() {
    setForm((current) => ({ ...current, ...AGAMA_SAMPLE_LISTING }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    files.forEach((file) => payload.append("photos", file));
    const response = await fetch("/api/admin/listings", { method: "POST", body: payload });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(result.error ?? "No se pudo crear el anuncio.");
      setLoading(false);
      return;
    }
    router.push("/admin#anuncios");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-6">
        <section className="border-t border-slate-200 pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-sky">Contenido</p>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-brand-dark">Modelo unico de anuncio</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Estructura base: producto claro, precio, compra minima, ubicacion, contacto y enlace propio.</p>
              </div>
              <button type="button" onClick={useAgamaModel} className="rounded-full border border-brand/30 px-4 py-2 text-xs font-semibold text-brand-dark hover:bg-white">
                Usar ejemplo AGAMA
              </button>
            </div>
          </div>
          <div className="mt-4 space-y-5">
            <label className="block text-sm font-semibold text-brand-dark">Empresa
              <select required value={form.company_id} onChange={(event) => update("company_id", event.target.value)} disabled={previewMode || companies.length === 0} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-700 outline-none focus:border-brand">
                <option value="">Selecciona una empresa</option>
                {companies.map((company) => <option key={company.id} value={company.id}>{company.name}{company.location ? ` · ${company.location}` : ""}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-brand-dark">Título del anuncio
              <input required minLength={10} maxLength={120} value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="Ej. Envases PET transparentes para alimentación" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal text-slate-700 outline-none focus:border-brand" />
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-brand-dark">Tipo
                <select value={form.type} onChange={(event) => update("type", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-700 outline-none focus:border-brand"><option value="product">Producto</option><option value="service">Servicio</option><option value="ad">Anuncio B2B</option></select>
              </label>
              <label className="block text-sm font-semibold text-brand-dark">Categoría
                <select value={form.category} onChange={(event) => update("category", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-700 outline-none focus:border-brand">{CATEGORIES.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select>
              </label>
            </div>
            <label className="block text-sm font-semibold text-brand-dark">Descripción
              <textarea required minLength={30} maxLength={3000} rows={8} value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Materiales, medidas, capacidad, cantidades mínimas, aplicaciones y condiciones…" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal leading-6 text-slate-700 outline-none focus:border-brand" />
            </label>
          </div>
        </section>

        <section className="border-t border-slate-200 pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-sky">Presentación</p>
          <label className="mt-4 block text-sm font-semibold text-brand-dark">Fotografías del producto <span className="font-normal text-slate-400">(máximo 5)</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 5))} disabled={previewMode} className="mt-2 block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-normal text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-brand-dark file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white" />
          </label>
          <p className="mt-2 text-xs text-slate-500">Usa imágenes claras del producto, sin datos de contacto ni material prohibido. {files.length ? `${files.length} seleccionada${files.length === 1 ? "" : "s"}.` : ""}</p>
        </section>

        <section className="border-t border-slate-200 pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-sky">Datos comerciales</p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-brand-dark">Precio MXN
              <input required type="number" min="0" step="0.01" value={form.price_mxn} onChange={(event) => update("price_mxn", event.target.value)} placeholder="0.00" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal text-slate-700 outline-none focus:border-brand" />
            </label>
            <label className="block text-sm font-semibold text-brand-dark">Cómo se vende
              <select required value={form.unit} onChange={(event) => update("unit", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-700 outline-none focus:border-brand">
                {SALE_UNITS.map((unit) => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-brand-dark">Compra mínima
              <input required type="number" min="1" step="1" inputMode="numeric" value={form.min_purchase_qty} onChange={(event) => update("min_purchase_qty", event.target.value)} placeholder="1" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal text-slate-700 outline-none focus:border-brand" />
            </label>
            <label className="block text-sm font-semibold text-brand-dark">Ubicación
              <input required minLength={2} value={form.location} onChange={(event) => update("location", event.target.value)} placeholder="Ciudad, estado" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal text-slate-700 outline-none focus:border-brand" />
            </label>
            <label className="block text-sm font-semibold text-brand-dark">Forma de contacto
              <select required value={form.contact_method} onChange={(event) => update("contact_method", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-700 outline-none focus:border-brand">
                {CONTACT_METHODS.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-brand-dark">Dato de contacto
              <input required value={form.contact_value} onChange={(event) => update("contact_value", event.target.value)} placeholder={contactPlaceholder(form.contact_method)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal text-slate-700 outline-none focus:border-brand" />
            </label>
            <label className="block text-sm font-semibold text-brand-dark">Web del anuncio <span className="font-normal text-slate-400">(opcional)
              <input type="url" value={form.external_url} onChange={(event) => update("external_url", event.target.value)} placeholder="https://tuempresa.com/producto" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal text-slate-700 outline-none focus:border-brand" />
            </span></label>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">Solo se permiten enlaces de la web propia del anunciante. No se aceptan acortadores, marketplaces externos ni landings de terceros.</p>
        </section>

        {error ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        <div className="flex flex-wrap items-center gap-4"><button type="submit" disabled={loading || previewMode || companies.length === 0} className="rounded-full bg-brand-dark px-6 py-3 text-sm font-semibold text-white hover:bg-brand disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Guardando…" : "Crear y enviar a revisión"}</button><button type="button" onClick={() => router.back()} className="text-sm font-semibold text-slate-500 hover:text-brand-dark">Cancelar</button></div>
      </div>

      <aside className="h-fit rounded-2xl border border-brand/20 bg-brand-light p-5 lg:sticky lg:top-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-sky">Control editorial</p>
        <h2 className="mt-2 text-lg font-semibold text-brand-dark">Listo para moderar.</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">El anuncio se crea como pendiente de revisión. Desde la cola podrás aprobarlo o rechazarlo con un motivo.</p>
        <ul className="mt-5 space-y-3 text-sm text-slate-700"><li>• No pigmentos, masterbatch ni aditivos.</li><li>• Sin teléfonos, emails ni WhatsApp en el texto.</li><li>• Mejor con fotografías claras del producto.</li></ul>
        <div className="mt-5 rounded-xl bg-white/75 px-4 py-4">
          <p className="text-sm font-semibold text-brand-dark">Modelo obligatorio</p>
          <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-600">
            {LISTING_MODEL_FIELDS.slice(0, 6).map((field) => <li key={field}>• {field}</li>)}
          </ul>
        </div>
        <div className="mt-4 rounded-xl bg-white/75 px-4 py-4">
          <p className="text-sm font-semibold text-brand-dark">Reglas clave</p>
          <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-600">
            {LISTING_MODEL_RULES.slice(0, 3).map((rule) => <li key={rule}>• {rule}</li>)}
          </ul>
        </div>
        <div className="mt-5 rounded-xl bg-white/75 px-4 py-4">
          <p className="text-sm font-semibold text-brand-dark">¿Quieres publicar más rápido?</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">Los clientes premium tienen revisión preferente.</p>
        </div>
        <a href="/legal/comunidad" className="mt-5 block text-sm font-semibold text-brand-dark underline decoration-brand/30 underline-offset-4 hover:text-brand">Ver política de uso y condiciones</a>
        {previewMode ? <p className="mt-5 rounded-xl bg-white/70 px-3 py-3 text-xs leading-5 text-slate-600">Vista previa local: conecta una sesión admin y datos reales para activar el guardado.</p> : null}
      </aside>
    </form>
  );
}
