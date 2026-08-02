"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { productPath, type Company, type Product } from "@/lib/types";
import { formatPrice } from "@/components/ProductCard";

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  pending_review: { text: "En revisión", cls: "bg-amber-100 text-amber-800" },
  published: { text: "Publicado", cls: "bg-emerald-100 text-emerald-800" },
  rejected: { text: "Rechazado", cls: "bg-red-100 text-red-800" },
  paused: { text: "Pausado", cls: "bg-slate-100 text-slate-600" },
  blocked: { text: "Bloqueado", cls: "bg-red-100 text-red-800" },
  draft: { text: "Borrador", cls: "bg-slate-100 text-slate-600" },
};

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "TP";
}

export default function PanelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const previewMode = process.env.NODE_ENV !== "production" && searchParams.get("preview") === "1";
  const [profile, setProfile] = useState<Company | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (previewMode) {
      setEmail("admin@agama-pigmentos.com");
      setProfile({ id: "agama-preview", name: "AGAMA Pigmentos y Masterbatch", slug: "agama-pigmentos-masterbatch", description: "Empresa especializada en soluciones para la industria plástica.", location: "Fuengirola · Málaga", website: "https://agama.es", phone: null, email: "admin@agama-pigmentos.com", whatsapp: null, categories: ["envases-y-botellas", "tarimas-y-contenedores"], logo_url: null, plan: "pro", is_verified: true, is_featured: true, status: "active", created_at: new Date().toISOString() });
      setProducts([]);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/ingresar?next=/panel");
      return;
    }
    setEmail(user.email ?? "");
    let [{ data: prof }, { data: prods }] = await Promise.all([
      supabase.from("mkt_companies").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("mkt_listings").select("*").eq("company_id", user.id).order("created_at", { ascending: false }),
    ]);
    if (!prof) {
      const name = (user.user_metadata?.company_name as string) ?? user.email?.split("@")[0] ?? "Mi empresa";
      const slug = `${name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60)}-${user.id.slice(0, 6)}`;
      const { data: created } = await supabase.from("mkt_companies").insert({ id: user.id, name: name.slice(0, 120), slug }).select().single();
      prof = created;
    }
    setProfile(prof);
    setProducts((prods as Product[]) ?? []);
    setLoading(false);
  }, [previewMode, router]);

  useEffect(() => { load(); }, [load]);

  async function setStatus(id: number, status: "paused" | "pending_review") {
    if (previewMode) return;
    setActionError(null);
    const supabase = createClient();
    const result = status === "pending_review"
      ? await supabase.rpc("mkt_submit_listing", { p_listing_id: id })
      : await supabase.from("mkt_listings").update({ status }).eq("id", id);
    if (result.error) setActionError("No se pudo actualizar el anuncio. Inténtalo de nuevo.");
    await load();
  }

  async function remove(id: number) {
    if (previewMode) return;
    if (!confirm("¿Eliminar este anuncio definitivamente?")) return;
    setActionError(null);
    const supabase = createClient();
    const { data: photos } = await supabase.from("mkt_listing_photos").select("storage_path").eq("listing_id", id);
    if (photos && photos.length > 0) await supabase.storage.from("mkt-photos").remove(photos.map((photo) => photo.storage_path));
    const { error } = await supabase.from("mkt_listings").delete().eq("id", id);
    if (error) setActionError("No se pudo eliminar el anuncio.");
    await load();
  }

  async function signOut() {
    await createClient().auth.signOut();
    window.location.href = "/";
  }

  const counts = useMemo(() => ({
    published: products.filter((p) => p.status === "published").length,
    review: products.filter((p) => p.status === "pending_review").length,
    total: products.length,
  }), [products]);
  const limit = profile?.plan === "pro" ? Infinity : 5;
  const activeCount = counts.published + counts.review;
  const profileChecks = [profile?.name, profile?.description, profile?.location, profile?.website || profile?.email || profile?.phone].filter(Boolean).length;
  const profileComplete = Math.round((profileChecks / 4) * 100);

  if (loading) return <div className="mx-auto max-w-7xl px-5 py-16 text-sm text-slate-400 sm:px-8 lg:px-12">Cargando tu panel…</div>;

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[230px_minmax(0,1fr)] lg:px-12 lg:py-14">
      <aside className="h-fit lg:sticky lg:top-28">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-dark text-sm font-bold text-white">{getInitials(profile?.name ?? "Mi empresa")}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-brand-dark">{profile?.name ?? "Mi empresa"}</p>
            <p className="truncate text-xs text-slate-500">{email}</p>
          </div>
        </div>
        <nav aria-label="Panel de empresa" className="mt-5 grid gap-1 text-sm font-medium">
          <Link href="/panel" className="rounded-lg bg-brand-light px-3 py-2.5 font-semibold text-brand-dark">Resumen</Link>
          <Link href="/panel/perfil" className="rounded-lg px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-brand-dark">Mi empresa</Link>
          <Link href="/panel/publicar" className="rounded-lg px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-brand-dark">Publicar anuncio</Link>
          <Link href="/empresas" className="rounded-lg px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-brand-dark">Ver directorio</Link>
        </nav>
        <div className="mt-8 border-t border-slate-200 pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Plan actual</p>
          <p className="mt-2 text-sm font-semibold text-brand-dark">{profile?.plan === "pro" ? "Pro" : "Gratuito"}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{activeCount}/{limit === Infinity ? "∞" : limit} anuncios activos</p>
          <button onClick={signOut} className="mt-5 text-xs font-semibold text-slate-500 hover:text-brand-dark">Cerrar sesión</button>
        </div>
      </aside>

      <main className="min-w-0">
        {previewMode ? <div className="mb-8 rounded-2xl border border-brand/20 bg-brand-light px-5 py-4 text-sm text-slate-700"><span className="font-semibold text-brand-dark">Vista previa local de AGAMA.</span> Estás viendo el panel de empresa sin iniciar sesión. Las acciones de catálogo se activarán al conectar Auth.</div> : null}
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-sky">Panel de empresa</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-brand-dark sm:text-5xl">Tu espacio de trabajo.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Gestiona tu ficha pública y los anuncios que presentas a la industria plástica.</p>
          </div>
          {activeCount < limit ? <Link href="/panel/publicar" className="rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-dark">Publicar anuncio</Link> : null}
        </div>

        <section className="mt-9 grid gap-3 sm:grid-cols-3" aria-label="Resumen de actividad">
          {[
            ["Publicados", counts.published, "Visibles en el directorio"],
            ["En revisión", counts.review, "Pendientes de moderación"],
            ["Total anuncios", counts.total, `${limit === Infinity ? "Sin límite" : `${limit} incluidos en tu plan`}`],
          ].map(([label, value, detail]) => (
            <div key={String(label)} className="border-t border-slate-200 pt-4">
              <p className="text-3xl font-semibold tracking-[-0.04em] text-brand-dark">{value}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
              <p className="mt-1 text-xs text-slate-500">{detail}</p>
            </div>
          ))}
        </section>

        {profileComplete < 100 ? (
          <section className="mt-9 rounded-2xl border border-brand/20 bg-brand-light px-5 py-5 sm:px-6" aria-labelledby="complete-profile">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-sky">Siguiente paso</p>
                <h2 id="complete-profile" className="mt-2 text-xl font-semibold text-brand-dark">Completa tu ficha de empresa.</h2>
                <p className="mt-1 text-sm text-slate-600">Una ficha clara ayuda a que te encuentren y convierte mejor cada contacto externo.</p>
              </div>
              <Link href="/panel/perfil" className="text-sm font-semibold text-brand-dark underline decoration-brand/30 underline-offset-4 hover:decoration-brand">Editar ficha ↗</Link>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/80"><div className="h-full rounded-full bg-brand" style={{ width: `${profileComplete}%` }} /></div>
            <p className="mt-2 text-xs font-semibold text-brand-dark">{profileComplete}% completada</p>
          </section>
        ) : null}

        {actionError ? <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</p> : null}

        <section className="mt-10" aria-labelledby="listings-title">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-sky">Catálogo</p>
              <h2 id="listings-title" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-brand-dark">Mis anuncios</h2>
            </div>
            <p className="text-sm text-slate-500">{counts.total} en total</p>
          </div>

          {products.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center">
              <h3 className="text-lg font-semibold text-brand-dark">Tu catálogo empieza aquí.</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Publica tu primer producto o anuncio B2B y aparecerá en la categoría correspondiente después de la moderación.</p>
              <Link href="/panel/publicar" className="mt-6 inline-flex rounded-full bg-brand-dark px-5 py-3 text-sm font-semibold text-white hover:bg-brand">Crear primer anuncio</Link>
            </div>
          ) : (
            <div className="mt-5 divide-y divide-slate-200">
              {products.map((product) => {
                const status = STATUS_LABEL[product.status] ?? STATUS_LABEL.draft;
                return (
                  <article key={product.id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.cls}`}>{status.text}</span>
                        <span className="text-xs uppercase tracking-[0.12em] text-slate-400">{product.category}</span>
                      </div>
                      <h3 className="mt-2 truncate text-base font-semibold text-brand-dark">{product.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">{formatPrice(product.price_mxn)}{product.location ? ` · ${product.location}` : ""}</p>
                      {product.status === "rejected" && product.rejection_reason ? <p className="mt-2 text-sm text-red-600">{product.rejection_reason}</p> : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                      <Link href={`/panel/editar/${product.id}`} className="font-semibold text-brand hover:text-brand-dark">Editar</Link>
                      {product.status === "published" ? <><Link href={productPath(product)} className="text-slate-500 hover:text-brand-dark">Ver</Link><button onClick={() => setStatus(product.id, "paused")} className="text-slate-500 hover:text-brand-dark">Pausar</button></> : null}
                      {(product.status === "paused" || product.status === "rejected") ? <button onClick={() => setStatus(product.id, "pending_review")} className="font-semibold text-brand hover:text-brand-dark">{product.status === "rejected" ? "Reenviar" : "Reactivar"}</button> : null}
                      <button onClick={() => remove(product.id)} className="text-red-500 hover:text-red-700">Eliminar</button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
