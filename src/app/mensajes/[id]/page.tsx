"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";

export default function ConversacionPage() {
  const { id } = useParams<{ id: string }>();
  const convId = Number(id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [warn, setWarn] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setMe(user.id);
    const { data } = await supabase
      .from("mkt_messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(200);
    setMessages((data as Message[]) ?? []);
  }, [convId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setWarn(null);
    const supabase = createClient();
    // La moderación corre en BD (trigger); si el mensaje viola las reglas queda status=rejected
    const { data, error } = await supabase
      .from("mkt_messages")
      .insert({ conversation_id: convId, sender_id: me, body: text })
      .select()
      .single();
    if (error) {
      setWarn("No se pudo enviar el mensaje.");
      return;
    }
    if (data?.status === "rejected") {
      setWarn("Mensaje bloqueado por moderación: solo se permite hablar de productos de plástico y sin datos de contacto externos.");
    }
    setBody("");
    load();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 flex flex-col" style={{ minHeight: "70vh" }}>
      <h1 className="text-lg font-bold text-slate-800">Conversación</h1>
      <div className="mt-4 flex-1 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-4 bg-slate-50" style={{ maxHeight: "55vh" }}>
        {messages.filter((m) => m.status !== "rejected" || m.sender_id === me).map((m) => (
          <div key={m.id} className={`flex ${m.sender_id === me ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                m.status === "rejected"
                  ? "bg-red-100 text-red-500 line-through"
                  : m.sender_id === me
                    ? "bg-brand text-white"
                    : "bg-white border border-slate-200 text-slate-700"
              }`}
            >
              {m.body}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {warn && <p className="mt-2 text-sm text-red-600">{warn}</p>}
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          placeholder="Escribe un mensaje…"
          className="flex-1 rounded-full border border-slate-300 px-4 py-2.5 focus:outline-none focus:border-brand"
        />
        <button className="rounded-full bg-brand text-white px-6 py-2.5 font-medium hover:bg-brand-dark">Enviar</button>
      </form>
    </div>
  );
}
