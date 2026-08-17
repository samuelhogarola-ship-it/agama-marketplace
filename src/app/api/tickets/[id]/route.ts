import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const [{ data: ticket }, { data: messages }] = await Promise.all([
    supabase
      .from("mkt_tickets")
      .select("id, ticket_code, category, subject, status, priority, created_at, updated_at")
      .eq("id", id)
      .single(),
    supabase
      .from("mkt_ticket_messages")
      .select("id, author_id, is_internal, body, created_at")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!ticket) return NextResponse.json({ error: "Ticket no encontrado." }, { status: 404 });
  return NextResponse.json({ ticket, messages: messages ?? [] });
}
