"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES } from "@/lib/categories";
import { compressImage } from "@/lib/compress-image";
import { DEMO_COMPANY } from "@/lib/demo-data";

function PerfilContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const previewMode = searchParams.get("preview") === "1";
  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    website: "",
    phone: "",
    email: "",
    whatsapp: "",
    categories: [] as string[],
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

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
        categories: DEMO_COMPANY.categories ?? [],
      });
      setLogoUrl(DEMO_COMPANY.logo_url);
      setLoading(false);
      return;
    }
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
          categories: data.categories ?? [],
        });
        setLogoUrl(data.logo_url ?? null);
      }
      setLoading(false);
    })();
  }, [previewMode, router]);

  async function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setLogoPreview(preview);
    if (previewMode) return;

    setUploadingLogo(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const compressed = await compressImage(file);
    const ext =
      { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[
        compressed.type
      ] ?? "jpg";
    const path = `logos/${user.id}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("mkt-photos")
      .upload(path, compressed, { upsert: true });

    if (!upErr) {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/mkt-photos/${path}`;
      await supabase
        .from("mkt_companies")
        .update({ logo_url: url })
        .eq("id", user.id);
      setLogoUrl(url);
    }
    setUploadingLogo(false);
  }

  function toggleCategory(slug: string) {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(slug)
        ? f.categories.filter((c) => c !== slug)
        : [...f.categories, slug],
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (previewMode) {
      setSaved(true);
      return;
    }
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("mkt_companies")
      .update({
        name: form.name,
        description: form.description,
        location: form.location,
        website: form.website,
        phone: form.phone,
        email: form.email,
        whatsapp: form.whatsapp,
        categories: form.categories.length > 0 ? form.categories : null,
      })
      .eq("id", user.id);
    setSaved(true);
    setTimeout(() => router.push("/panel"), 800);
  }

  const currentLogo = logoPreview ?? logoUrl;

  if (loading)
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-slate-400">
        Cargando…
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {previewMode ? (
        <div className="mb-8 rounded-2xl border border-brand/20 bg-brand-light px-5 py-4 text-sm text-slate-700">
          <span className="font-semibold text-brand-dark">
            Vista previa local de AGAMA.
          </span>{" "}
          Esta ficha muestra cómo verá la empresa el usuario final.
        </div>
      ) : null}

      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-sky">
        Mi panel
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-brand-dark">
        Ficha de empresa
      </h1>

      {/* Logo */}
      <div className="mt-8 flex items-center gap-5">
        <button
          type="button"
          onClick={() => logoInputRef.current?.click()}
          aria-label="Cambiar logo"
          className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-50 text-2xl font-bold text-brand-dark hover:border-brand"
        >
          {currentLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentLogo}
              alt="Logo de la empresa"
              className="h-full w-full object-contain p-2"
            />
          ) : (
            <span className="text-brand-dark opacity-60">
              {form.name.charAt(0).toUpperCase() || "?"}
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
            {uploadingLogo ? "Subiendo…" : "Cambiar"}
          </span>
        </button>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onLogoChange}
          className="sr-only"
        />
        <div>
          <p className="text-sm font-semibold text-brand-dark">
            Logo de empresa
          </p>
          <p className="mt-1 text-xs text-slate-500">
            JPG, PNG o WebP · Se muestra en tu ficha y anuncios
          </p>
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            className="mt-2 text-xs font-semibold text-brand underline-offset-4 hover:underline"
          >
            {uploadingLogo ? "Subiendo…" : currentLogo ? "Cambiar logo" : "Subir logo"}
          </button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Nombre de la empresa <span className="text-red-400">*</span>
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Descripción
          </label>
          <textarea
            rows={4}
            maxLength={1000}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="A qué se dedica tu empresa, desde cuándo, qué fabricas o distribuyes…"
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Categorías en las que opera tu empresa
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => toggleCategory(cat.slug)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  form.categories.includes(cat.slug)
                    ? "border-brand bg-brand-light text-brand-dark"
                    : "border-slate-200 text-slate-600 hover:border-brand hover:text-brand-dark"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Ubicación
            </label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Iztapalapa, CDMX"
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Teléfono público
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+52 55 0000 0000"
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Web pública
            </label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://tuempresa.com"
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Email público
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="ventas@tuempresa.com"
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              WhatsApp público
            </label>
            <input
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              placeholder="+52 55 0000 0000"
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        <button className="rounded-full bg-brand px-8 py-3 text-sm font-semibold text-white hover:bg-brand-dark">
          {saved
            ? previewMode
              ? "Cambios de demo guardados ✓"
              : "Guardado ✓"
            : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}

export default function PerfilPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-16 text-slate-400">
          Cargando ficha…
        </div>
      }
    >
      <PerfilContent />
    </Suspense>
  );
}
