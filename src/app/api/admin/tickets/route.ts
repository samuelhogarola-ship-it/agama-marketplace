import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminUser } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdminUser(user)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Servicio no configurado." }, { status: 503 });

  const { data, error } = await admin
    .from("mkt_tickets")
    .select("id, ticket_code, company_id, category, subject, status, priority, created_at, updated_at, company:mkt_companies(name, ref_code)")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: "Error al cargar tickets." }, { status: 500 });
  return NextResponse.json({ tickets: data ?? [] });
}
