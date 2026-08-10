"use client";

import { useState, useEffect, useRef } from "react";
import { photoUrl } from "@/lib/types";

type Photo = { storage_path: string };

type QueueItem = {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: string;
  location: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  company?: { name?: string } | null;
  photos?: Photo[];
};

const REJECT_PRESETS = [
  "Categoría incorrecta — mueve el anuncio a la categoría adecuada.",
  "Datos de contacto en el cuerpo del anuncio — usa los campos específicos de contacto.",
  "Producto prohibido: pigmentos, masterbatch o aditivos no están permitidos en la plataforma.",
  "Imagen con datos de contacto incrustados — sube fotos sin texto superpuesto.",
  "Contenido insuficiente — la descripción debe detallar especificaciones, materiales y condiciones.",
  "Precio o condiciones de venta incoherentes — revisa los datos del anuncio.",
];

export default function AdminQueue({
  initialItems,
  readOnly = false,
}: {
  initialItems: QueueItem[];
  readOnly?: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState<number | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [error, setError] = useState<string | null>(null);

  async function approve(id: number) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "approve" }),
      });
      if (res.ok) setItems((cur) => cur.filter((item) => item.id !== id));
      else setError(`Error al aprobar (${res.status})`);
    } catch {
      setError("Error de conexión al aprobar");
    }
    setBusy(null);
  }

  async function submitReject() {
    if (!rejectId || !rejectReason.trim()) return;
    setBusy(rejectId);
    setError(null);
    try {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rejectId, action: "reject", reason: rejectReason.trim() }),
      });
      if (res.ok) {
        setItems((cur) => cur.filter((item) => item.id !== rejectId));
        setRejectId(null);
        setRejectReason("");
      } else setError(`Error al rechazar (${res.status})`);
    } catch {
      setError("Error de conexión al rechazar");
    }
    setBusy(null);
  }

  if (items.length === 0 && !error) {
    return (
      <div className="mt-10 border-t border-slate-200 py-16 text-center text-slate-500">
        La cola está limpia. 🎉
      </div>
    );
  }

  return (
    <>
      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="mt-10 space-y-8">
        {items.map((item) => {
          const photos = (item.photos ?? []) as Photo[];
          return (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              {photos.length > 0 && (
                <div className="mb-4 flex gap-2 overflow-x-auto">
                  {photos.slice(0, 5).map((photo, i) => (
                    <a
                      key={i}
                      href={photoUrl(photo.storage_path)}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoUrl(photo.storage_path)}
                        alt={`Foto ${i + 1}`}
                        className="h-28 w-28 rounded-lg object-cover ring-1 ring-slate-200 hover:ring-brand"
                      />
                    </a>
                  ))}
                </div>
              )}

              <div className="flex flex-col justify-between gap-5 lg:flex-row">
                <div className="max-w-3xl min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {item.company?.name ?? "Empresa"} · {item.category}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-brand-dark">
                    {item.title}
                  </h2>
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>
                  {item.location && (
                    <p className="mt-3 text-xs text-slate-500">{item.location}</p>
                  )}
                </div>

                <div className="flex shrink-0 items-start gap-3">
                  {readOnly ? (
                    <span className="rounded-full bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-500">
                      Acciones disponibles con sesión admin
                    </span>
                  ) : (
                    <>
                      <button
                        disabled={busy === item.id}
                        onClick={() => {
                          setRejectId(item.id);
                          setRejectReason("");
                        }}
                        className="rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        Rechazar
                      </button>
                      <button
                        disabled={busy === item.id}
                        onClick={() => approve(item.id)}
                        className="rounded-full bg-brand-dark px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand disabled:opacity-50"
                      >
                        {busy === item.id ? "Procesando…" : "Aprobar"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {rejectId !== null && (
        <RejectDialog
          rejectId={rejectId}
          rejectReason={rejectReason}
          setRejectReason={setRejectReason}
          busy={busy}
          onClose={() => setRejectId(null)}
          onSubmit={submitReject}
        />
      )}
    </>
  );
}

function RejectDialog({ rejectId, rejectReason, setRejectReason, busy, onClose, onSubmit }: {
  rejectId: number;
  rejectReason: string;
  setRejectReason: (v: string) => void;
  busy: number | null;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const textarea = el.querySelector("textarea");
    textarea?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const focusables = el!.querySelectorAll<HTMLElement>("button:not([disabled]), textarea, [tabindex]:not([tabindex='-1'])");
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <div
            ref={dialogRef}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="reject-title"
              className="text-lg font-semibold text-brand-dark"
            >
              Motivo del rechazo
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Este texto se muestra al anunciante para que corrija su publicación.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {REJECT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRejectReason(preset)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    rejectReason === preset
                      ? "border-red-300 bg-red-50 text-red-700"
                      : "border-slate-200 text-slate-600 hover:border-red-200 hover:text-red-700"
                  }`}
                >
                  {preset.split(" — ")[0]}
                </button>
              ))}
            </div>

            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Escribe el motivo del rechazo o selecciona una opción de arriba…"
              className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:border-brand"
            />
            <p className="mt-1 text-xs text-slate-400">
              {rejectReason.length} caracteres (mínimo 20)
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={rejectReason.trim().length < 20 || busy === rejectId}
                onClick={onSubmit}
                className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busy === rejectId ? "Rechazando…" : "Confirmar rechazo"}
              </button>
            </div>
          </div>
        </div>
  );
}
