import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminUser } from "@/lib/supabase/admin";
import { isRateLimited } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/csrf";
import { canRequestAiReview, combineAiReview, isReusableAiReview, type AiReviewResult } from "@/lib/moderation-workflow";

const MODEL = "gpt-4o-mini";

const BANNED_RE =
  /\b(pigmentos?|masterbatch|master[\s-]*batch|aditivos?|colorantes?|concentrados?\s+de\s+color|color\s*concentrate|additives?)\b/i;
const CONTACT_RE =
  /\b\d{10}\b|\+?52[\s.-]?\d{10}|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|(wa\.me|whats\s*app)/i;

type ModResult = AiReviewResult;

async function callOpenAI(messages: { role: string; content: unknown }[], maxTokens = 300): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      temperature: 0,
      messages,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json();
  return (data.choices[0].message.content as string).trim();
}

async function classifyText(title: string, description: string, category: string): Promise<ModResult> {
  const raw = await callOpenAI([
    {
      role: "system",
      content: `Eres el moderador de TodoPlástico, plataforma B2B gratuita de la industria plástica en México, impulsada por AGAMA.

PERMITIDO: plásticos (envases, tarimas, bolsas, tubería, perfiles, láminas, maquinaria, resinas PET/PE/PP/PVC/PS/ABS, molido, pacas), servicios de transformación plástica.
PROHIBIDO:
1. competencia_agama: pigmentos, masterbatch, concentrados de color, aditivos (UV, antioxidantes, retardantes, deslizantes).
2. fuera_de_tema: ajeno a industria plástica.
3. datos_contacto: teléfono, email, WhatsApp en el texto.
4. contenido_ilegal: falsificaciones, residuos peligrosos.

Responde SOLO con JSON válido sin markdown:
{"verdict":"approve","violations":[],"confidence":0.95,"reason_es":null}`,
    },
    {
      role: "user",
      content: `Título: ${title}\nCategoría: ${category}\nDescripción: ${description}`,
    },
  ]);
  return JSON.parse(raw);
}

async function classifyImages(urls: string[], title: string): Promise<ModResult> {
  const raw = await callOpenAI(
    [
      {
        role: "user",
        content: [
          ...urls.map((url) => ({ type: "image_url", image_url: { url } })),
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
  const originError = checkOrigin(req);
  if (originError) return originError;

  const { listing_id } = await req.json().catch(() => ({}));
  if (!listing_id) return NextResponse.json({ error: "listing_id requerido" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  if (isRateLimited({ key: `admin-ai-review:${user.id}`, max: 5, windowMs: 60_000 }))
    return NextResponse.json({ error: "Demasiadas solicitudes. Espera un minuto." }, { status: 429 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Moderación no configurada" }, { status: 503 });

  const { data: product } = await admin
    .from("mkt_listings")
    .select("*, photos:mkt_listing_photos(storage_path, position)")
    .eq("id", listing_id)
    .single();

  if (!product) return NextResponse.json({ error: "Anuncio no encontrado" }, { status: 404 });
  if (!canRequestAiReview({ isAdmin: true, status: product.status }))
    return NextResponse.json({ error: "El anuncio no está pendiente de revisión" }, { status: 409 });

  const { data: previousReview } = await admin
    .from("mkt_moderation_events")
    .select("verdict, violations, confidence, reason, created_at")
    .eq("listing_id", listing_id)
    .eq("source", "ai")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (previousReview && isReusableAiReview({ listingUpdatedAt: product.updated_at, reviewCreatedAt: previousReview.created_at })) {
    return NextResponse.json({
      verdict: previousReview.verdict,
      violations: previousReview.violations ?? [],
      confidence: Number(previousReview.confidence ?? 0),
      reason_es: previousReview.reason,
      cached: true,
    });
  }

  const fullText = `${product.title} ${product.description}`;

  // Layer 1: hard regex
  const hardViolations: string[] = [];
  if (BANNED_RE.test(fullText)) hardViolations.push("competencia_pigmentos_masterbatch_aditivos");
  if (CONTACT_RE.test(fullText)) hardViolations.push("datos_contacto");

  if (hardViolations.length > 0) {
    const reason = hardViolations.includes("competencia_pigmentos_masterbatch_aditivos")
      ? "No se permiten pigmentos, masterbatch, aditivos ni colorantes."
      : "No se permiten teléfonos, emails ni WhatsApp en la publicación.";
    await admin.from("mkt_moderation_events").insert({ listing_id, verdict: "reject", violations: hardViolations, reason, source: "rules", confidence: 1.0 });
    return NextResponse.json({ verdict: "reject", violations: hardViolations, confidence: 1, reason_es: reason });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Valoración IA no configurada" }, { status: 503 });
  }

  let textResult: ModResult;
  try {
    textResult = await classifyText(product.title, product.description, product.category);
  } catch {
    return NextResponse.json({ error: "No se pudo completar la valoración IA" }, { status: 502 });
  }

  // Layer 3: GPT-4o-mini vision
  const photos = ((product.photos ?? []) as { storage_path: string; position: number }[])
    .sort((a, b) => a.position - b.position)
    .slice(0, 5);
  const photoUrls = photos.map(
    (p) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/mkt-photos/${p.storage_path}`,
  );

  let imageResult: ModResult | null = null;
  if (photoUrls.length > 0) {
    try {
      imageResult = await classifyImages(photoUrls, product.title);
    } catch {
      return NextResponse.json({ error: "No se pudo completar la valoración de imágenes" }, { status: 502 });
    }
  }

  const recommendation = combineAiReview({ text: textResult, image: imageResult });
  const { error: logError } = await admin.from("mkt_moderation_events").insert({
    listing_id,
    verdict: recommendation.verdict,
    violations: recommendation.violations,
    reason: recommendation.reason_es,
    source: "ai",
    confidence: recommendation.confidence,
    model: MODEL,
  });
  if (logError) return NextResponse.json({ error: "No se pudo guardar la valoración IA" }, { status: 500 });
  return NextResponse.json(recommendation);
}
