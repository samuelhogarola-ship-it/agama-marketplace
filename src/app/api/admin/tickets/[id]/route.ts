import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminUser } from "@/lib/supabase/admin";
import { checkOrigin } from "@/lib/csrf";

const VALID_STATUSES = new Set(["open", "in_progress", "resolved", "closed"]);
const VALID_PRIORITIES = new Set(["low", "normal", "high", "urgent"]);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdminUser(user)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Servicio no configurado." }, { status: 503 });

  const [{ data: ticket }, { data: messages }] = await Promise.all([
    admin
      .from("mkt_tickets")
      .select("id, ticket_code, company_id, category, subject, status, priority, created_at, updated_at, company:mkt_companies(name, ref_code, email, phone)")
      .eq("id", id)
      .single(),
    admin
      .from("mkt_ticket_messages")
      .select("id, author_id, is_internal, body, created_at")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!ticket) return NextResponse.json({ error: "Ticket no encontrado." }, { status: 404 });
  return NextResponse.json({ ticket, messages: messages ?? [] });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = checkOrigin(request);
  if (originError) return originError;

  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdminUser(user)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Servicio no configurado." }, { status: 503 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (body.status && VALID_STATUSES.has(body.status)) {
    updates.status = body.status;
    if (body.status === "resolved") updates.resolved_at = new Date().toISOString();
  }
  if (body.priority && VALID_PRIORITIES.has(body.priority)) updates.priority = body.priority;
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "Nada que actualizar." }, { status: 400 });

  const { error } = await admin.from("mkt_tickets").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: "No se pudo actualizar el ticket." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
