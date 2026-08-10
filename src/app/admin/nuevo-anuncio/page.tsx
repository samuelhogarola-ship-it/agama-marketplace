import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminUser } from "@/lib/supabase/admin";
import AdminListingForm from "@/components/AdminListingForm";

export default async function NewAdminListingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="mx-auto max-w-xl px-5 py-20"><h1 className="text-3xl font-semibold text-brand-dark">Panel de administración</h1><p className="mt-4 text-slate-600">Inicia sesión con una cuenta autorizada para continuar.</p><Link href="/ingresar?next=/admin/nuevo-anuncio" className="mt-7 inline-flex rounded-full bg-brand-dark px-6 py-3 text-sm font-semibold text-white">Ingresar</Link></div>;
  if (!isAdminUser(user)) return <div className="mx-auto max-w-xl px-5 py-20"><h1 className="text-3xl font-semibold text-brand-dark">Área privada</h1><p className="mt-4 text-slate-600">Esta sección está reservada para el equipo de TodoPlástico.</p></div>;
  const admin = createAdminClient();
  let companies: Array<{ id: string; name: string; location: string | null; website: string | null }> = [];
  if (admin) {
    const { data } = await admin.from("mkt_companies").select("id, name, location, website").eq("status", "active").order("name", { ascending: true }).limit(500);
    companies = data ?? [];
  }
  return <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12 lg:py-14"><div className="flex flex-wrap items-end justify-between gap-5"><div><Link href="/admin" className="text-sm font-semibold text-slate-500 hover:text-brand-dark">← Volver al panel</Link><p className="mt-8 text-xs font-semibold uppercase tracking-[0.24em] text-brand-sky">Catálogo · Administración</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-brand-dark sm:text-5xl">Nuevo anuncio.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Crea una publicación en nombre de una empresa y pásala al circuito normal de revisión.</p></div></div><AdminListingForm companies={companies} previewMode={false} /></div>;
}
