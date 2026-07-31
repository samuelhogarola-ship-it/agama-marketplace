export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  cover: string;
  paragraphs: string[];
};

export const ARTICLES: Article[] = [
  {
    slug: "como-elegir-un-envase-plastico-para-tu-producto",
    title: "Cómo elegir un envase plástico para tu producto",
    excerpt: "Una guía práctica para comparar formato, resistencia, cierre y aplicación antes de pedir cotizaciones.",
    category: "Guías de compra",
    date: "2026-07-31",
    cover: "/category-envases.png",
    paragraphs: [
      "Elegir un envase empieza por entender el uso final. El producto, la forma de llenado, el transporte y la exposición del envase determinan qué solución conviene buscar.",
      "Para comparar proveedores, prepara una ficha sencilla con capacidad, dimensiones, color, tipo de cierre, cantidades aproximadas y mercado de destino. Esa información reduce iteraciones y hace más comparables las propuestas.",
      "También conviene pedir muestras antes de cerrar una producción. Una muestra permite revisar ergonomía, apilado, compatibilidad con la línea y calidad visual en condiciones reales.",
    ],
  },
  {
    slug: "que-revisar-en-una-tarima-de-plastico",
    title: "Qué revisar en una tarima de plástico",
    excerpt: "Carga, entradas, medidas y condiciones de uso: los puntos que realmente cambian una decisión industrial.",
    category: "Operación industrial",
    date: "2026-07-29",
    cover: "/category-tarimas.png",
    paragraphs: [
      "Una tarima debe evaluarse con la carga estática y dinámica que tendrá en operación, no solo con una cifra aislada del catálogo.",
      "Revisa las dimensiones, el número de entradas para montacargas, la posibilidad de anidado y la estabilidad cuando se apilan unidades o cajas.",
      "La mejor comparación es una prueba con tu propia mercancía y recorrido. Así se valida el desempeño sin confundir una especificación comercial con una garantía de operación.",
    ],
  },
  {
    slug: "reciclado-plastico-como-comparar-proveedores",
    title: "Reciclado plástico: cómo comparar proveedores",
    excerpt: "Origen, consistencia y aplicación: tres variables para encontrar material reciclado que funcione en tu proceso.",
    category: "Materiales y procesos",
    date: "2026-07-26",
    cover: "/category-reciclado.png",
    paragraphs: [
      "Antes de comparar precios, define el origen del material, el formato de entrega y la aplicación que debe cubrir. Un mismo nombre comercial puede referirse a calidades muy distintas.",
      "Pide información sobre lote, color, humedad, contaminantes y variación entre entregas. La consistencia suele ser más importante que el precio de una sola compra.",
      "Documenta una prueba de entrada y conserva una muestra de referencia. Esto facilita la trazabilidad cuando el material pasa por distintas líneas o proveedores.",
    ],
  },
  {
    slug: "maquinaria-para-transformacion-de-plastico",
    title: "Maquinaria para transformación de plástico",
    excerpt: "Cómo ordenar una búsqueda de maquinaria, refacciones y servicio técnico sin perder tiempo.",
    category: "Maquinaria",
    date: "2026-07-23",
    cover: "/category-maquinaria.png",
    paragraphs: [
      "Una búsqueda eficiente comienza por el proceso: inyección, soplado, extrusión, rotomoldeo o una combinación de operaciones.",
      "Después, reúne producción objetivo, ventana de materiales, dimensiones de molde, disponibilidad eléctrica y nivel de automatización deseado.",
      "En equipos usados, solicita historial de mantenimiento, fotografías de zonas críticas y disponibilidad de refacciones. Una visita técnica puede ahorrar más que una diferencia inicial de precio.",
    ],
  },
  {
    slug: "publicar-un-anuncio-b2b-que-genere-contactos",
    title: "Cómo publicar un anuncio B2B que genere contactos",
    excerpt: "Una estructura clara ayuda a que compradores y proveedores encuentren rápido lo que necesitan.",
    category: "TodoPlástico",
    date: "2026-07-20",
    cover: "/category-productos.png",
    paragraphs: [
      "Un buen anuncio responde en pocas líneas qué ofreces, para quién es y qué información debe tener una empresa interesada para dar el siguiente paso.",
      "Usa un título específico, describe medidas y aplicaciones, elige la categoría correcta y añade fotografías reales del producto o del proceso.",
      "Los datos de contacto deben mantenerse en la ficha pública de empresa o en el enlace externo. El anuncio queda más limpio y las personas saben dónde continuar la conversación.",
    ],
  },
];

export function articleBySlug(slug: string) {
  return ARTICLES.find((article) => article.slug === slug);
}
