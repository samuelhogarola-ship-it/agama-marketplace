import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/csrf";
import { sendTicketReplyToAdmin } from "@/lib/email";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = checkOrigin(request);
  if (originError) return originError;

  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const message = String(body?.message ?? "").trim();
  if (!message || message.length < 1 || message.length > 5000)
    return NextResponse.json({ error: "Mensaje inválido." }, { status: 400 });

  const { error } = await supabase
    .from("mkt_ticket_messages")
    .insert({ ticket_id: Number(id), author_id: user.id, body: message, is_internal: false });

  if (error) return NextResponse.json({ error: "No se pudo enviar el mensaje." }, { status: 500 });

  supabase
    .from("mkt_tickets")
    .select("ticket_code, subject")
    .eq("id", id)
    .single()
    .then(({ data }) => {
      if (data) {
        sendTicketReplyToAdmin({
          ticketCode: data.ticket_code,
          subject: data.subject,
          message,
          userEmail: user.email ?? "desconocido",
        }).catch(() => {});
      }
    });

  return NextResponse.json({ ok: true });
}
