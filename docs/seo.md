# SEO — TodoPlásticos

## Objetivo y contenido
Descubrimiento B2B de fabricantes y productos plásticos a escala nacional en México. Sin landings por ciudad ni segmentación editorial por alimentación, cosmética, limpieza o logística.
Programa de dos meses: mes 1, envases/botellas, bolsas/película, tarimas/contenedores y cubetas/bidones; mes 2, perfiles/láminas, tubería/conexiones, empaques/embalaje y productos terminados. Estas ocho familias son la prioridad editorial; las demás categorías existentes se conservan.
Cuatro artículos previstos, dos por mes: elección de envases, bolsas/película, tarimas y empaques. Cada guía debe enlazar a su categoría y a proveedores reales. Su redacción pertenece al programa de contenido, no a este arreglo técnico.

## URLs e indexación
- Dominio actual: https://todo-plastico.com. No se cambia por el nombre comercial.
- Categorías `/c/{categoria}`, anuncios `/p/{slug}-{id}`, empresas `/e/{slug}`, artículos `/articulos/{slug}`.
- Cada página de paginación tiene canonical propio; página 1 y parámetros de seguimiento se normalizan a la URL limpia.
- Variantes de búsqueda, filtros y orden distinto del predeterminado: `noindex, follow`, canonical propio normalizado. No bloquearlas en robots: Google necesita leer el noindex.
- No crear redirecciones masivas de anuncios retirados hacia páginas irrelevantes. Mantener 404 cuando ya no hay contenido público equivalente.
- Sitemap: todas las filas públicas mediante paginación estable; lastmod solo con fechas reales. Si falla la base de datos, fallar la respuesta en vez de anunciar un sitemap incompleto como válido.
- Un sitemap XML admite 50.000 URLs: antes de alcanzar ese volumen, separar mediante índice de sitemaps. El arreglo actual elimina el recorte de la consulta a 5.000 filas; no implementa aún particiones XML.

## Datos estructurados
Anuncios Product, Service o CreativeWork según su tipo. Solo productos con precio numérico válido incluyen Offer. No se declara inventario sin un dato real de stock. Empresas como Organization con ubicación pública de texto; sin convertirla artificialmente en dirección postal ni publicar campos privados.

## Medición
Umami: visitas al perfil/anuncios y contactos atribuibles a cada empresa. Search Console complementa consultas, impresiones, clics e indexación; no son métricas disponibles por arte de magia en Umami. No se prometen posiciones ni volúmenes sin línea base.

Referencia: https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading
