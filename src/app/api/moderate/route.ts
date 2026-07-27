import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
      content: `Eres el moderador de AGAMA Marketplace, portal B2B de plásticos en México.

Producto:
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
            text: `Fotos de "${title}" en AGAMA Marketplace (plásticos B2B México). ¿Muestran pigmentos, masterbatch, aditivos, productos ajenos al plástico, o datos de contacto en carteles?
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
  const { product_id } = await req.json().catch(() => ({}));
  if (!product_id) return NextResponse.json({ error: "product_id requerido" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: product } = await supabase
    .from("mkt_products")
    .select("*, photos:mkt_product_photos(path, position)")
    .eq("id", product_id)
    .eq("owner_id", user.id)
    .single();

  if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  if (product.status === "blocked") return NextResponse.json({ error: "Producto bloqueado" }, { status: 403 });

  const fullText = `${product.title} ${product.description}`;

  // Layer 1: hard regex
  const hardViolations: string[] = [];
  if (BANNED_RE.test(fullText)) hardViolations.push("competencia_pigmentos_masterbatch_aditivos");
  if (CONTACT_RE.test(fullText)) hardViolations.push("datos_contacto");

  if (hardViolations.length > 0) {
    const reason = hardViolations.includes("competencia_pigmentos_masterbatch_aditivos")
      ? "No se permiten pigmentos, masterbatch, aditivos ni colorantes."
      : "No se permiten teléfonos, emails ni WhatsApp en la publicación.";
    await supabase.rpc("mkt_submit_product", { p_product_id: product_id, p_verdict: "reject", p_reason: reason });
    await supabase.from("mkt_moderation_events").insert({ product_id, verdict: "reject", violations: hardViolations, reason, source: "rules", confidence: 1.0 });
    return NextResponse.json({ verdict: "reject", reason });
  }

  // Layer 2: Claude Haiku text (skip gracefully if no key)
  if (!process.env.ANTHROPIC_API_KEY) {
    await supabase.rpc("mkt_submit_product", { p_product_id: product_id, p_verdict: "approve" });
    await supabase.from("mkt_moderation_events").insert({ product_id, verdict: "approve", violations: [], reason: null, source: "rules", confidence: 1.0 });
    return NextResponse.json({ verdict: "approve" });
  }

  let textResult: ModResult;
  try {
    textResult = await classifyText(product.title, product.description, product.category);
  } catch {
    await supabase.rpc("mkt_submit_product", { p_product_id: product_id, p_verdict: "pending" });
    await supabase.from("mkt_moderation_events").insert({ product_id, verdict: "review", violations: [], reason: "Error en clasificador IA", source: "ai", confidence: 0 });
    return NextResponse.json({ verdict: "review", reason: "Tu publicación está pendiente de revisión." });
  }

  if (textResult.verdict === "reject" && textResult.confidence >= 0.8) {
    await supabase.rpc("mkt_submit_product", { p_product_id: product_id, p_verdict: "reject", p_reason: textResult.reason_es });
    await supabase.from("mkt_moderation_events").insert({ product_id, verdict: "reject", violations: textResult.violations, reason: textResult.reason_es, source: "ai", confidence: textResult.confidence, model: MODEL });
    return NextResponse.json({ verdict: "reject", reason: textResult.reason_es });
  }

  if (textResult.verdict !== "approve" || textResult.confidence < 0.75) {
    await supabase.rpc("mkt_submit_product", { p_product_id: product_id, p_verdict: "pending" });
    await supabase.from("mkt_moderation_events").insert({ product_id, verdict: "review", violations: textResult.violations, reason: textResult.reason_es, source: "ai", confidence: textResult.confidence, model: MODEL });
    return NextResponse.json({ verdict: "review", reason: "Tu publicación está siendo revisada." });
  }

  // Layer 3: Claude Haiku vision
  const photos = ((product.photos ?? []) as { path: string; position: number }[])
    .sort((a, b) => a.position - b.position)
    .slice(0, 5);
  const photoUrls = photos.map(
    (p) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/mkt-photos/${p.path}`,
  );

  if (photoUrls.length > 0) {
    try {
      const visionResult = await classifyImages(photoUrls, product.title);
      if (visionResult.verdict === "reject" && visionResult.confidence >= 0.8) {
        await supabase.rpc("mkt_submit_product", { p_product_id: product_id, p_verdict: "reject", p_reason: visionResult.reason_es });
        await supabase.from("mkt_moderation_events").insert({ product_id, verdict: "reject", violations: visionResult.violations, reason: visionResult.reason_es, source: "ai", confidence: visionResult.confidence, model: MODEL });
        return NextResponse.json({ verdict: "reject", reason: visionResult.reason_es });
      }
      if (visionResult.verdict === "review") {
        await supabase.rpc("mkt_submit_product", { p_product_id: product_id, p_verdict: "pending" });
        await supabase.from("mkt_moderation_events").insert({ product_id, verdict: "review", violations: visionResult.violations, reason: visionResult.reason_es, source: "ai", confidence: visionResult.confidence, model: MODEL });
        return NextResponse.json({ verdict: "review", reason: "Las imágenes están siendo revisadas." });
      }
    } catch {
      // Vision failure is non-blocking
    }
  }

  // All passed → publish
  await supabase.rpc("mkt_submit_product", { p_product_id: product_id, p_verdict: "approve" });
  await supabase.from("mkt_moderation_events").insert({ product_id, verdict: "approve", violations: [], reason: null, source: "ai", confidence: textResult.confidence, model: MODEL });
  return NextResponse.json({ verdict: "approve" });
}
