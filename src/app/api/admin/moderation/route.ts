import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || (!isAdminEmail(user.email) && user.user_metadata?.role !== "admin")) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const id = Number(body.id);
  const action = body.action === "approve" ? "published" : body.action === "reject" ? "rejected" : null;
  if (!Number.isInteger(id) || !action) return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Servicio de administración no configurado" }, { status: 503 });
  const { error } = await admin.from("mkt_listings").update({ status: action, rejection_reason: action === "rejected" ? "No cumple las normas de publicación." : null, updated_at: new Date().toISOString() }).eq("id", id).eq("status", "pending_review");
  if (error) return NextResponse.json({ error: "No se pudo actualizar el anuncio" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
