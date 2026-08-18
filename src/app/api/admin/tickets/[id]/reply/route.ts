import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminUser } from "@/lib/supabase/admin";
import { checkOrigin } from "@/lib/csrf";
import { sendTicketReplyToUser } from "@/lib/email";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = checkOrigin(request);
  if (originError) return originError;

  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdminUser(user)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Servicio no configurado." }, { status: 503 });

  const body = await request.json().catch(() => null);
  const message = String(body?.message ?? "").trim();
  const isInternal = body?.is_internal === true;

  if (!message || message.length < 1 || message.length > 5000)
    return NextResponse.json({ error: "Mensaje inválido." }, { status: 400 });

  const { error } = await admin
    .from("mkt_ticket_messages")
    .insert({ ticket_id: Number(id), author_id: user!.id, body: message, is_internal: isInternal });

  if (error) return NextResponse.json({ error: "No se pudo enviar el mensaje." }, { status: 500 });

  if (!isInternal) {
    await admin.from("mkt_tickets").update({ status: "in_progress" }).eq("id", id).eq("status", "open");

    admin
      .from("mkt_tickets")
      .select("ticket_code, subject, company_id")
      .eq("id", id)
      .single()
      .then(async ({ data }) => {
        if (!data) return;
        const { data: vendorUser } = await admin.auth.admin.getUserById(data.company_id);
        const vendorEmail = vendorUser?.user?.email;
        if (vendorEmail) {
          sendTicketReplyToUser({
            ticketCode: data.ticket_code,
            subject: data.subject,
            message,
            userEmail: vendorEmail,
          }).catch(() => {});
        }
      });
  }

  return NextResponse.json({ ok: true });
}
