type FamilyEditorial = {
  title: string;
  description: string;
  introduction: string;
  variants: string;
  checklist: string[];
  article: string;
  related: string[];
};

/** Product-first national programme; existing categories outside it stay available. */
export const FAMILY_EDITORIAL: Record<string, FamilyEditorial> = {
  'envases-y-botellas': {
    title: 'Envases y botellas de plástico en México',
    description: 'Consulta envases, botellas PET, frascos y tapas de plástico. Compara capacidades, materiales y pedidos mínimos con proveedores en México.',
    introduction: 'Busca envases y botellas por su capacidad, material y tipo de cierre. Consulta los anuncios disponibles y confirma con cada empresa qué formatos fabrica o distribuye y cuáles puede personalizar.',
    variants: 'Botellas PET, envases de PEAD, frascos y tapas. Un mismo volumen puede ofrecerse con diferentes cuellos, dimensiones y cierres: revisa el conjunto, no solo la botella.',
    checklist: ['Capacidad útil y dimensiones exteriores, con unidades.', 'Material, color y referencia del cuello y la tapa compatibles.', 'Cantidad por pedido, muestra, personalización y plazo de entrega.'],
    article: 'como-elegir-un-envase-plastico-para-tu-producto',
    related: ['cubetas-y-bidones','empaques-y-embalaje'],
  },
  'bolsas-y-pelicula': {
    title: 'Bolsas industriales y película stretch en México',
    description: 'Encuentra bolsas de plástico, playo y película stretch. Revisa ancho, espesor, presentación y pedido mínimo con proveedores en México.',
    introduction: 'Compara bolsas y película por sus medidas y presentación. Para pedir precios comparables, distingue una bolsa terminada de un rollo de película y especifica si necesitas impresión o fabricación a medida.',
    variants: 'Bolsas industriales, sacos, película stretch y playo. En los rollos, indica si la aplicación será manual o con máquina y consulta la longitud o el peso neto de película.',
    checklist: ['Ancho, largo, fuelle y espesor con la unidad acordada.', 'Piezas por paquete o metros y peso neto por rollo.', 'Tipo de aplicación, impresión, muestra y cantidad mínima.'],
    article: 'como-elegir-proveedor-bolsas-plasticas',
    related: ['empaques-y-embalaje','productos-terminados'],
  },
  'tarimas-y-contenedores': {
    title: 'Tarimas y contenedores de plástico en México',
    description: 'Consulta tarimas plásticas, cajas industriales y contenedores apilables. Compara dimensiones y condiciones de carga con proveedores en México.',
    introduction: 'Encuentra tarimas y contenedores por dimensiones, configuración y uso previsto. Solicita las condiciones de ensayo de la carga declarada antes de comparar modelos.',
    variants: 'Tarimas plásticas, cajas industriales y contenedores apilables o anidables. Comprueba las medidas interiores y exteriores, las entradas y la compatibilidad entre las piezas que se apilarán.',
    checklist: ['Dimensiones, peso de la pieza y espacio útil.', 'Carga estática, dinámica o en rack según corresponda al uso.', 'Condiciones de apilado, equipo de manejo y muestra de prueba.'],
    article: 'que-revisar-en-una-tarima-de-plastico',
    related: ['productos-terminados','bolsas-y-pelicula'],
  },
  'cubetas-y-bidones': {
    title: 'Cubetas, bidones y tambos de plástico en México',
    description: 'Busca cubetas, bidones, tambos y garrafones. Compara capacidad, material, cierre y cantidades con proveedores de plástico en México.',
    introduction: 'Consulta recipientes de mayor capacidad y compara el envase junto con su tapa, asa y accesorios. Confirma con el proveedor si la capacidad indicada es nominal o útil.',
    variants: 'Cubetas de distintas capacidades, bidones, tambos y garrafones. Aclara si necesitas boca ancha, rosca, tapa a presión o algún accesorio específico, sin dar por incluida ninguna pieza.',
    checklist: ['Capacidad útil, dimensiones y material del recipiente.', 'Tipo de tapa, sello, asa y accesorios incluidos en el precio.', 'Compatibilidad con el contenido, muestra y mínimo de compra.'],
    article: 'como-elegir-un-envase-plastico-para-tu-producto',
    related: ['envases-y-botellas','tarimas-y-contenedores'],
  },
  'perfiles-y-laminas': {
    title: 'Perfiles, láminas y placas de plástico en México',
    description: 'Consulta perfiles, láminas, placas y planchas plásticas. Compara material, espesor, tolerancias y cortes con proveedores en México.',
    introduction: 'Busca perfiles y láminas por material y medidas. Para una pieza a medida, comparte un plano y define qué tolerancias son necesarias antes de solicitar fabricación o corte.',
    variants: 'Perfiles extruidos, láminas, placas y planchas de materiales como acrílico o policarbonato, según los anuncios disponibles. Confirma acabado, transparencia, protección superficial y formato de suministro.',
    checklist: ['Material, largo, ancho o sección y espesor.', 'Tolerancias del plano, acabado y cortes requeridos.', 'Condiciones de uso, ficha técnica y cantidad mínima.'],
    article: 'termoformado-vs-inyeccion-que-conviene',
    related: ['empaques-y-embalaje','productos-terminados'],
  },
  'tuberia-y-conexiones': {
    title: 'Tubería PVC, PEAD y conexiones en México',
    description: 'Busca tubería de PVC, PEAD, CPVC y conexiones plásticas. Revisa diámetros, sistema de unión y especificaciones con proveedores en México.',
    introduction: 'Compara tubería y conexiones como un sistema completo. Además del diámetro, confirma la aplicación, las condiciones de trabajo y la compatibilidad entre piezas con el proveedor.',
    variants: 'Tubería PVC, PEAD y CPVC, codos, uniones y otras conexiones según el catálogo publicado. El nombre del material o el diámetro nominal por sí solos no garantizan que dos piezas sean compatibles.',
    checklist: ['Diámetro nominal y exterior, espesor y longitud.', 'Sistema de unión y serie o especificación del fabricante.', 'Presión y temperatura de trabajo previstas, documentación y cantidades.'],
    article: 'diferencias-pvc-rigido-flexible',
    related: ['perfiles-y-laminas','productos-terminados'],
  },
  'empaques-y-embalaje': {
    title: 'Empaques plásticos y termoformados en México',
    description: 'Consulta charolas, blíster, clamshell y empaques plásticos. Compara formatos, medidas, moldes y personalización con proveedores en México.',
    introduction: 'Busca empaques a partir de la pieza que deben contener o proteger. Prepara sus dimensiones, una muestra o un plano y la cantidad prevista para distinguir formatos estándar de desarrollos a medida.',
    variants: 'Charolas, blíster, clamshell y piezas termoformadas. Confirma cavidades, cierre, borde y presentación final; separa el coste del herramental del precio por pieza cuando corresponda.',
    checklist: ['Medidas de la pieza, holguras y número de cavidades.', 'Material, espesor, acabado y forma de cierre.', 'Muestra, propiedad del molde, mínimo de producción y entregas.'],
    article: 'termoformado-vs-inyeccion-que-conviene',
    related: ['envases-y-botellas','perfiles-y-laminas'],
  },
  'productos-terminados': {
    title: 'Productos y artículos de plástico en México',
    description: 'Encuentra cajas, cestas, botes y accesorios de plástico. Compara tamaños, materiales y compras al mayoreo con proveedores en México.',
    introduction: 'Consulta artículos de plástico listos para utilizar y compara la referencia exacta de cada modelo. Comprueba medidas y presentación antes de pedir precios al mayoreo.',
    variants: 'Cajas, cestas, botes y accesorios. Algunas referencias admiten colores, impresión o cambios de presentación: pregunta qué opciones existen y desde qué cantidad pueden fabricarse.',
    checklist: ['Modelo, medidas interiores y exteriores y material.', 'Unidades por empaque, colores y accesorios incluidos.', 'Disponibilidad confirmada, pedido mínimo y condiciones de entrega.'],
    article: 'que-revisar-en-una-tarima-de-plastico',
    related: ['tarimas-y-contenedores','cubetas-y-bidones'],
  },
};
