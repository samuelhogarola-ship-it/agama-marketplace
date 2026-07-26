import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const MODEL = "claude-haiku-4-5-20251001";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Hard-rule regex (mirrors DB layer — first check, no API cost)
const BANNED_RE = /\b(pigmentos?|masterbatch|master[\s-]*batch|aditivos?|colorantes?|concentrados?\s+de\s+color|color\s*concentrate|additives?)\b/i;
const CONTACT_RE = /\b\d{10}\b|\+?52[\s.-]?\d{10}|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|(wa\.me|whats\s*app)/i;

interface ModResult {
  verdict: "approve" | "reject" | "review";
  violations: string[];
  confidence: number;
  reason_es: string | null;
}

type SupaClient = ReturnType<typeof createClient>;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

async function setStatus(admin: SupaClient, id: number, status: string, reason: string | null) {
  await admin
    .from("mkt_products")
    .update({ status, reject_reason: reason, updated_at: new Date().toISOString() })
    .eq("id", id);
}

async function logEvent(
  admin: SupaClient,
  productId: number,
  verdict: string,
  violations: string[],
  reason: string | null,
  source: string,
  confidence: number,
) {
  await admin.from("mkt_moderation_events").insert({
    product_id: productId,
    verdict,
    violations,
    reason,
    source,
    confidence,
    model: source === "ai" ? MODEL : null,
  });
}

async function callClaude(messages: unknown[], maxTokens = 300): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.content[0].text as string).trim();
}

async function classifyText(title: string, description: string, category: string): Promise<ModResult> {
  const prompt = `Eres el moderador de AGAMA Marketplace, portal B2B de plásticos en México.

Producto:
Título: ${title}
Categoría: ${category}
Descripción: ${description}

Reglas:
PERMITIDO: plásticos (envases, tarimas, bolsas, tubería, perfiles, láminas, maquinaria, resinas PET/PE/PP/PVC/PS/ABS, molido, pacas), servicios de transformación plástica (inyección, soplado, termoformado, extrusión, maquila).
PROHIBIDO:
1. competencia_agama: pigmentos, masterbatch, concentrados de color, aditivos (UV, antioxidantes, retardantes, deslizantes) — aunque sea "sin incluir".
2. fuera_de_tema: ajeno a la industria plástica.
3. datos_contacto: teléfono, email, WhatsApp, redes en el texto.
4. contenido_ilegal: falsificaciones, residuos peligrosos, armas.

Devuelve SOLO JSON sin markdown:
{"verdict":"approve","violations":[],"confidence":0.95,"reason_es":null}`;

  const raw = await callClaude([{ role: "user", content: prompt }]);
  return JSON.parse(raw);
}

