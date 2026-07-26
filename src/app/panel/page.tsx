"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { productPath, type Product, type Profile } from "@/lib/types";
import { formatPrice } from "@/components/ProductCard";

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  pending_review: { text: "En revisión", cls: "bg-amber-100 text-amber-800" },
  published: { text: "Publicado", cls: "bg-green-100 text-green-800" },
  rejected: { text: "Rechazado", cls: "bg-red-100 text-red-800" },
  paused: { text: "Pausado", cls: "bg-slate-100 text-slate-600" },
  blocked: { text: "Bloqueado", cls: "bg-red-100 text-red-800" },
  draft: { text: "Borrador", cls: "bg-slate-100 text-slate-600" },
};

export default function PanelPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    let [{ data: prof }, { data: prods }] = await Promise.all([
      supabase.from("mkt_profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("mkt_products").select("*").eq("owner_id", user.id).order("created_at", { ascending: false }),
    ]);
    if (!prof) {
      // Primer acceso vía magic link: crear ficha automáticamente
      const name = (user.user_metadata?.company_name as string) ?? user.email?.split("@")[0] ?? "Mi empresa";
      const slug = `${name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60)}-${user.id.slice(0, 6)}`;
      const { data: created } = await supabase
        .from("mkt_profiles")
        .insert({ id: user.id, company_name: name.slice(0, 120), slug })
        .select()
        .single();
      prof = created;
    }
    setProfile(prof);
    setProducts((prods as Product[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function setStatus(id: number, status: "paused" | "pending_review") {
    const supabase = createClient();
    if (status === "pending_review") {
      await supabase.rpc("mkt_submit_product", { p_product_id: id });
    } else {
      await supabase.from("mkt_products").update({ status }).eq("id", id);
    }
    load();
  }

  async function remove(id: number) {
    if (!confirm("¿Eliminar este producto definitivamente?")) return;
    const supabase = createClient();
    // Borrar también los archivos de Storage (el cascade solo borra las filas)
    const { data: photos } = await supabase.from("mkt_product_photos").select("path").eq("product_id", id);
    if (photos && photos.length > 0) {
      await supabase.storage.from("mkt-photos").remove(photos.map((p) => p.path));
    }
    await supabase.from("mkt_products").delete().eq("id", id);
    load();
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const activeCount = products.filter((p) => ["published", "pending_review"].includes(p.status)).length;
  const limit = profile?.plan === "pro" ? Infinity : 5;

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-16 text-slate-400">Cargando…</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{profile?.company_name ?? "Mi panel"}</h1>
          <p className="text-sm text-slate-500">
            Plan {profile?.plan === "pro" ? "Pro" : "gratuito"} · {activeCount}/{limit === Infinity ? "∞" : limit} productos activos
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <Link href="/panel/perfil" className="text-sm text-brand font-medium hover:underline">Editar empresa</Link>
          <button onClick={signOut} className="text-sm text-slate-400 hover:text-slate-600">Salir</button>
          {activeCount < limit ? (
            <Link href="/panel/publicar" className="rounded-full bg-brand text-white px-5 py-2.5 text-sm font-medium hover:bg-brand-dark">
              + Publicar producto
            </Link>
          ) : (
            <span className="rounded-full bg-slate-100 text-slate-500 px-5 py-2.5 text-sm">
              Límite del plan gratuito alcanzado
            </span>
          )}
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {products.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
            Aún no has publicado productos.
          </div>
        )}
        {products.map((p) => {
          const st = STATUS_LABEL[p.status] ?? STATUS_LABEL.draft;
          return (
            <div key={p.id} className="rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.text}</span>
                  <p className="font-semibold text-slate-800 truncate">{p.title}</p>
                </div>
                <p className="text-sm text-slate-500 mt-1">{formatPrice(p.price_mxn)}</p>
                {p.status === "rejected" && p.reject_reason && (
                  <p className="text-sm text-red-600 mt-1">Motivo: {p.reject_reason}</p>
                )}
              </div>
              <div className="flex gap-3 text-sm shrink-0">
                {p.status === "published" && (
                  <>
                    <Link href={productPath(p)} className="text-brand hover:underline">Ver</Link>
                    <button onClick={() => setStatus(p.id, "paused")} className="text-slate-500 hover:underline">Pausar</button>
                  </>
                )}
                {(p.status === "paused" || p.status === "rejected") && (
                  <button onClick={() => setStatus(p.id, "pending_review")} className="text-brand hover:underline">
                    {p.status === "rejected" ? "Reenviar a revisión" : "Reactivar"}
                  </button>
                )}
                <button onClick={() => remove(p.id)} className="text-red-500 hover:underline">Eliminar</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
