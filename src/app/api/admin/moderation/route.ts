import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminUser } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const id = Number(body.id);
  const action = body.action === "approve" ? "published" : body.action === "reject" ? "rejected" : null;
  if (!Number.isInteger(id) || !action) return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";
  if (action === "rejected" && !reason) return NextResponse.json({ error: "Indica un motivo de rechazo" }, { status: 400 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Servicio de administración no configurado" }, { status: 503 });
  const finalReason = action === "rejected" ? reason : null;
  const { data: updated, error } = await admin.from("mkt_listings").update({ status: action, rejection_reason: finalReason, updated_at: new Date().toISOString() }).eq("id", id).eq("status", "pending_review").select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "No se pudo actualizar el anuncio" }, { status: 500 });
  if (!updated) return NextResponse.json({ error: "El anuncio ya no está pendiente de revisión" }, { status: 409 });
  const { error: eventError } = await admin.from("mkt_moderation_events").insert({ listing_id: id, verdict: action === "published" ? "approve" : "reject", violations: [], reason: finalReason, source: "human", confidence: 1.0, model: `admin:${user.id}` });
  if (eventError) return NextResponse.json({ error: "Anuncio actualizado, pero no se pudo registrar la decisión" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
