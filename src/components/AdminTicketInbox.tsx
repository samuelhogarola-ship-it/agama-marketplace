"use client";

import { useCallback, useEffect, useState } from "react";
import type { Ticket, TicketMessage, TicketStatus, TicketPriority } from "@/lib/types";

type AdminTicket = Ticket & { company?: { name: string; ref_code: string } | null };

const STATUS_LABEL: Record<TicketStatus, { text: string; cls: string }> = {
  open:        { text: "Abierto",     cls: "bg-sky-100 text-sky-800" },
  in_progress: { text: "En curso",    cls: "bg-amber-100 text-amber-800" },
  resolved:    { text: "Resuelto",    cls: "bg-emerald-100 text-emerald-800" },
  closed:      { text: "Cerrado",     cls: "bg-slate-100 text-slate-500" },
};

const PRIORITY_LABEL: Record<TicketPriority, { text: string; cls: string }> = {
  low:    { text: "Baja",    cls: "text-slate-400" },
  normal: { text: "Normal",  cls: "text-slate-600" },
  high:   { text: "Alta",    cls: "text-amber-600" },
  urgent: { text: "Urgente", cls: "text-red-600 font-semibold" },
};

const CATEGORY_LABEL: Record<string, string> = {
  facturacion: "Facturación",
  tecnico:     "Técnico",
  contenido:   "Contenido",
  cuenta:      "Cuenta",
  general:     "General",
};

const dateFormatter = new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function fmt(d: string) { return dateFormatter.format(new Date(d)); }

export default function AdminTicketInbox({ initialTickets }: { initialTickets: AdminTicket[] }) {
  const [tickets, setTickets] = useState<AdminTicket[]>(initialTickets);
  const [selected, setSelected] = useState<AdminTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [reply, setReply] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<TicketStatus | "all">("open");

  const loadMessages = useCallback(async (ticket: AdminTicket) => {
    setLoadingMsgs(true);
    setMessages([]);
    const res = await fetch(`/api/admin/tickets/${ticket.id}`);
    const json = await res.json();
    setMessages(json.messages ?? []);
    setLoadingMsgs(false);
  }, []);

  function openTicket(ticket: AdminTicket) {
    setSelected(ticket);
    setReply("");
    setIsInternal(false);
    setError(null);
    loadMessages(ticket);
  }

  async function sendReply() {
    if (!selected || !reply.trim()) return;
    setSending(true);
    setError(null);
    const res = await fetch(`/api/admin/tickets/${selected.id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: reply.trim(), is_internal: isInternal }),
    });
    if (!res.ok) {
      setError("No se pudo enviar el mensaje.");
      setSending(false);
      return;
    }
    setReply("");
    setSending(false);
    await loadMessages(selected);
    const updatedTickets = await fetch("/api/admin/tickets").then(r => r.json());
    setTickets(updatedTickets.tickets ?? tickets);
  }

  async function updateStatus(ticketId: number, status: TicketStatus) {
    await fetch(`/api/admin/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t));
    if (selected?.id === ticketId) setSelected(prev => prev ? { ...prev, status } : null);
  }

  async function updatePriority(ticketId: number, priority: TicketPriority) {
    await fetch(`/api/admin/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority }),
    });
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, priority } : t));
    if (selected?.id === ticketId) setSelected(prev => prev ? { ...prev, priority } : null);
  }

  const filtered = filterStatus === "all" ? tickets : tickets.filter(t => t.status === filterStatus);

  return (
    <div className="mt-6 flex gap-6 rounded-2xl border border-slate-200 overflow-hidden" style={{ minHeight: 480 }}>
      {/* Lista de tickets */}
      <div className="w-80 shrink-0 border-r border-slate-200 flex flex-col">
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as TicketStatus | "all")}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand"
          >
            <option value="all">Todos</option>
            <option value="open">Abiertos</option>
            <option value="in_progress">En curso</option>
            <option value="resolved">Resueltos</option>
            <option value="closed">Cerrados</option>
          </select>
          <span className="text-xs text-slate-400">{filtered.length} tickets</span>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filtered.length === 0 && (
            <p className="px-4 py-8 text-center text-xs text-slate-400">Sin tickets en este estado</p>
          )}
          {filtered.map(ticket => {
            const st = STATUS_LABEL[ticket.status];
            const pr = PRIORITY_LABEL[ticket.priority];
            return (
              <button
                key={ticket.id}
                onClick={() => openTicket(ticket)}
                className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${selected?.id === ticket.id ? "bg-brand/5 border-l-2 border-brand" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-slate-400">{ticket.ticket_code}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${st.cls}`}>{st.text}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-800 line-clamp-1">{ticket.subject}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400">{ticket.company?.name ?? "Empresa"} · {CATEGORY_LABEL[ticket.category]}</span>
                  <span className={`text-[10px] ${pr.cls}`}>{pr.text}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detalle del ticket */}
      {!selected ? (
        <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
          Selecciona un ticket para ver el hilo
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Cabecera */}
          <div className="border-b border-slate-200 px-5 py-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-mono text-slate-400">{selected.ticket_code} · {selected.company?.ref_code}</p>
              <h3 className="mt-0.5 font-semibold text-brand-dark text-sm">{selected.subject}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{selected.company?.name} · {CATEGORY_LABEL[selected.category]} · Abierto {fmt(selected.created_at)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={selected.priority}
                onChange={e => updatePriority(selected.id, e.target.value as TicketPriority)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand"
              >
                <option value="low">Baja</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
              <select
                value={selected.status}
                onChange={e => updateStatus(selected.id, e.target.value as TicketStatus)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand"
              >
                <option value="open">Abierto</option>
                <option value="in_progress">En curso</option>
                <option value="resolved">Resuelto</option>
                <option value="closed">Cerrado</option>
              </select>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {loadingMsgs ? (
              <p className="text-xs text-slate-400 text-center py-8">Cargando mensajes…</p>
            ) : messages.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Sin mensajes en este ticket</p>
            ) : messages.map(msg => (
              <div
                key={msg.id}
                className={`rounded-xl px-4 py-3 text-sm max-w-[90%] ${
                  msg.is_internal
                    ? "bg-amber-50 border border-amber-200 text-amber-900 ml-auto"
                    : msg.author_id === selected.company_id
                      ? "bg-slate-100 text-slate-800"
                      : "bg-brand/10 text-brand-dark ml-auto"
                }`}
              >
                {msg.is_internal && (
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 mb-1">Nota interna</p>
                )}
                <p className="whitespace-pre-wrap">{msg.body}</p>
                <p className="mt-1.5 text-[10px] text-slate-400">{fmt(msg.created_at)}</p>
              </div>
            ))}
          </div>

          {/* Responder */}
          <div className="border-t border-slate-200 px-5 py-4">
            {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
            <div className="flex items-center gap-3 mb-2">
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={e => setIsInternal(e.target.checked)}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                />
                Nota interna (solo admin)
              </label>
            </div>
            <div className="flex gap-2">
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder={isInternal ? "Escribe una nota interna…" : "Escribe tu respuesta al cliente…"}
                rows={3}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm resize-none focus:outline-none focus:border-brand ${isInternal ? "border-amber-300 bg-amber-50" : "border-slate-300"}`}
              />
              <button
                onClick={sendReply}
                disabled={sending || !reply.trim()}
                className="self-end rounded-xl bg-brand-dark text-white px-4 py-2 text-sm font-medium hover:bg-brand disabled:opacity-40"
              >
                {sending ? "Enviando…" : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
