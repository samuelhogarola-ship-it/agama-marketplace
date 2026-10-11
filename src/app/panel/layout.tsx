import { Suspense, type ReactNode } from "react";
import PanelShell from "@/components/PanelShell";

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-5 py-16 text-sm text-slate-400 sm:px-8 lg:px-12">Cargando el panel…</div>}>
      <PanelShell>{children}</PanelShell>
    </Suspense>
  );
}
