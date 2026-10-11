"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DEMO_COMPANY, DEMO_LISTINGS, DEMO_PREVIEW_ENABLED } from "@/lib/demo-data";
import { panelHref, panelSectionForPath, type PanelSection } from "@/lib/panel-navigation";
import ProCheckoutButton from "@/components/ProCheckoutButton";

type ShellCompany = {
  name: string;
  slug: string | null;
  plan: "free" | "pro";
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "TP";
}

function itemClass(active: boolean, muted = false) {
  if (active) return "rounded-lg bg-brand-light px-3 py-2.5 font-semibold text-brand-dark";
  return `rounded-lg px-3 py-2.5 hover:bg-slate-50 hover:text-brand-dark ${muted ? "text-slate-400" : "text-slate-600"}`;
}

export default function PanelShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previewMode = DEMO_PREVIEW_ENABLED && searchParams.get("preview") === "1";
  const active = panelSectionForPath(pathname);
  const [company, setCompany] = useState<ShellCompany | null>(null);
  const [email, setEmail] = useState("");
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    if (previewMode) {
      setCompany({ name: DEMO_COMPANY.name, slug: DEMO_COMPANY.slug, plan: DEMO_COMPANY.plan });
      setEmail("admin@agama-pigmentos.com");
      setActiveCount(DEMO_LISTINGS.filter((item) => item.status === "published" || item.status === "pending_review").length);
      return;
    }

    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");

      const [{ data: profile }, { count }] = await Promise.all([
        supabase
          .from("mkt_companies")
          .select("name, slug, plan")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("mkt_listings")
          .select("id", { count: "exact", head: true })
          .eq("company_id", user.id)
          .in("status", ["published", "pending_review"]),
      ]);

      if (profile) setCompany(profile as ShellCompany);
      setActiveCount(count ?? 0);
    })();
  }, [previewMode]);

  async function signOut() {
    await createClient().auth.signOut();
    window.location.href = "/";
  }

  const navItems: { section: PanelSection; label: string; href: string; muted?: boolean }[] = [
    { section: "summary", label: "Resumen", href: panelHref("/panel", previewMode) },
    { section: "company", label: "Mi empresa", href: panelHref("/panel/perfil", previewMode) },
    { section: "catalog", label: "Catálogo", href: panelHref("/panel#catalogo", previewMode) },
    { section: "publish", label: "Publicar producto", href: panelHref("/panel/publicar", previewMode) },
    { section: "stats", label: "Estadísticas", href: panelHref("/panel/estadisticas", previewMode), muted: company?.plan !== "pro" },
    { section: "settings", label: "Ajustes", href: panelHref("/panel/ajustes", previewMode) },
  ];

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-7 px-5 py-8 sm:px-8 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-10 lg:px-12 lg:py-14">
      <aside className="h-fit border-b border-slate-200 pb-4 lg:sticky lg:top-28 lg:border-b-0 lg:pb-0">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-dark text-sm font-bold text-white">
            {initials(company?.name ?? "Mi empresa")}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-brand-dark">{company?.name ?? "Mi empresa"}</p>
            <p className="truncate text-xs text-slate-500">{email || "Panel de empresa"}</p>
          </div>
        </div>

        <nav aria-label="Panel de empresa" className="mt-4 flex gap-1 overflow-x-auto pb-1 text-sm font-medium lg:grid lg:overflow-visible lg:pb-0">
          {navItems.map((item) => (
            <Link key={item.section} href={item.href} aria-current={active === item.section ? "page" : undefined} className={`${itemClass(active === item.section, item.muted)} shrink-0`}>
              {item.label}
            </Link>
          ))}
          <div className="my-1 hidden border-t border-slate-100 lg:block" />
          {company?.slug ? (
            <Link href={`/e/${company.slug}`} target="_blank" rel="noreferrer" className="flex shrink-0 items-center justify-between rounded-lg px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-brand-dark">
              Ver ficha pública <span className="ml-2 text-slate-300">↗</span>
            </Link>
          ) : null}
          {!previewMode && email ? (
            <Link href="/panel#soporte" className="shrink-0 rounded-lg px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-brand-dark">
              Soporte
            </Link>
          ) : null}
        </nav>

        <div className="mt-6 hidden border-t border-slate-200 pt-5 lg:block">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Plan actual</p>
          <p className="mt-2 text-sm font-semibold text-brand-dark">{company?.plan === "pro" ? "Premium" : "Gratuito"}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{activeCount}/{company?.plan === "pro" ? "∞" : "5"} anuncios activos</p>
          {!previewMode && email && company?.plan !== "pro" ? (
            <ProCheckoutButton className="mt-3 w-full rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50" />
          ) : null}
          {email ? (
            <button type="button" onClick={signOut} className="mt-5 text-xs font-semibold text-slate-500 hover:text-brand-dark">
              Cerrar sesión
            </button>
          ) : null}
        </div>
      </aside>

      <main className="min-w-0">{children}</main>
    </div>
  );
}
