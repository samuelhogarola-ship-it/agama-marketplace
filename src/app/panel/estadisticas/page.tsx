"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function EstadisticasPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/ingresar?next=/panel/estadisticas");
        return;
      }
      const { data } = await supabase
        .from("mkt_companies")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle();
      setPlan(data?.plan ?? "free");
      setLoading(false);
    })();
  }, [router]);

  if (loading)
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 text-sm text-slate-400 sm:px-8">
        Cargando…
      </div>
    );

  if (plan !== "pro")
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-sky">
          Estadísticas
        </p>
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
            <div
              key={stat.label}
              className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-6 text-center"
            >
              <p className="text-2xl">{stat.icon}</p>
              <p className="mt-2 text-sm font-semibold text-slate-400">
                {stat.label}
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-300">—</p>
              <p className="mt-1 text-xs text-slate-400">{stat.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-brand/20 bg-brand-light px-6 py-6">
          <p className="text-sm font-semibold text-brand-dark">
            Disponible con el plan Pro
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Sube a Pro para desbloquear estadísticas detalladas de tus anuncios
            y publicar sin límite.
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

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-sky">
        Estadísticas
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-brand-dark sm:text-4xl">
        Rendimiento de tus anuncios.
      </h1>
      <p className="mt-4 text-sm text-slate-500">
        Las estadísticas detalladas estarán disponibles próximamente.
      </p>
    </div>
  );
}
