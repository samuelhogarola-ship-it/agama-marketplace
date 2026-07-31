# Visión — TodoPlástico

## La idea en una frase

Un directorio B2B gratuito donde las empresas del sector plástico publican anuncios, los compradores las encuentran y TodoPlástico se convierte en el punto de referencia del sector, impulsado por AGAMA.

## Por qué

1. **Visibilidad de marca:** cada proveedor y comprador del sector plástico conoce TodoPlástico y su respaldo de AGAMA.
2. **Datos de valor:** quién vende qué, qué se busca, qué categorías tienen demanda, precios de mercado, leads cualificados para el negocio principal de AGAMA (pigmentos, masterbatch, aditivos).
3. **Monetización futura:** destacados, publicidad del sector y servicios para empresas.

El marketplace **no compite** con el negocio principal: pigmentos, masterbatch y aditivos están prohibidos en la plataforma precisamente para no dar escaparate a competidores de AGAMA.

## Usuarios

- **Vendedor (perfil profesional):** fabricante, distribuidor o recuperador de productos plásticos en CDMX/área metropolitana. Se registra con datos de empresa (razón social, RFC opcional en v1, dirección, teléfono verificado).
- **Comprador:** puede navegar sin cuenta y contactar por web, teléfono, WhatsApp o email público.
- **Admin AGAMA:** panel de revisión de moderación, métricas, gestión de usuarios.

## Alcance funcional v1 (MVP)

1. Registro/login de perfil profesional (email + verificación).
2. Ficha de empresa pública (logo, descripción, ubicación, categorías).
3. Publicar producto: título, descripción, categoría, precio (u "a consultar"), hasta 5 fotos, ubicación.
4. Límite de 5 productos activos por cuenta (free).
5. Catálogo público con búsqueda y filtros (categoría, zona, precio).
6. Contacto externo desde la ficha de empresa o anuncio.
7. Watcher IA: modera cada anuncio (texto + imágenes). Ver [moderacion-ia.md](moderacion-ia.md).
8. Panel admin mínimo: cola de moderación, bloquear usuario/producto.

**Fuera de v1:** pagos de productos, envíos, plan Pro/Stripe, valoraciones/reseñas, app móvil, perfiles particulares.

## Taxonomía de categorías (borrador)

Envases y botellas · Bolsas y película · Tarimas y contenedores industriales · Cubetas y bidones · Perfiles y láminas · Tubería y conexiones · Plástico reciclado / molido / paca · Resinas vírgenes y reprocesadas · Maquinaria y refacciones para plástico · Productos terminados (hogar, jardín, construcción) · Servicios (inyección, soplado, rotomoldeo, peletizado a maquila)

> Prohibidos como categoría o producto: **pigmentos, masterbatch, aditivos** (concentrados de color, estabilizantes UV, antioxidantes, retardantes de flama como producto en venta, etc.).

## Modelo de datos (núcleo)

- `profiles` — empresa, contacto, estado (activo/bloqueado), plan (free/pro)
- `products` — datos de ficha, `status`: `draft → pending_review → published / rejected / paused / blocked`
- `product_photos` — máx. 5 por producto (constraint en BD, no solo en UI)
- `conversations` / `messages` — mensajería, con `moderation_status` por mensaje
- `moderation_events` — veredicto IA, razón, score, revisión humana
- `search_queries` — log anónimo de búsquedas (el dato de demanda más valioso)

## Métricas de éxito

- Nº de proveedores registrados y con ≥1 producto publicado
- Nº de productos activos / categoría
- Conversaciones iniciadas por semana (proxy de transacciones)
- Búsquedas sin resultados (huecos de oferta → oportunidad comercial para AGAMA)
- % de publicaciones rechazadas por IA y % de falsos positivos (calidad del watcher)
