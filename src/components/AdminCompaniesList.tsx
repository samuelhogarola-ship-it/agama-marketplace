"use client";

import { useState } from "react";

type Company = {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  plan: string;
  is_verified: boolean;
  status: string;
  created_at: string;
};

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default function AdminCompaniesList({
  initialCompanies,
}: {
  initialCompanies: Company[];
}) {
  const [companies, setCompanies] = useState(initialCompanies);
  const [busy, setBusy] = useState<string | null>(null);

  async function act(id: string, action: "verify" | "block" | "unblock") {
    setBusy(id);
    const res = await fetch("/api/admin/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    if (res.ok) {
      setCompanies((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          if (action === "verify") return { ...c, is_verified: true };
          if (action === "block") return { ...c, status: "blocked" };
          if (action === "unblock") return { ...c, status: "active" };
          return c;
        })
      );
    }
    setBusy(null);
  }

  if (companies.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-500">
        Todavía no hay empresas registradas.
      </p>
    );
  }

  return (
    <div className="divide-y divide-slate-200">
      {companies.map((company) => (
        <div
          key={company.id}
          className={`flex flex-wrap items-center justify-between gap-4 py-4 ${
            company.status === "blocked" ? "opacity-60" : ""
          }`}
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-brand-dark">
              {company.name}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {company.location ?? "Sin ubicación"} · Alta{" "}
              {dateFormatter.format(new Date(company.created_at))}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {company.is_verified && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                Verificada
              </span>
            )}
            {company.status === "blocked" && (
              <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                Bloqueada
              </span>
            )}
            <span className="text-xs capitalize text-slate-400">
              {company.plan}
            </span>
            {!company.is_verified && (
              <button
                disabled={busy === company.id}
                onClick={() => act(company.id, "verify")}
                className="rounded-full border border-emerald-200 px-3 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
              >
                Verificar
              </button>
            )}
            {company.status === "active" ? (
              <button
                disabled={busy === company.id}
                onClick={() => act(company.id, "block")}
                className="rounded-full border border-red-200 px-3 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                Bloquear
              </button>
            ) : (
              <button
                disabled={busy === company.id}
                onClick={() => act(company.id, "unblock")}
                className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Reactivar
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
