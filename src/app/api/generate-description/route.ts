import { NextRequest, NextResponse } from "next/server";
import { checkOrigin } from "@/lib/csrf";
import { createClient } from "@/lib/supabase/server";

const MODEL = "claude-haiku-4-5-20251001";

export async function POST(req: NextRequest) {
  const originError = checkOrigin(req);
  if (originError) return originError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: "ANTHROPIC_API_KEY no configurada" }, { status: 503 });

  const { title, category, location } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Título requerido" }, { status: 400 });

  const prompt = `Eres redactor B2B para TodoPlástico, plataforma de la industria plástica en México.

Escribe una descripción profesional y concisa para este anuncio. Máximo 400 caracteres. Sin emojis. En español. Solo el texto de la descripción, sin encabezados ni explicaciones.

Título: ${title}
Categoría: ${category ?? "Productos plásticos"}
${location ? `Ubicación: ${location}` : ""}

La descripción debe mencionar el tipo de producto/servicio, materiales o características clave, y para qué tipo de cliente es ideal.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) return NextResponse.json({ error: "Error generando descripción" }, { status: 502 });
  const data = await res.json();
  const description = (data.content[0].text as string).trim();

  return NextResponse.json({ description });
}
