"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AjustesPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) router.replace("/ingresar?next=/panel/ajustes");
    })();
  }, [router]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-sky">
        Ajustes
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-brand-dark sm:text-4xl">
        Configuración de tu cuenta.
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600">
        Esta sección estará disponible próximamente. Aquí podrás gestionar
        tus preferencias de notificación, datos de facturación y más.
      </p>
      <div className="mt-8 rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center">
        <p className="text-sm text-slate-400">Próximamente</p>
      </div>
    </div>
  );
}
