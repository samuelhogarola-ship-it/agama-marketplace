"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type ListingStat = {
  id: number;
  title: string;
  status: string;
  url: string;
  pageviews: number;
  visitors: number;
};

type StatsData = {
  period: { days: number };
  profile: {
    pageviews: number;
    visitors: number;
    series: { pageviews: { x: string; y: number }[]; sessions: { x: string; y: number }[] } | null;
  };
  listings: {
    totalPageviews: number;
    totalVisitors: number;
    perListing: ListingStat[];
  };
  contactClicks: number;
  referrers: { x: string; y: number }[];
  devices: { x: string; y: number }[];
  prevPeriod: { profilePageviews: number };
};

const STATUS_LABEL: Record<string, string> = {
  published: "Publicado",
  pending_review: "En revisión",
  paused: "Pausado",
  draft: "Borrador",
  rejected: "Rechazado",
};

function delta(current: number, previous: number): string | null {
  if (previous === 0) return current > 0 ? "+100%" : null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return null;
  return pct > 0 ? `+${pct}%` : `${pct}%`;
}

function MiniBar({ data, maxH = 40 }: { data: { x: string; y: number }[]; maxH?: number }) {
  const max = Math.max(...data.map((d) => d.y), 1);
  return (
    <div className="flex items-end gap-[2px]" style={{ height: maxH }} aria-hidden>
      {data.map((d, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm bg-brand/70"
          style={{ height: `${Math.max((d.y / max) * 100, 2)}%` }}
          title={`${d.x}: ${d.y}`}
        />
      ))}
    </div>
  );
}

