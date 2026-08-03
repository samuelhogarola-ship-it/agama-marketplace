import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MODEL = "claude-haiku-4-5-20251001";

const BANNED_RE =
  /\b(pigmentos?|masterbatch|master[\s-]*batch|aditivos?|colorantes?|concentrados?\s+de\s+color|color\s*concentrate|additives?)\b/i;
const CONTACT_RE =
  /\b\d{10}\b|\+?52[\s.-]?\d{10}|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|(wa\.me|whats\s*app)/i;

interface ModResult {
  verdict: "approve" | "reject" | "review";
  violations: string[];
  confidence: number;
  reason_es: string | null;
}

async function callClaude(messages: unknown[], maxTokens = 300): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data = await res.json();
  return (data.content[0].text as string).trim();
}

async function classifyText(title: string, description: string, category: string): Promise<ModResult> {
  const raw = await callClaude([
    {
      role: "user",
      content: `Eres el moderador de TodoPlástico, plataforma B2B gratuita de la industria plástica en México, impulsada por AGAMA.

Anuncio:
Título: ${title}
Categoría: ${category}
Descripción: ${description}

PERMITIDO: plásticos (envases, tarimas, bolsas, tubería, perfiles, láminas, maquinaria, resinas PET/PE/PP/PVC/PS/ABS, molido, pacas), servicios de transformación plástica.
PROHIBIDO:
1. competencia_agama: pigmentos, masterbatch, concentrados de color, aditivos (UV, antioxidantes, retardantes, deslizantes).
2. fuera_de_tema: ajeno a industria plástica.
3. datos_contacto: teléfono, email, WhatsApp en el texto.
4. contenido_ilegal: falsificaciones, residuos peligrosos.

Devuelve SOLO JSON sin markdown:
{"verdict":"approve","violations":[],"confidence":0.95,"reason_es":null}`,
    },
  ]);
  return JSON.parse(raw);
}

async function classifyImages(urls: string[], title: string): Promise<ModResult> {
  const raw = await callClaude(
    [
      {
        role: "user",
        content: [
          ...urls.map((url) => ({ type: "image", source: { type: "url", url } })),
          {
            type: "text",
            text: `Fotos de "${title}" en TodoPlástico (plásticos B2B México). ¿Muestran pigmentos, masterbatch, aditivos, productos ajenos al plástico, o datos de contacto incrustados en la imagen?
Devuelve SOLO JSON: {"verdict":"approve","violations":[],"confidence":0.95,"reason_es":null}`,
          },
        ],
      },
    ],
    150,
  );
  return JSON.parse(raw);
}

