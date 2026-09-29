# Programa SEO: implementación y medición

Actualización: 29/09/2026. Alcance nacional, organizado por producto. Se mantiene todo-plastico.com. El usuario confirma propiedad de todoplasticos.com, con DNS pendiente y prohibición expresa de redirigir todavía. SMTP/Supabase al final.

## Contenido desarrollado

Ocho fichas editoriales en `src/lib/family-editorial.ts`: título, descripción, introducción, variantes, criterios para cotizar y enlaces. En las páginas de categoría, el catálogo conserva prioridad y el contenido ampliado aparece tras él, solo en la primera página sin filtros.

Cuatro actualizaciones sobre URLs existentes, sin crear duplicados:
- `/articulos/como-elegir-un-envase-plastico-para-tu-producto`
- `/articulos/como-elegir-proveedor-bolsas-plasticas`
- `/articulos/que-revisar-en-una-tarima-de-plastico`
- `/articulos/termoformado-vs-inyeccion-que-conviene`

Fechas originales conservadas; revisión del 29/09/2026 indicada en contenido, datos estructurados y sitemap. Fuentes de fabricantes incluidas; no acreditan a los anunciantes ni permiten afirmar disponibilidad, compatibilidad o resistencia sin la ficha concreta.

La comparativa de competidores y las consultas orientativas permanecen en la propuesta aprobada. No se presentan como volúmenes de búsqueda medidos.

## Eventos Umami

- `content_catalog_click`: clic desde guía hacia categoría. Propiedades `article_slug`, `category`.
- `catalog_listing_click`: clic de tarjeta de anuncio. Propiedades `listing_id`, `category`; la URL registrada por Umami identifica la página de origen.
- `contact_click`: existente, intención de contacto externo, no venta.
- `search`: existente, búsquedas internas.

No se envían emails, teléfonos, RFC ni nombres personales en los nuevos eventos. Los slugs son los de contenido público. Umami debe estar cargado: navegación disponible también cuando un bloqueador impide la analítica. Las pruebas de navegador usan un receptor simulado, sin contaminar producción; no demuestran recepción en el servidor real.

## Verificación y dos cortes

Inicio: guardar fecha real de publicación, configuración y línea base de páginas/eventos de la propiedad `6e0256c7-fb46-4ed1-bfd8-fa030d599504`. Se necesita acceso autenticado a Umami para leer esa línea base.

Corte 1, al cierre del primer mes: recepción de eventos, visitas a las ocho familias y cuatro guías, clics a catálogo, fichas y contacto; consultas sin resultados. Corte 2, al cierre del segundo mes: comparar periodos de igual duración, anotar cambios de catálogo/campañas y separar pruebas. No se generan cifras de periodos que aún no han transcurrido.

Los agregados por página no prueban un recorrido individual completo. Search Console complementa consultas, impresiones e indexación, con acceso a su propiedad pendiente.

Registro confirmado y primera publicación aprobada: pendientes del bloque autenticado. Requieren una fuente de estado confirmada y deduplicación persistente; un clic en registrarse, una visita al panel o aprobar nuevamente un anuncio no son equivalentes. No se modifica la migración aplazada ni se simulan esos eventos.

Fuentes de instrumentación: https://docs.umami.is/docs/tracker-functions y https://docs.umami.is/docs/event-data.
