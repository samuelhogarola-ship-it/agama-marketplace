"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ContactSellerButton({ productId, sellerId }: { productId: number; sellerId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function contact() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/ingresar?next=/mensajes`);
      return;
    }
    if (user.id === sellerId) {
      router.push("/panel");
      return;
    }
    // Reusar conversación existente o crearla
    const { data: existing } = await supabase
      .from("mkt_conversations")
      .select("id")
      .eq("product_id", productId)
      .eq("buyer_id", user.id)
      .maybeSingle();

    if (existing) {
      router.push(`/mensajes/${existing.id}`);
      return;
    }
    const { data: conv, error } = await supabase
      .from("mkt_conversations")
      .insert({ product_id: productId, buyer_id: user.id, seller_id: sellerId })
      .select()
      .single();
    if (error || !conv) {
      setLoading(false);
      return;
    }
    router.push(`/mensajes/${conv.id}`);
  }

  return (
    <button
      onClick={contact}
      disabled={loading}
      className="mt-3 w-full rounded-full bg-brand text-white py-3 font-medium hover:bg-brand-dark disabled:opacity-50"
    >
      {loading ? "Abriendo chat…" : "Contactar al vendedor"}
    </button>
  );
}
