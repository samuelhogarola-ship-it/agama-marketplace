"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("mkt-cookie-consent")) setVisible(true);
  }, []);

  function decide(value: "accepted" | "essential") {
    localStorage.setItem("mkt-cookie-consent", value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur p-4">
      <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-start md:items-center gap-4 text-sm">
        <p className="text-slate-600 flex-1">
          Usamos cookies esenciales para el funcionamiento del sitio (sesión de usuario). No usamos cookies
          publicitarias. Más información en la{" "}
          <Link href="/legal/cookies" className="text-brand underline">política de cookies</Link>.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => decide("essential")}
            className="rounded-full border border-slate-300 px-4 py-2 hover:bg-slate-50"
          >
            Solo esenciales
          </button>
          <button
            onClick={() => decide("accepted")}
            className="rounded-full bg-brand-dark text-white px-4 py-2 hover:bg-brand-navy"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
