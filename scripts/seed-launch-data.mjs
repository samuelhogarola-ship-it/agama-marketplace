import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

if (fs.existsSync(".env.local")) {
  const lines = fs.readFileSync(".env.local", "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.TODO_PLASTICO_SEED_ADMIN_EMAIL;

if (!url || !serviceRole) {
  throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const categories = [
  ["envases-y-botellas", "Envases y botellas", "Envases, botellas, frascos y tapas de plástico para industria y comercio.", 1],
  ["bolsas-y-pelicula", "Bolsas y película", "Bolsas de plástico, película stretch, playo y empaques flexibles.", 2],
  ["tarimas-y-contenedores", "Tarimas y contenedores", "Tarimas de plástico, cajas industriales y contenedores apilables.", 3],
  ["cubetas-y-bidones", "Cubetas y bidones", "Cubetas, bidones, tambos y garrafones de plástico.", 4],
  ["perfiles-y-laminas", "Perfiles y láminas", "Perfiles, láminas, placas y planchas de plástico.", 5],
  ["tuberia-y-conexiones", "Tubería y conexiones", "Tubería de PVC, PEAD, CPVC y conexiones plásticas.", 6],
  ["reciclado-y-molido", "Reciclado y molido", "Plástico reciclado, molido, paca y pellet reprocesado.", 7],
  ["resinas", "Resinas", "Resinas vírgenes y reprocesadas: PP, PE, PET, PS, ABS y más.", 8],
  ["maquinaria-y-refacciones", "Maquinaria y refacciones", "Máquinas de inyección, soplado, extrusión y sus refacciones.", 9],
];

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

async function ensureAuthUser(email, metadata = {}) {
  const { data: listed, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;

  const existing = listed.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
  if (existing) return existing;

  const created = await supabase.auth.admin.createUser({
    email,
    password: crypto.randomBytes(36).toString("base64url"),
    email_confirm: true,
    user_metadata: metadata,
  });
  if (created.error) throw created.error;
  return created.data.user;
}

async function seedAgamaSampleListing() {
  const email = "demo-agama-envases@todo-plastico.com";
  const user = await ensureAuthUser(email, { company_name: "AGAMA Envases Industriales Demo" });

  const company = {
    id: user.id,
    name: "AGAMA Envases Industriales Demo",
    slug: "agama-envases-industriales-demo",
    description: "Empresa ficticia usada como modelo de anuncio para TodoPlastico. Publica productos plasticos permitidos con informacion clara, contacto externo y enlace propio.",
    location: "Ciudad de Mexico",
    website: "https://agama-envases.com",
    logo_url: "/agama-logo.png",
    email: "ventas@agama-envases.com",
    phone: "+52 55 4100 2200",
    whatsapp: "+52 55 4100 2200",
    categories: ["envases-y-botellas"],
    plan: "pro",
    is_verified: true,
    is_featured: true,
    status: "active",
  };

  const { error: companyError } = await supabase.from("mkt_companies").upsert(company, { onConflict: "id" });
  if (companyError) throw companyError;

  const listing = {
    company_id: user.id,
    title: "Tazas de plastico reutilizables 350 ml para eventos",
    slug: "tazas-plastico-reutilizables-350ml-eventos",
    description: "Tazas de plastico reutilizables de 350 ml para eventos, comedores industriales y promociones corporativas. Fabricadas en material rigido, apilables y disponibles en color blanco o transparente. Venta por volumen para empresas.",
    type: "product",
    category: "envases-y-botellas",
    price_mxn: 8.5,
    unit: "unidad",
    min_purchase_qty: 500,
    location: "Ciudad de Mexico",
    contact_override: { method: "email", value: "ventas@agama-envases.com" },
    external_url: "https://agama-envases.com/tazas-plastico-reutilizables-350ml",
    status: "published",
    rejection_reason: null,
  };

  const { data: existing, error: findError } = await supabase
    .from("mkt_listings")
    .select("id")
    .eq("company_id", user.id)
    .eq("slug", listing.slug)
    .maybeSingle();
  if (findError) throw findError;

  await supabase
    .from("mkt_listings")
    .delete()
    .eq("company_id", user.id)
    .eq("slug", "cubeta-blanca-industrial-20l-tapa-inviolable");

  if (existing) {
    const { error } = await supabase.from("mkt_listings").update({ ...listing, updated_at: new Date().toISOString() }).eq("id", existing.id);
    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await supabase.from("mkt_listings").insert(listing).select("id").single();
  if (error) throw error;
  return data.id;
}

async function seedSamplePhotos(listingId) {
  const files = ["agama-cups-1.png", "agama-cups-2.png", "agama-cups-3.png"];
  const rows = [];
  for (const [index, filename] of files.entries()) {
    const storagePath = `demo-agama/${listingId}/${index + 1}.png`;
    const file = fs.readFileSync(path.join(process.cwd(), "public", "sample", filename));
    const { error: uploadError } = await supabase.storage.from("mkt-photos").upload(storagePath, file, {
      contentType: "image/png",
      upsert: true,
    });
    if (uploadError) throw uploadError;
    rows.push({ listing_id: listingId, storage_path: storagePath, position: index, alt_text: "Tazas de plástico reutilizables AGAMA" });
  }
  const { error: deleteError } = await supabase.from("mkt_listing_photos").delete().eq("listing_id", listingId);
  if (deleteError) throw deleteError;
  const { error: insertError } = await supabase.from("mkt_listing_photos").insert(rows);
  if (insertError) throw insertError;
}

const { error: categoryError } = await supabase.from("mkt_categories").upsert(
  categories.map(([slug, name, description, position]) => ({ slug, name, description, position })),
  { onConflict: "slug" }
);

if (categoryError) throw categoryError;

const sampleListingId = await seedAgamaSampleListing();
await seedSamplePhotos(sampleListingId);

if (!adminEmail) {
  console.log(`Categorias sembradas + anuncio modelo AGAMA ficticio (${sampleListingId}). Define TODO_PLASTICO_SEED_ADMIN_EMAIL para crear AGAMA admin.`);
  process.exit(0);
}

const user = await ensureAuthUser(adminEmail, { company_name: "AGAMA Pigmentos y Masterbatch" });

const { error: companyError } = await supabase.from("mkt_companies").upsert({
  id: user.id,
  name: "AGAMA Pigmentos y Masterbatch",
  slug: "agama-pigmentos-y-masterbatch",
  description: "Patrocinador principal de TodoPlástico y proveedor especializado para la industria plástica.",
  location: "México",
  categories: ["patrocinador"],
  plan: "pro",
  is_verified: true,
  is_featured: true,
  status: "active",
}, { onConflict: "id" });

if (companyError) throw companyError;

console.log(`Seed completado: categorias + anuncio modelo AGAMA ficticio (${sampleListingId}) + AGAMA admin (${adminEmail}).`);
