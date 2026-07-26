"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type ConvRow = {
  id: number;
  last_message_at: string;
  buyer_id: string;
  seller_id: string;
  product: { title: string } | null;
  buyer: { company_name: string } | null;
  seller: { company_name: string } | null;
};

export default function MensajesPage() {
  const [convs, setConvs] = useState<ConvRow[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setMe(user.id);
      const { data } = await supabase
        .from("mkt_conversations")
        .select("id, last_message_at, buyer_id, seller_id, product:mkt_products(title), buyer:mkt_profiles!mkt_conversations_buyer_id_fkey(company_name), seller:mkt_profiles!mkt_conversations_seller_id_fkey(company_name)")
        .order("last_message_at", { ascending: false });
      setConvs((data as unknown as ConvRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="mx-auto max-w-2xl px-4 py-16 text-slate-400">Cargando…</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-800">Mensajes</h1>
      <div className="mt-6 space-y-2">
        {convs.length === 0 && (
          <p className="text-slate-500 rounded-xl border border-dashed border-slate-300 p-10 text-center">
            No tienes conversaciones todavía.
          </p>
        )}
        {convs.map((c) => {
          const other = c.buyer_id === me ? c.seller : c.buyer;
          return (
            <Link
              key={c.id}
              href={`/mensajes/${c.id}`}
              className="block rounded-xl border border-slate-200 p-4 hover:border-brand"
            >
              <p className="font-semibold text-slate-800">{other?.company_name ?? "Empresa"}</p>
              <p className="text-sm text-slate-500 truncate">{c.product?.title ?? "Conversación"}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
