import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminUser } from "@/lib/supabase/admin";
import { CATEGORIES, slugify } from "@/lib/categories";
import { isSaleUnit, parseMinimumPurchase } from "@/lib/listing-options";
import { buildContactOverride, isOwnAdvertiserUrl } from "@/lib/listing-policy";
import { checkOrigin } from "@/lib/csrf";

const TYPES = new Set(["product", "service", "ad"]);

export async function POST(request: Request) {
  const originError = checkOrigin(request);
  if (originError) return originError;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdminUser(user)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  const body = Object.fromEntries(formData.entries());
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const companyId = String(body.company_id ?? "");
  const type = String(body.type ?? "product");
  const category = String(body.category ?? "");
  const price = Number(String(body.price_mxn ?? "").trim());
  const unit = String(body.unit ?? "").trim();
  const minPurchaseQty = parseMinimumPurchase(body.min_purchase_qty);
  const location = String(body.location ?? "").trim();
  const contactOverride = buildContactOverride(String(body.contact_method ?? ""), String(body.contact_value ?? ""));
  const externalUrl = String(body.external_url ?? "").trim();
  if (!companyId || title.length < 10 || description.length < 30 || !CATEGORIES.some((item) => item.slug === category) || !TYPES.has(type)) return NextResponse.json({ error: "Completa empresa, título, categoría y descripción con datos válidos." }, { status: 400 });
  if (!Number.isFinite(price) || price < 0 || !isSaleUnit(unit) || !minPurchaseQty || location.length < 2) return NextResponse.json({ error: "Precio, cómo se vende, compra mínima y ubicación son obligatorios." }, { status: 400 });
  if (!contactOverride) return NextResponse.json({ error: "Elige una forma de contacto y completa el dato de contacto." }, { status: 400 });
  if (/pigmentos?|master[ -]?batch|aditivos?|colorantes?/i.test(`${title} ${description}`)) return NextResponse.json({ error: "No se permiten pigmentos, masterbatch, aditivos ni colorantes." }, { status: 400 });
  if (/\b\d{10}\b|\+?52[\s.-]?\d{10}|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|wa\.me|whats\s*app/i.test(`${title} ${description}`)) return NextResponse.json({ error: "No se permiten teléfonos, emails ni WhatsApp en el texto." }, { status: 400 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Servicio de administración no configurado." }, { status: 503 });
  const { data: company } = await admin.from("mkt_companies").select("id, website").eq("id", companyId).maybeSingle();
  if (!company) return NextResponse.json({ error: "La empresa seleccionada no existe." }, { status: 404 });
  if (externalUrl && !isOwnAdvertiserUrl(externalUrl, company.website)) return NextResponse.json({ error: "El enlace debe pertenecer a la web propia de la empresa anunciante." }, { status: 400 });
  const { data, error } = await admin.from("mkt_listings").insert({ company_id: companyId, title, slug: slugify(title), description, type, category, price_mxn: price, unit, min_purchase_qty: minPurchaseQty, location, contact_override: contactOverride, external_url: externalUrl || null, status: "pending_review" }).select("id").single();
  if (error) return NextResponse.json({ error: "No se pudo crear el anuncio." }, { status: 500 });
  const photos = formData.getAll("photos").filter((entry): entry is File => entry instanceof File && entry.size > 0).slice(0, 5);
  for (let index = 0; index < photos.length; index += 1) {
    const photo = photos[index];
    if (!["image/jpeg", "image/png", "image/webp"].includes(photo.type) || photo.size > 8 * 1024 * 1024) continue;
    const extension = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
    const storagePath = `${companyId}/${data.id}/${index + 1}.${extension}`;
    const upload = await admin.storage.from("mkt-photos").upload(storagePath, Buffer.from(await photo.arrayBuffer()), { contentType: photo.type, upsert: true });
    if (!upload.error) await admin.from("mkt_listing_photos").insert({ listing_id: data.id, storage_path: storagePath, position: index });
  }
  return NextResponse.json({ ok: true, id: data.id });
}
