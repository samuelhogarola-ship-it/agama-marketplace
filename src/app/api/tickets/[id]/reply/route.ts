import { NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/csrf";
import { isRateLimited } from "@/lib/rate-limit";
import { sendTicketReplyToAdmin } from "@/lib/email";

// Cada respuesta notifica al admin por correo: limitamos la frecuencia.
const REPLY_MAX = 10;
const REPLY_WINDOW_MS = 10 * 60_000;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = checkOrigin(request);
  if (originError) return originError;

  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (isRateLimited({ key: `ticket-reply:${user.id}`, max: REPLY_MAX, windowMs: REPLY_WINDOW_MS }))
    return NextResponse.json(
      { error: "Demasiadas respuestas seguidas. Espera unos minutos." },
      { status: 429 }
    );

  const body = await request.json().catch(() => null);
  const message = String(body?.message ?? "").trim();
  if (!message || message.length < 1 || message.length > 5000)
    return NextResponse.json({ error: "Mensaje inválido." }, { status: 400 });

  const { error } = await supabase
    .from("mkt_ticket_messages")
    .insert({ ticket_id: Number(id), author_id: user.id, body: message, is_internal: false });

  if (error) return NextResponse.json({ error: "No se pudo enviar el mensaje." }, { status: 500 });

  // La notificación no debe bloquear la respuesta, pero tampoco morir con ella:
  // `after` la ejecuta tras responder y mantiene viva la invocación, cosa que
  // una promesa suelta no garantiza en serverless.
  after(async () => {
    try {
      const { data, error: ticketError } = await supabase
        .from("mkt_tickets")
        .select("ticket_code, subject")
        .eq("id", id)
        .single();

      // supabase-js no lanza: el fallo viene en `error` y hay que mirarlo.
      if (ticketError) {
        console.error("[tickets reply] no se pudo leer el ticket:", ticketError);
        return;
      }
      if (!data) return;

      await sendTicketReplyToAdmin({
        ticketCode: data.ticket_code,
        subject: data.subject,
        message,
        userEmail: user.email ?? "desconocido",
      });
    } catch (err) {
      console.error("[tickets reply] notificación al admin falló:", err);
    }
  });

  return NextResponse.json({ ok: true });
}
