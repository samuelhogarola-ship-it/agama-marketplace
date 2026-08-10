import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminUser } from "@/lib/supabase/admin";
import { checkOrigin } from "@/lib/csrf";

export async function POST(request: Request) {
  const originError = checkOrigin(request);
  if (originError) return originError;
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
  const { data: updated, error } = await admin.rpc("mkt_admin_decide_listing", {
    p_listing_id: id,
    p_decision: action === "published" ? "approve" : "reject",
    p_reason: action === "rejected" ? reason : null,
    p_admin_id: user.id,
  });
  if (error) return NextResponse.json({ error: "No se pudo registrar la decisión" }, { status: 500 });
  if (!updated) return NextResponse.json({ error: "El anuncio ya no está pendiente de revisión" }, { status: 409 });
  return NextResponse.json({ ok: true });
}
