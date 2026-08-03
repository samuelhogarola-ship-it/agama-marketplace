"use client";

import { useState } from "react";

type QueueItem = { id: number; title: string; description: string; category: string; location: string | null; created_at: string; company?: { name?: string } | null };

export default function AdminQueue({ initialItems, readOnly = false }: { initialItems: QueueItem[]; readOnly?: boolean }) {
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState<number | null>(null);
  async function decide(id: number, action: "approve" | "reject") {
    const reason = action === "reject" ? window.prompt("Motivo del rechazo")?.trim() : undefined;
    if (action === "reject" && !reason) return;
    setBusy(id);
    const response = await fetch("/api/admin/moderation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action, reason }) });
    if (response.ok) setItems((current) => current.filter((item) => item.id !== id));
    setBusy(null);
  }
  if (items.length === 0) return <div className="mt-10 border-t border-slate-200 py-16 text-center text-slate-500">La cola está limpia.</div>;
  return <div className="mt-10 space-y-5">{items.map((item) => <article key={item.id} className="border-t border-slate-200 pt-5"><div className="flex flex-col justify-between gap-5 lg:flex-row"><div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{item.company?.name ?? "Empresa"} · {item.category}</p><h2 className="mt-2 text-xl font-semibold text-brand-dark">{item.title}</h2><p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{item.description}</p>{item.location && <p className="mt-3 text-xs text-slate-500">{item.location}</p>}</div><div className="flex shrink-0 items-start gap-3">{readOnly ? <span className="rounded-full bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-500">Acciones disponibles con sesión admin</span> : <><button disabled={busy === item.id} onClick={() => decide(item.id, "reject")} className="rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Rechazar</button><button disabled={busy === item.id} onClick={() => decide(item.id, "approve")} className="rounded-full bg-brand-dark px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand disabled:opacity-50">Aprobar</button></>}</div></div></article>)}</div>;
}
