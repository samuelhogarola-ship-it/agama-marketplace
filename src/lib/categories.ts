export type Category = {
  slug: string;
  name: string;
  description: string;
  keywords: string[];
};

// Fuente canónica de la taxonomía v2 (ver docs/vision.md).
// Pigmentos, masterbatch y aditivos NO existen como categoría: contenido prohibido.
export const CATEGORIES: Category[] = [
  {
    slug: "envases-y-botellas",
    name: "Envases y botellas",
    description: "Envases, botellas, frascos y tapas de plástico para industria y comercio.",
    keywords: ["comprar envases de plástico", "botellas PET", "frascos plásticos", "tapas de plástico", "envases industriales"],
  },
  {
    slug: "bolsas-y-pelicula",
    name: "Bolsas y película",
    description: "Bolsas de plástico, película stretch, playo y empaques flexibles.",
    keywords: ["comprar bolsas de plástico", "película stretch", "playo industrial", "empaques flexibles", "bolsas industriales"],
  },
  {
    slug: "tarimas-y-contenedores",
    name: "Tarimas y contenedores",
    description: "Tarimas de plástico, cajas industriales y contenedores apilables.",
    keywords: ["comprar tarimas de plástico", "contenedores apilables", "cajas industriales", "tarimas plásticas", "pallets de plástico"],
  },
  {
    slug: "cubetas-y-bidones",
    name: "Cubetas y bidones",
    description: "Cubetas, bidones, tambos y garrafones de plástico.",
    keywords: ["comprar cubetas de plástico", "bidones industriales", "tambos de plástico", "garrafones", "cubetas industriales"],
  },
  {
    slug: "perfiles-y-laminas",
    name: "Perfiles y láminas",
    description: "Perfiles, láminas, placas y planchas de plástico para construcción e industria.",
    keywords: ["comprar perfiles de plástico", "láminas plásticas", "placas de plástico", "planchas de acrílico", "policarbonato"],
  },
  {
    slug: "tuberia-y-conexiones",
    name: "Tubería y conexiones",
    description: "Tubería de PVC, PEAD, CPVC y conexiones plásticas.",
    keywords: ["comprar tubería de PVC", "tubería PEAD", "conexiones plásticas", "tubería CPVC", "tubería de plástico"],
  },
  {
    slug: "muebles-y-sillas",
    name: "Muebles y sillas",
    description: "Sillas, mesas, bancos y mobiliario de plástico para interior y exterior.",
    keywords: ["comprar sillas de plástico", "mesas de plástico", "muebles de plástico", "mobiliario plástico", "sillas apilables"],
  },
  {
    slug: "reciclado-y-sustentabilidad",
    name: "Reciclado y sustentabilidad",
    description: "Plástico reciclado, molienda, peletizado y soluciones sustentables.",
    keywords: ["plástico reciclado", "reciclaje de plástico", "peletizado", "molienda de plástico", "sustentabilidad plástica"],
  },
  {
    slug: "moldes-y-troqueles",
    name: "Moldes y troqueles",
    description: "Moldes de inyección, soplado y extrusión para la industria plástica.",
    keywords: ["comprar moldes de inyección", "moldes para plástico", "troqueles", "moldes de soplado", "herramentales"],
  },
  {
    slug: "empaques-y-embalaje",
    name: "Empaques y embalaje",
    description: "Empaques plásticos, charolas, blister, clamshell y soluciones de embalaje.",
    keywords: ["comprar empaques de plástico", "charolas plásticas", "blister", "clamshell", "embalaje plástico"],
  },
  {
    slug: "productos-terminados",
    name: "Productos terminados",
    description: "Artículos plásticos terminados: cajas, cestas, botes, accesorios y más.",
    keywords: ["productos de plástico", "artículos plásticos", "cajas de plástico", "cestas plásticas", "botes de plástico"],
  },
];

export const categoryBySlug = (slug: string) => CATEGORIES.find((c) => c.slug === slug);

export const CATEGORY_SUBCATEGORIES: Record<string, readonly (readonly [string, string])[]> = {
  "envases-y-botellas": [["botellas", "Botellas"], ["frascos", "Frascos"], ["tapas", "Tapas"], ["contenedores", "Contenedores"]],
  "bolsas-y-pelicula": [["bolsas", "Bolsas"], ["pelicula-stretch", "Película stretch"], ["playo", "Playo"], ["sacos", "Sacos"]],
  "tarimas-y-contenedores": [["tarimas", "Tarimas"], ["cajas-industriales", "Cajas industriales"], ["contenedores-apilables", "Contenedores apilables"]],
  "cubetas-y-bidones": [["cubetas", "Cubetas"], ["bidones", "Bidones"], ["tambos", "Tambos"], ["garrafones", "Garrafones"]],
  "perfiles-y-laminas": [["perfiles", "Perfiles"], ["laminas", "Láminas"], ["placas", "Placas"], ["planchas", "Planchas"]],
  "tuberia-y-conexiones": [["pvc", "PVC"], ["pead", "PEAD"], ["cpvc", "CPVC"], ["conexiones", "Conexiones"]],
  "muebles-y-sillas": [["sillas", "Sillas"], ["mesas", "Mesas"], ["bancos", "Bancos"], ["mobiliario-exterior", "Mobiliario exterior"]],
  "reciclado-y-sustentabilidad": [["plastico-reciclado", "Plástico reciclado"], ["molienda", "Molienda"], ["peletizado", "Peletizado"], ["scrap", "Scrap"]],
  "moldes-y-troqueles": [["inyeccion", "Moldes de inyección"], ["soplado", "Moldes de soplado"], ["extrusion", "Moldes de extrusión"], ["herramentales", "Herramentales"]],
  "empaques-y-embalaje": [["charolas", "Charolas"], ["blister", "Blister"], ["clamshell", "Clamshell"], ["termoformado", "Termoformado"]],
  "productos-terminados": [["cajas", "Cajas"], ["cestas", "Cestas"], ["botes", "Botes"], ["accesorios", "Accesorios"]],
};

export const CATEGORY_IMAGES: Record<string, string> = {
  "envases-y-botellas": "/category-envases.png",
  "bolsas-y-pelicula": "/category-bolsas.png",
  "tarimas-y-contenedores": "/category-tarimas.png",
  "cubetas-y-bidones": "/category-cubetas.png",
  "perfiles-y-laminas": "/category-perfiles.png",
  "tuberia-y-conexiones": "/category-tuberia.png",
  "muebles-y-sillas": "/category-productos.png",
  "reciclado-y-sustentabilidad": "/category-reciclado.png",
  "moldes-y-troqueles": "/category-maquinaria.png",
  "empaques-y-embalaje": "/category-envases.png",
  "productos-terminados": "/category-productos.png",
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}
