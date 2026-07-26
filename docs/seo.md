# Estrategia SEO — AGAMA Marketplace

## Objetivo

Capturar búsquedas transaccionales del sector plástico en CDMX: "tarimas de plástico cdmx", "venta de plástico molido", "cubetas de plástico mayoreo", "proveedores de envases de plástico ciudad de méxico".

## Arquitectura de URLs (el SEO se decide aquí)

```
/                                → home (marketplace de plásticos en CDMX)
/c/{categoria}                   → landing de categoría (ej. /c/tarimas-y-contenedores)
/c/{categoria}/{zona}            → categoría + alcaldía/zona (ej. /c/tarimas-y-contenedores/iztapalapa)
/p/{slug-producto}-{id}          → ficha de producto
/e/{slug-empresa}                → ficha de proveedor
/blog/{slug}                     → contenido editorial (fase 4+)
```

- Todo renderizado en servidor (SSR/SSG) — nada de catálogo client-side-only.
- Slugs en español, sin acentos, con guiones.
- Productos despublicados → `410` o redirect a su categoría (no 404 masivos).

## Páginas de categoría = arma principal

Cada landing de categoría lleva: H1 con keyword + "CDMX", texto único de 150–300 palabras (qué es, usos, cómo comprar), listado de productos, FAQ corta. Son las páginas que posicionan; las fichas de producto rotan demasiado.

## Datos estructurados (JSON-LD)

- Ficha de producto: `Product` + `Offer` (precio o `priceSpecification` omitido si "a consultar") + `ItemList` en categorías.
- Ficha de empresa: `LocalBusiness` con dirección y zona.
- Home: `WebSite` + `SearchAction` (sitelinks searchbox).
- Blog: `Article` + `FAQPage` donde aplique.

## Dominio y lanzamiento

El desarrollo/staging vive en `*.vercel.app`, pero ese subdominio **no debe indexarse nunca** (`X-Robots-Tag: noindex` mientras no haya dominio final). El dominio definitivo (uno de los ya registrados) debe estar conectado **antes** del lanzamiento público de Fase 4: cambiar de dominio con el catálogo ya indexado obliga a una migración con 301 y pérdida temporal de posiciones. Elegir el dominio es, por tanto, un bloqueante de Fase 4, no de Fase 0.

## Técnico

- `sitemap.xml` dinámico segmentado (categorías / productos / empresas), ping en publicación.
- `robots.txt`: bloquear `/admin`, `/mensajes`, parámetros de filtro; permitir el resto.
- Canonical en fichas y categorías (los filtros no generan URLs indexables).
- Imágenes: WebP + `alt` generado desde título/categoría, lazy-load, tamaños fijos (CLS).
- Core Web Vitals presupuesto: LCP < 2.5s móvil en fichas y categorías.
- Idioma: solo `es-MX` en v1 — sin hreflang hasta que haya EN.

## Contenido (fase 4+)

Blog orientado a demanda: guías de compra ("cómo elegir tarimas de plástico"), precios de mercado, directorio por zona. Cada artículo enlaza a su categoría. Los datos de `search_queries` sin resultados dictan el calendario editorial.

## Medición

Search Console desde el día 1 + panel con: clics/impresiones por categoría, páginas indexadas, búsquedas internas sin resultado. KPI: 1.000 clics orgánicos/mes a los 6 meses del lanzamiento.