export async function POST(req: NextRequest) {
  const { listing_id } = await req.json().catch(() => ({}));
  if (!listing_id) return NextResponse.json({ error: "listing_id requerido" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Moderación no configurada" }, { status: 503 });

  const { data: product } = await supabase
    .from("mkt_listings")
    .select("*, photos:mkt_listing_photos(storage_path, position)")
    .eq("id", listing_id)
    .eq("company_id", user.id)
    .single();

  if (!product) return NextResponse.json({ error: "Anuncio no encontrado" }, { status: 404 });
  if (product.status === "blocked") return NextResponse.json({ error: "Anuncio bloqueado" }, { status: 403 });

  const fullText = `${product.title} ${product.description}`;

  // Layer 1: hard regex
  const hardViolations: string[] = [];
  if (BANNED_RE.test(fullText)) hardViolations.push("competencia_pigmentos_masterbatch_aditivos");
  if (CONTACT_RE.test(fullText)) hardViolations.push("datos_contacto");

  if (hardViolations.length > 0) {
    const reason = hardViolations.includes("competencia_pigmentos_masterbatch_aditivos")
      ? "No se permiten pigmentos, masterbatch, aditivos ni colorantes."
      : "No se permiten teléfonos, emails ni WhatsApp en la publicación.";
    await admin.rpc("mkt_submit_listing", { p_listing_id: listing_id, p_verdict: "reject", p_reason: reason });
    await admin.from("mkt_moderation_events").insert({ listing_id, verdict: "reject", violations: hardViolations, reason, source: "rules", confidence: 1.0 });
    return NextResponse.json({ verdict: "reject", reason });
  }

  // Sin IA configurada no se publica: queda pendiente para revision humana.
  if (!process.env.ANTHROPIC_API_KEY) {
    await admin.rpc("mkt_submit_listing", { p_listing_id: listing_id, p_verdict: "pending" });
    await admin.from("mkt_moderation_events").insert({ listing_id, verdict: "review", violations: [], reason: "Revisión IA pendiente de configuración", source: "rules", confidence: 0 });
    return NextResponse.json({ verdict: "review", reason: "Tu publicación está pendiente de revisión." });
  }

  let textResult: ModResult;
  try {
    textResult = await classifyText(product.title, product.description, product.category);
  } catch {
    await admin.rpc("mkt_submit_listing", { p_listing_id: listing_id, p_verdict: "pending" });
    await admin.from("mkt_moderation_events").insert({ listing_id, verdict: "review", violations: [], reason: "Error en clasificador IA", source: "ai", confidence: 0 });
    return NextResponse.json({ verdict: "review", reason: "Tu publicación está pendiente de revisión." });
  }

  if (textResult.verdict === "reject" && textResult.confidence >= 0.8) {
    await admin.rpc("mkt_submit_listing", { p_listing_id: listing_id, p_verdict: "reject", p_reason: textResult.reason_es });
    await admin.from("mkt_moderation_events").insert({ listing_id, verdict: "reject", violations: textResult.violations, reason: textResult.reason_es, source: "ai", confidence: textResult.confidence, model: MODEL });
    return NextResponse.json({ verdict: "reject", reason: textResult.reason_es });
  }

  if (textResult.verdict !== "approve" || textResult.confidence < 0.75) {
    await admin.rpc("mkt_submit_listing", { p_listing_id: listing_id, p_verdict: "pending" });
    await admin.from("mkt_moderation_events").insert({ listing_id, verdict: "review", violations: textResult.violations, reason: textResult.reason_es, source: "ai", confidence: textResult.confidence, model: MODEL });
    return NextResponse.json({ verdict: "review", reason: "Tu publicación está siendo revisada." });
  }

  // Layer 3: Claude Haiku vision
  const photos = ((product.photos ?? []) as { storage_path: string; position: number }[])
    .sort((a, b) => a.position - b.position)
    .slice(0, 5);
  const photoUrls = photos.map(
    (p) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/mkt-photos/${p.storage_path}`,
  );

  if (photoUrls.length > 0) {
    try {
      const visionResult = await classifyImages(photoUrls, product.title);
      if (visionResult.verdict === "reject" && visionResult.confidence >= 0.8) {
        await admin.rpc("mkt_submit_listing", { p_listing_id: listing_id, p_verdict: "reject", p_reason: visionResult.reason_es });
        await admin.from("mkt_moderation_events").insert({ listing_id, verdict: "reject", violations: visionResult.violations, reason: visionResult.reason_es, source: "ai", confidence: visionResult.confidence, model: MODEL });
        return NextResponse.json({ verdict: "reject", reason: visionResult.reason_es });
      }
      if (visionResult.verdict === "review") {
        await admin.rpc("mkt_submit_listing", { p_listing_id: listing_id, p_verdict: "pending" });
        await admin.from("mkt_moderation_events").insert({ listing_id, verdict: "review", violations: visionResult.violations, reason: visionResult.reason_es, source: "ai", confidence: visionResult.confidence, model: MODEL });
        return NextResponse.json({ verdict: "review", reason: "Las imágenes están siendo revisadas." });
      }
    } catch {
      await admin.rpc("mkt_submit_listing", { p_listing_id: listing_id, p_verdict: "pending" });
      await admin.from("mkt_moderation_events").insert({ listing_id, verdict: "review", violations: [], reason: "Error en revisión visual", source: "ai", confidence: 0, model: MODEL });
      return NextResponse.json({ verdict: "review", reason: "Las imágenes están pendientes de revisión." });
    }
  }

  // Solo el cliente service-role puede publicar después de completar todas las capas.
  await admin.rpc("mkt_submit_listing", { p_listing_id: listing_id, p_verdict: "approve" });
  await admin.from("mkt_moderation_events").insert({ listing_id, verdict: "approve", violations: [], reason: null, source: "ai", confidence: textResult.confidence, model: MODEL });
  return NextResponse.json({ verdict: "approve" });
}
