export type Category = { slug: string; name: string; description: string };

// Fuente canónica de la taxonomía v1 (ver docs/vision.md).
// Pigmentos, masterbatch y aditivos NO existen como categoría: contenido prohibido.
export const CATEGORIES: Category[] = [
  { slug: "envases-y-botellas", name: "Envases y botellas", description: "Envases, botellas, frascos y tapas de plástico para industria y comercio." },
  { slug: "bolsas-y-pelicula", name: "Bolsas y película", description: "Bolsas de plástico, película stretch, playo y empaques flexibles." },
  { slug: "tarimas-y-contenedores", name: "Tarimas y contenedores", description: "Tarimas de plástico, cajas industriales y contenedores apilables." },
  { slug: "cubetas-y-bidones", name: "Cubetas y bidones", description: "Cubetas, bidones, tambos y garrafones de plástico." },
  { slug: "perfiles-y-laminas", name: "Perfiles y láminas", description: "Perfiles, láminas, placas y planchas de plástico." },
  { slug: "tuberia-y-conexiones", name: "Tubería y conexiones", description: "Tubería de PVC, PEAD, CPVC y conexiones plásticas." },
  { slug: "maquinaria-y-refacciones", name: "Maquinaria y refacciones", description: "Máquinas de inyección, soplado, extrusión y sus refacciones." },
];

export const categoryBySlug = (slug: string) => CATEGORIES.find((c) => c.slug === slug);

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}
