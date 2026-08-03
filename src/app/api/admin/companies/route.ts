import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminUser } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { id, action } = body;

  if (
    typeof id !== "string" ||
    !["verify", "block", "unblock"].includes(action)
  ) {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Servicio de administración no configurado" },
      { status: 503 }
    );
  }

  let update: Record<string, unknown> = {};
  if (action === "verify") update = { is_verified: true };
  if (action === "block") update = { status: "blocked" };
  if (action === "unblock") update = { status: "active" };

  const { error } = await admin
    .from("mkt_companies")
    .update(update)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
