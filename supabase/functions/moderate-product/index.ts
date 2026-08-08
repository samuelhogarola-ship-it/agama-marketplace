import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const MODEL = "claude-haiku-4-5-20251001";

const ALLOWED_ORIGINS = [
  "https://todo-plastico.com",
  "https://www.todo-plastico.com",
  "http://localhost:3000",
];

function corsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

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

function json(data: unknown, status = 200, req?: Request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...(req ? corsHeaders(req) : {}), "Content-Type": "application/json" },
  });
}

async function submitListing(admin: SupaClient, id: number, verdict: "approve" | "reject" | "pending", reason: string | null) {
  const verdictMap = { approve: "approve", reject: "reject", pending: "pending" } as const;
  await admin.rpc("mkt_submit_listing", {
    p_listing_id: id,
    p_verdict: verdictMap[verdict],
    ...(reason ? { p_reason: reason } : {}),
  });
}

async function logEvent(
  admin: SupaClient,
  listingId: number,
  verdict: string,
  violations: string[],
  reason: string | null,
  source: string,
  confidence: number,
) {
  await admin.from("mkt_moderation_events").insert({
    listing_id: listingId,
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
  const prompt = `Eres el moderador de TodoPlástico, portal B2B de plásticos en México.

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
          text: `Fotos del anuncio "${title}" en TodoPlástico (plásticos B2B, México).

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
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders(req) });

  const auth = req.headers.get("Authorization");
  if (!auth) return new Response("Unauthorized", { status: 401, headers: corsHeaders(req) });

  let listingId: number;
  try {
    const body = await req.json();
    listingId = Number(body.listing_id ?? body.product_id);
    if (!listingId) throw new Error();
  } catch {
    return json({ error: "listing_id requerido" }, 400, req);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const user = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });

  const { data: { user: caller } } = await user.auth.getUser();
  if (!caller) return new Response("Unauthorized", { status: 401, headers: corsHeaders(req) });

  const { data: listing } = await admin
    .from("mkt_listings")
    .select("*, photos:mkt_listing_photos(storage_path, position)")
    .eq("id", listingId)
    .single();

  if (!listing) return json({ error: "Anuncio no encontrado" }, 404, req);
  if (listing.company_id !== caller.id) return new Response("Forbidden", { status: 403, headers: corsHeaders(req) });
  if (listing.status === "blocked") return json({ error: "Anuncio bloqueado" }, 403, req);

  await submitListing(admin, listingId, "pending", null);

  const fullText = `${listing.title} ${listing.description}`;

  // --- Layer 1: hard regex ---
  const hardViolations: string[] = [];
  if (BANNED_RE.test(fullText)) hardViolations.push("competencia_pigmentos_masterbatch_aditivos");
  if (CONTACT_RE.test(fullText)) hardViolations.push("datos_contacto");

  if (hardViolations.length > 0) {
    const reason = hardViolations.includes("competencia_pigmentos_masterbatch_aditivos")
      ? "No se permiten pigmentos, masterbatch, aditivos ni colorantes."
      : "No se permiten teléfonos, emails ni WhatsApp en la publicación.";
    await submitListing(admin, listingId, "reject", reason);
    await logEvent(admin, listingId, "reject", hardViolations, reason, "rules", 1.0);
    return json({ verdict: "reject", reason }, 200, req);
  }

  // --- Layer 2: Claude Haiku text (skip if no API key configured) ---
  if (!ANTHROPIC_KEY) {
    await logEvent(admin, listingId, "review", [], "Revisión IA pendiente de configuración", "rules", 0);
    return json({ verdict: "review", reason: "Tu publicación está pendiente de revisión." }, 200, req);
  }

  let textResult: ModResult;
  try {
    textResult = await classifyText(listing.title, listing.description, listing.category);
  } catch (e) {
    console.error("Text classification failed:", e);
    await logEvent(admin, listingId, "review", [], "Error en clasificador IA", "ai", 0);
    return json({ verdict: "review", reason: "Tu publicación está pendiente de revisión." }, 200, req);
  }

  if (textResult.verdict === "reject" && textResult.confidence >= 0.8) {
    await submitListing(admin, listingId, "reject", textResult.reason_es);
    await logEvent(admin, listingId, "reject", textResult.violations, textResult.reason_es, "ai", textResult.confidence);
    return json({ verdict: "reject", reason: textResult.reason_es }, 200, req);
  }

  if (textResult.verdict !== "approve" || textResult.confidence < 0.75) {
    await logEvent(admin, listingId, "review", textResult.violations, textResult.reason_es, "ai", textResult.confidence);
    return json({ verdict: "review", reason: "Tu publicación está siendo revisada." }, 200, req);
  }

  // --- Layer 3: Claude Haiku vision ---
  const photos = ((listing.photos ?? []) as { storage_path: string; position: number }[])
    .sort((a, b) => a.position - b.position)
    .slice(0, 5);
  const photoUrls = photos.map((p) => `${SUPABASE_URL}/storage/v1/object/public/mkt-photos/${p.storage_path}`);

  if (photoUrls.length > 0) {
    try {
      const visionResult = await classifyImages(photoUrls, listing.title);
      if (visionResult.verdict === "reject" && visionResult.confidence >= 0.8) {
        await submitListing(admin, listingId, "reject", visionResult.reason_es);
        await logEvent(admin, listingId, "reject", visionResult.violations, visionResult.reason_es, "ai", visionResult.confidence);
        return json({ verdict: "reject", reason: visionResult.reason_es }, 200, req);
      }
      if (visionResult.verdict === "review") {
        await logEvent(admin, listingId, "review", visionResult.violations, visionResult.reason_es, "ai", visionResult.confidence);
        return json({ verdict: "review", reason: "Las imágenes están siendo revisadas." }, 200, req);
      }
    } catch (e) {
      console.warn("Vision check failed (non-blocking):", e);
      // Vision failure doesn't block publication
    }
  }

  // All layers passed → publish
  await submitListing(admin, listingId, "approve", null);
  await logEvent(admin, listingId, "approve", [], null, "ai", textResult.confidence);
  return json({ verdict: "approve" }, 200, req);
});
