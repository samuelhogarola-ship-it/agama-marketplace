import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/csrf";

const VALID_CATEGORIES = new Set(["facturacion", "tecnico", "contenido", "cuenta", "general"]);

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data, error } = await supabase
    .from("mkt_tickets")
    .select("id, ticket_code, category, subject, status, priority, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: "Error al cargar tickets." }, { status: 500 });
  return NextResponse.json({ tickets: data ?? [] });
}

export async function POST(request: Request) {
  const originError = checkOrigin(request);
  if (originError) return originError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });

  const subject = String(body.subject ?? "").trim();
  const category = String(body.category ?? "general");
  const message = String(body.message ?? "").trim();

  if (subject.length < 5 || subject.length > 200)
    return NextResponse.json({ error: "El asunto debe tener entre 5 y 200 caracteres." }, { status: 400 });
  if (!VALID_CATEGORIES.has(category))
    return NextResponse.json({ error: "Categoría inválida." }, { status: 400 });
  if (message.length < 10 || message.length > 5000)
    return NextResponse.json({ error: "El mensaje debe tener entre 10 y 5000 caracteres." }, { status: 400 });

  // Ensure company row exists (created lazily if missing)
  const { data: existingCompany } = await supabase
    .from("mkt_companies")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existingCompany) {
    const rawName = user.email?.split("@")[0] ?? "empresa";
    const name = rawName.slice(0, 120);
    const slug = `${rawName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 54)}-${user.id.slice(0, 6)}`;
    const { error: companyErr } = await supabase
      .from("mkt_companies")
      .insert({ id: user.id, name, slug });
    if (companyErr) {
      console.error("[tickets POST] company create error:", companyErr);
      return NextResponse.json({ error: "No se pudo crear el perfil de empresa." }, { status: 500 });
    }
  }

  const { data: ticket, error: ticketError } = await supabase
    .from("mkt_tickets")
    .insert({ company_id: user.id, category, subject, ticket_code: "" })
    .select("id, ticket_code")
    .single();

  if (ticketError) {
    console.error("[tickets POST] insert error:", ticketError);
    return NextResponse.json({ error: "No se pudo crear el ticket." }, { status: 500 });
  }

  await supabase
    .from("mkt_ticket_messages")
    .insert({ ticket_id: ticket.id, author_id: user.id, body: message, is_internal: false });

  return NextResponse.json({ ok: true, ticket });
}
