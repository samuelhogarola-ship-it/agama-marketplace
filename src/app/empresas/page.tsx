import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";
import type { Company } from "@/lib/types";

export const metadata: Metadata = {
  title: "Empresas de la industria plástica",
  description: "Encuentra fabricantes, distribuidores y servicios profesionales de la industria plástica en México.",
};

type Props = { searchParams: Promise<{ q?: string; category?: string; location?: string }> };

export default async function EmpresasPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = (params.q ?? "").trim().slice(0, 80);
  const category = params.category ?? "";
  const location = (params.location ?? "").trim().slice(0, 80);
  const supabase = await createClient();
  let request = supabase
    .from("mkt_companies")
    .select("id, name, slug, description, location, website, phone, email, whatsapp, categories, logo_url, plan, is_verified, is_featured, status, created_at")
    .eq("status", "active")
    .order("is_featured", { ascending: false })
    .order("name")
    .limit(48);
  if (query) request = request.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
  if (category) request = request.contains("categories", [category]);
  if (location) request = request.ilike("location", `%${location}%`);
  const { data } = await request;
  const companies = (data as Company[]) ?? [];

  return (
    <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-sky">Directorio profesional</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-brand-dark sm:text-6xl">Empresas que mueven al plástico.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Encuentra fabricantes, distribuidores y servicios del sector plástico en México. Contacta directamente con cada empresa.</p>
      </div>
      <form className="mt-10 grid gap-3 border-y border-slate-200 py-5 md:grid-cols-[1.5fr_1fr_1fr_auto]" action="/empresas">
        <input name="q" defaultValue={query} placeholder="Buscar empresa" className="rounded-full border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand" />
        <select name="category" defaultValue={category} className="rounded-full border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand">
          <option value="">Todas las categorías</option>
          {CATEGORIES.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
        </select>
        <input name="location" defaultValue={location} placeholder="Ciudad o estado" className="rounded-full border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand" />
        <button className="rounded-full bg-brand-dark px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand">Filtrar</button>
      </form>
      <div className="mt-10 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-brand-dark">{companies.length} empresas</h2>
        <Link href="/registro" className="text-sm font-semibold text-brand-dark underline decoration-slate-300 underline-offset-8 hover:decoration-brand">Añadir mi empresa ↗</Link>
      </div>
      {companies.length > 0 ? (
        <div className="mt-6 grid gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Link key={company.id} href={`/e/${company.slug}`} className="group border-t border-slate-200 pt-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-light text-lg font-semibold text-brand-dark">{company.name.charAt(0)}</div>
                  <div>
                    <h3 className="font-semibold tracking-[-0.02em] text-brand-dark transition-colors group-hover:text-hot">{company.name}</h3>
                    {company.location && <p className="mt-1 text-sm text-slate-500">{company.location}</p>}
                  </div>
                </div>
                <span className="text-xl text-slate-300 transition-colors group-hover:text-hot">↗</span>
              </div>
              {company.description && <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{company.description}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {company.is_verified && <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-sky">Verificada</span>}
                {(company.categories ?? []).slice(0, 2).map((item) => <span key={item} className="text-xs text-slate-400">{CATEGORIES.find((c) => c.slug === item)?.name ?? item}</span>)}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-8 border-t border-slate-200 py-16 text-center text-slate-500">Todavía no hay empresas que coincidan con estos filtros.</div>
      )}
    </div>
  );
}
