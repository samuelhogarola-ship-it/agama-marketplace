import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";
import AdminQueue from "@/components/AdminQueue";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="mx-auto max-w-xl px-5 py-20"><h1 className="text-3xl font-semibold text-brand-dark">Panel de administración</h1><p className="mt-4 text-slate-600">Inicia sesión con una cuenta autorizada para continuar.</p><Link href="/ingresar?next=/admin" className="mt-7 inline-flex rounded-full bg-brand-dark px-6 py-3 text-sm font-semibold text-white">Ingresar</Link></div>;
  if (!isAdminEmail(user.email) && user.user_metadata?.role !== "admin") return <div className="mx-auto max-w-xl px-5 py-20"><h1 className="text-3xl font-semibold text-brand-dark">Área privada</h1><p className="mt-4 text-slate-600">Esta sección está reservada para el equipo de TodoPlástico.</p></div>;
  const admin = createAdminClient();
  if (!admin) return <div className="mx-auto max-w-xl px-5 py-20"><h1 className="text-3xl font-semibold text-brand-dark">Configuración pendiente</h1><p className="mt-4 text-slate-600">Añade `SUPABASE_SERVICE_ROLE_KEY` y `TODO_PLASTICO_ADMIN_EMAILS` al entorno local para activar la cola de moderación.</p></div>;
  const [{ data }, { count: published }, { count: rejected }, { count: reviewed }] = await Promise.all([
    admin.from("mkt_listings").select("id, title, slug, description, category, location, status, rejection_reason, created_at, company:mkt_companies(name, slug), photos:mkt_listing_photos(*)").eq("status", "pending_review").order("created_at", { ascending: true }).limit(50),
    admin.from("mkt_listings").select("id", { count: "exact", head: true }).eq("status", "published"),
    admin.from("mkt_listings").select("id", { count: "exact", head: true }).eq("status", "rejected"),
    admin.from("mkt_moderation_events").select("id", { count: "exact", head: true }),
  ]);
  const queue = (data ?? []).map((item) => ({ ...item, company: Array.isArray(item.company) ? item.company[0] : item.company }));
  return <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-12"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-sky">Operación</p><h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-brand-dark">Cola de moderación.</h1><p className="mt-4 text-slate-600">Revisa los anuncios dudosos y decide si cumplen las normas de la comunidad.</p><div className="mt-10 grid grid-cols-2 gap-4 border-y border-slate-200 py-5 sm:grid-cols-4"><div><p className="text-2xl font-semibold text-brand-dark">{queue.length}</p><p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">En revisión</p></div><div><p className="text-2xl font-semibold text-brand-dark">{published ?? 0}</p><p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">Publicados</p></div><div><p className="text-2xl font-semibold text-brand-dark">{rejected ?? 0}</p><p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">Rechazados</p></div><div><p className="text-2xl font-semibold text-brand-dark">{reviewed ?? 0}</p><p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">Eventos IA</p></div></div><AdminQueue initialItems={queue} /></div>;
}