async function classifyImages(urls: string[], title: string): Promise<ModResult> {
  const imageBlocks = urls.map((url) => ({ type: "image", source: { type: "url", url } }));
  const messages = [
    {
      role: "user",
      content: [
        ...imageBlocks,
        {
          type: "text",
          text: `Fotos del producto "${title}" en AGAMA Marketplace (plásticos B2B, México).

¿Muestran pigmentos, masterbatch, aditivos de color, productos ajenos al plástico, o datos de contacto (teléfonos/emails en carteles)?

Devuelve SOLO JSON:
{"verdict":"approve","violations":[],"confidence":0.95,"reason_es":null}`,
        },
      ],
    },
  ];
  const raw = await callClaude(messages, 150);
  return JSON.parse(raw);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: CORS });

  const auth = req.headers.get("Authorization");
  if (!auth) return new Response("Unauthorized", { status: 401, headers: CORS });

  let productId: number;
  try {
    const body = await req.json();
    productId = Number(body.product_id);
    if (!productId) throw new Error();
  } catch {
    return json({ error: "product_id requerido" }, 400);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const user = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });

  const { data: { user: caller } } = await user.auth.getUser();
  if (!caller) return new Response("Unauthorized", { status: 401, headers: CORS });

  const { data: product } = await admin
    .from("mkt_products")
    .select("*, photos:mkt_product_photos(path, position)")
    .eq("id", productId)
    .single();

  if (!product) return json({ error: "Producto no encontrado" }, 404);
  if (product.owner_id !== caller.id) return new Response("Forbidden", { status: 403, headers: CORS });
  if (product.status === "blocked") return json({ error: "Producto bloqueado" }, 403);

  // Mark pending immediately (user sees feedback quickly)
  await setStatus(admin, productId, "pending_review", null);

  const fullText = `${product.title} ${product.description}`;

  // --- Layer 1: hard regex ---
  const hardViolations: string[] = [];
  if (BANNED_RE.test(fullText)) hardViolations.push("competencia_pigmentos_masterbatch_aditivos");
  if (CONTACT_RE.test(fullText)) hardViolations.push("datos_contacto");

  if (hardViolations.length > 0) {
    const reason = hardViolations.includes("competencia_pigmentos_masterbatch_aditivos")
      ? "No se permiten pigmentos, masterbatch, aditivos ni colorantes."
      : "No se permiten teléfonos, emails ni WhatsApp en la publicación.";
    await setStatus(admin, productId, "rejected", reason);
    await logEvent(admin, productId, "reject", hardViolations, reason, "rules", 1.0);
    return json({ verdict: "reject", reason });
  }

  // --- Layer 2: Claude Haiku text (skip if no API key configured) ---
  if (!ANTHROPIC_KEY) {
    // No AI key: publish if regex passed (acceptable for dev/testing)
    await setStatus(admin, productId, "published", null);
    await logEvent(admin, productId, "approve", [], null, "rules", 1.0);
    return json({ verdict: "approve" });
  }

  let textResult: ModResult;
  try {
    textResult = await classifyText(product.title, product.description, product.category);
  } catch (e) {
    console.error("Text classification failed:", e);
    await logEvent(admin, productId, "review", [], "Error en clasificador IA", "ai", 0);
    return json({ verdict: "review", reason: "Tu publicación está pendiente de revisión." });
  }

  if (textResult.verdict === "reject" && textResult.confidence >= 0.8) {
    await setStatus(admin, productId, "rejected", textResult.reason_es);
    await logEvent(admin, productId, "reject", textResult.violations, textResult.reason_es, "ai", textResult.confidence);
    return json({ verdict: "reject", reason: textResult.reason_es });
  }

  if (textResult.verdict !== "approve" || textResult.confidence < 0.75) {
    await logEvent(admin, productId, "review", textResult.violations, textResult.reason_es, "ai", textResult.confidence);
    return json({ verdict: "review", reason: "Tu publicación está siendo revisada." });
  }

  // --- Layer 3: Claude Haiku vision ---
  const photos = ((product.photos ?? []) as { path: string; position: number }[])
    .sort((a, b) => a.position - b.position)
    .slice(0, 5);
  const photoUrls = photos.map((p) => `${SUPABASE_URL}/storage/v1/object/public/mkt-photos/${p.path}`);

  if (photoUrls.length > 0) {
    try {
      const visionResult = await classifyImages(photoUrls, product.title);
      if (visionResult.verdict === "reject" && visionResult.confidence >= 0.8) {
        await setStatus(admin, productId, "rejected", visionResult.reason_es);
        await logEvent(admin, productId, "reject", visionResult.violations, visionResult.reason_es, "ai", visionResult.confidence);
        return json({ verdict: "reject", reason: visionResult.reason_es });
      }
      if (visionResult.verdict === "review") {
        await logEvent(admin, productId, "review", visionResult.violations, visionResult.reason_es, "ai", visionResult.confidence);
        return json({ verdict: "review", reason: "Las imágenes están siendo revisadas." });
      }
    } catch (e) {
      console.warn("Vision check failed (non-blocking):", e);
      // Vision failure doesn't block publication
    }
  }

  // All layers passed → publish
  await setStatus(admin, productId, "published", null);
  await logEvent(admin, productId, "approve", [], null, "ai", textResult.confidence);
  return json({ verdict: "approve" });
});
