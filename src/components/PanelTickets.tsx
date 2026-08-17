"use client";

import { useCallback, useEffect, useState } from "react";
import type { TicketStatus, TicketCategory } from "@/lib/types";

type PanelTicket = {
  id: number;
  ticket_code: string;
  category: TicketCategory;
  subject: string;
  status: TicketStatus;
  priority: string;
  created_at: string;
  updated_at: string;
};

type Message = {
  id: number;
  author_id: string;
  is_internal: boolean;
  body: string;
  created_at: string;
};

const STATUS_LABEL: Record<TicketStatus, { text: string; cls: string }> = {
  open:        { text: "Abierto",     cls: "bg-sky-100 text-sky-800" },
  in_progress: { text: "En gestión",  cls: "bg-amber-100 text-amber-800" },
  resolved:    { text: "Resuelto",    cls: "bg-emerald-100 text-emerald-800" },
  closed:      { text: "Cerrado",     cls: "bg-slate-100 text-slate-500" },
};

const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: "tecnico",     label: "Problema técnico" },
  { value: "contenido",   label: "Anuncio / contenido" },
  { value: "cuenta",      label: "Mi cuenta" },
  { value: "facturacion", label: "Facturación" },
  { value: "general",     label: "Consulta general" },
];

const dateFormatter = new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
function fmt(d: string) { return dateFormatter.format(new Date(d)); }

export default function PanelTickets({ userId }: { userId: string }) {
  const [tickets, setTickets] = useState<PanelTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "new" | "detail">("list");
  const [selected, setSelected] = useState<PanelTicket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [form, setForm] = useState({ subject: "", category: "general" as TicketCategory, message: "" });
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    const res = await fetch("/api/tickets");
    const json = await res.json();
    setTickets(json.tickets ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  async function loadDetail(ticket: PanelTicket) {
    setSelected(ticket);
    setView("detail");
    setReply("");
    setError(null);
    const res = await fetch(`/api/tickets/${ticket.id}`);
    const json = await res.json();
    setMessages(json.messages ?? []);
  }

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setError(json.error ?? "No se pudo crear el ticket."); return; }
    setSuccess(`Ticket ${json.ticket.ticket_code} creado. Te responderemos en breve.`);
    setForm({ subject: "", category: "general", message: "" });
    setView("list");
    await loadTickets();
  }

  async function sendReply() {
    if (!selected || !reply.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/tickets/${selected.id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: reply.trim() }),
    });
    if (!res.ok) { setError("No se pudo enviar el mensaje."); setSaving(false); return; }
    setReply("");
    setSaving(false);
    const detail = await fetch(`/api/tickets/${selected.id}`).then(r => r.json());
    setMessages(detail.messages ?? []);
  }

  if (loading) return <p className="text-sm text-slate-400 py-4">Cargando tickets de soporte…</p>;

  return (
    <section className="mt-8 scroll-mt-24">
      <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-sky">Atención</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-brand-dark">Soporte</h2>
        </div>
        {view !== "new" && (
          <button
            onClick={() => { setView("new"); setError(null); setSuccess(null); }}
            className="rounded-full border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-brand hover:text-white transition-colors"
          >
            Nuevo ticket
          </button>
        )}
      </div>

      {success && (
        <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}

      {/* Formulario nuevo ticket */}
      {view === "new" && (
        <form onSubmit={createTicket} className="mt-6 space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value as TicketCategory })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand"
            >
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Asunto</label>
            <input
              required
              minLength={5}
              maxLength={200}
              placeholder="Describe brevemente tu consulta"
              value={form.subject}
              onChange={e => setForm({ ...form, subject: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción detallada</label>
            <textarea
              required
              minLength={10}
              maxLength={5000}
              rows={5}
              placeholder="Explica el problema o consulta con el mayor detalle posible…"
              value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-brand"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-brand text-white px-5 py-2.5 text-sm font-medium hover:bg-brand-dark disabled:opacity-50"
            >
              {saving ? "Enviando…" : "Enviar ticket"}
            </button>
            <button
              type="button"
              onClick={() => { setView("list"); setError(null); }}
              className="rounded-full border border-slate-200 px-5 py-2.5 text-sm text-slate-600 hover:border-slate-400"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista de tickets */}
      {view === "list" && (
        <div className="mt-4">
          {tickets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center">
              <p className="text-sm text-slate-500">Todavía no has abierto ningún ticket de soporte.</p>
              <p className="mt-1 text-xs text-slate-400">Si tienes alguna duda o problema, créalo con el botón de arriba.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Ticket</th>
                    <th className="px-4 py-3 font-semibold">Asunto</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold">Actualizado</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.map(ticket => {
                    const st = STATUS_LABEL[ticket.status];
                    return (
                      <tr key={ticket.id} className="text-slate-600 hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{ticket.ticket_code}</td>
                        <td className="px-4 py-3 text-slate-800 font-medium max-w-[200px] truncate">{ticket.subject}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${st.cls}`}>{st.text}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{fmt(ticket.updated_at)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => loadDetail(ticket)}
                            className="text-xs font-medium text-brand hover:underline"
                          >
                            Ver hilo
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Detalle / conversación */}
      {view === "detail" && selected && (
        <div className="mt-4 rounded-2xl border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 flex items-start justify-between gap-4 bg-slate-50">
            <div>
              <p className="text-xs font-mono text-slate-400">{selected.ticket_code}</p>
              <h3 className="mt-0.5 font-semibold text-brand-dark">{selected.subject}</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_LABEL[selected.status].cls}`}>
                {STATUS_LABEL[selected.status].text}
              </span>
              <button
                onClick={() => { setView("list"); setSelected(null); }}
                className="text-xs text-slate-500 hover:text-brand"
              >
                ← Volver
              </button>
            </div>
          </div>
          <div className="px-5 py-4 space-y-3 max-h-80 overflow-y-auto">
            {messages.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Sin mensajes todavía</p>}
            {messages.map(msg => {
              const isOwn = msg.author_id === userId;
              return (
                <div
                  key={msg.id}
                  className={`rounded-xl px-4 py-3 text-sm max-w-[85%] ${isOwn ? "bg-brand/10 text-brand-dark ml-auto" : "bg-slate-100 text-slate-800"}`}
                >
                  <p className="whitespace-pre-wrap">{msg.body}</p>
                  <p className="mt-1.5 text-[10px] text-slate-400">{isOwn ? "Tú" : "Soporte TodoPlástico"} · {fmt(msg.created_at)}</p>
                </div>
              );
            })}
          </div>
          {selected.status !== "closed" && (
            <div className="border-t border-slate-200 px-5 py-4">
              {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
              <div className="flex gap-2">
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Escribe tu respuesta…"
                  rows={3}
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm resize-none focus:outline-none focus:border-brand"
                />
                <button
                  onClick={sendReply}
                  disabled={saving || !reply.trim()}
                  className="self-end rounded-xl bg-brand-dark text-white px-4 py-2 text-sm font-medium hover:bg-brand disabled:opacity-40"
                >
                  {saving ? "…" : "Enviar"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