export default function EstadisticasPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/ingresar?next=/panel/estadisticas"); return; }
      const { data } = await supabase
        .from("mkt_companies")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle();
      setPlan(data?.plan ?? "free");
      setLoading(false);
    })();
  }, [router]);

  const fetchStats = useCallback(async () => {
    setStatsError(null);
    try {
      const res = await fetch(`/api/stats?days=${days}`);
      if (res.status === 503) { setStatsError("analytics_not_configured"); return; }
      if (!res.ok) { setStatsError("fetch_error"); return; }
      setStats(await res.json());
    } catch {
      setStatsError("fetch_error");
    }
  }, [days]);

  useEffect(() => {
    if (plan === "pro") fetchStats();
  }, [plan, fetchStats]);

  if (loading) {
    return <div className="mx-auto max-w-4xl px-5 py-16 text-sm text-slate-400 sm:px-8">Cargando…</div>;
  }

  if (plan !== "pro") {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-sky">Estadísticas</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-brand-dark sm:text-4xl">
          Conoce quién visita tus anuncios.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600">
          Con el plan Pro puedes ver cuántas personas visitan cada anuncio,
          lo guardan como favorito y hacen clic en tu web.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Visitas", desc: "Cuántas personas ven tu anuncio", icon: "👁" },
            { label: "Favoritos", desc: "Cuántas guardan tu anuncio", icon: "★" },
            { label: "Clics a tu web", desc: "Cuántas van a tu sitio", icon: "↗" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-6 text-center">
              <p className="text-2xl">{stat.icon}</p>
              <p className="mt-2 text-sm font-semibold text-slate-400">{stat.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-300">—</p>
              <p className="mt-1 text-xs text-slate-400">{stat.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-brand/20 bg-brand-light px-6 py-6">
          <p className="text-sm font-semibold text-brand-dark">Disponible con el plan Pro</p>
          <p className="mt-1 text-sm text-slate-600">
            Sube a Pro para desbloquear estadísticas detalladas de tus anuncios y publicar sin límite.
          </p>
          <Link
            href="/panel"
            className="mt-4 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Subir a Pro
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-sky">Estadísticas</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-brand-dark sm:text-4xl">
            Rendimiento de tus anuncios
          </h1>
        </div>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-xs font-semibold">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                days === d ? "bg-white text-brand-dark shadow-sm" : "text-slate-500 hover:text-brand-dark"
              }`}
            >
              {d === 7 ? "7 días" : d === 30 ? "30 días" : "90 días"}
            </button>
          ))}
        </div>
      </div>

      {statsError === "analytics_not_configured" && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          El sistema de analítica no está configurado todavía. Contacta con soporte.
        </div>
      )}
      {statsError === "fetch_error" && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          No se pudieron cargar las estadísticas.{" "}
          <button onClick={fetchStats} className="font-semibold underline">Reintentar</button>
        </div>
      )}

      {!stats && !statsError && (
        <div className="mt-10 text-center text-sm text-slate-400">Cargando estadísticas…</div>
      )}

      {stats && (
        <>
          <section className="mt-8 grid gap-4 sm:grid-cols-4" aria-label="Métricas principales">
            {([
              {
                label: "Visitas perfil",
                value: stats.profile.pageviews,
                delta: delta(stats.profile.pageviews, stats.prevPeriod.profilePageviews),
              },
              { label: "Visitas anuncios", value: stats.listings.totalPageviews, delta: null },
              { label: "Visitantes únicos", value: stats.profile.visitors + stats.listings.totalVisitors, delta: null },
              { label: "Clics de contacto", value: stats.contactClicks, delta: null },
            ] as const).map((m) => (
              <div key={m.label} className="rounded-xl border border-slate-200 bg-white px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{m.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-brand-dark">
                  {m.value.toLocaleString("es-MX")}
                </p>
                {m.delta && (
                  <p className={`mt-1 text-xs font-semibold ${m.delta.startsWith("+") ? "text-emerald-600" : "text-red-500"}`}>
                    {m.delta} vs periodo anterior
                  </p>
                )}
              </div>
            ))}
          </section>

          {stats.profile.series && stats.profile.series.pageviews.length > 0 && (
            <section className="mt-6 rounded-xl border border-slate-200 bg-white px-5 py-5">
              <h2 className="text-sm font-semibold text-brand-dark">Visitas al perfil de empresa</h2>
              <p className="mt-1 text-xs text-slate-400">Últimos {stats.period.days} días</p>
              <div className="mt-4">
                <MiniBar data={stats.profile.series.pageviews} maxH={80} />
              </div>
            </section>
          )}

          {stats.listings.perListing.length > 0 && (
            <section className="mt-6 rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-semibold text-brand-dark">Rendimiento por anuncio</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {stats.listings.perListing.map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-700">{l.title}</p>
                      <p className="text-xs text-slate-400">{STATUS_LABEL[l.status] ?? l.status}</p>
                    </div>
                    <div className="flex shrink-0 gap-6 text-right text-sm">
                      <div>
                        <p className="font-semibold text-brand-dark">{l.pageviews}</p>
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">visitas</p>
                      </div>
                      <div>
                        <p className="font-semibold text-brand-dark">{l.visitors}</p>
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">únicos</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {stats.referrers.length > 0 && (
              <section className="rounded-xl border border-slate-200 bg-white px-5 py-5">
                <h2 className="text-sm font-semibold text-brand-dark">Fuentes de tráfico</h2>
                <div className="mt-4 space-y-2">
                  {stats.referrers.map((r) => (
                    <div key={r.x} className="flex items-center justify-between text-sm">
                      <span className="truncate text-slate-600">{r.x || "Directo"}</span>
                      <span className="ml-2 shrink-0 font-semibold text-brand-dark">{r.y}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {stats.devices.length > 0 && (
              <section className="rounded-xl border border-slate-200 bg-white px-5 py-5">
                <h2 className="text-sm font-semibold text-brand-dark">Dispositivos</h2>
                <div className="mt-4 space-y-2">
                  {stats.devices.map((d) => {
                    const total = stats.devices.reduce((s, v) => s + v.y, 0) || 1;
                    return (
                      <div key={d.x}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">{d.x || "Otro"}</span>
                          <span className="font-semibold text-brand-dark">{Math.round((d.y / total) * 100)}%</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-brand/60" style={{ width: `${(d.y / total) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          <p className="mt-6 text-xs text-slate-400">
            Datos proporcionados por Umami Analytics (sin cookies). Se actualizan cada 5 minutos.
          </p>
        </>
      )}
    </div>
  );
}
