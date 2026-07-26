# Roadmap — AGAMA Marketplace

Fases secuenciales; cada fase termina con tests Playwright en verde y deploy a staging.

## Fase 0 — Fundaciones (1 semana)

- [x] Repo + gobernanza (CLAUDE.md, ramas + PR, CHANGELOG)
- [ ] Elegir stack definitivo (propuesta en [stack.md](stack.md)) y scaffold del proyecto
- [x] Supabase (auth, Postgres, Storage) — temporalmente en el proyecto `studio-panel` con prefijo `mkt_` (límite del plan free); ver CLAUDE.md
- [ ] **Bloqueante de Fase 4:** migrar la BD a un proyecto Supabase propio (pausar/upgrade y `pg_dump -t 'public.mkt_*'`)
- [ ] CI (GitHub Actions): lint + typecheck + Playwright smoke en cada PR
- [ ] Pre-commit hooks activos (ver `.pre-commit-config.yaml`)
- [ ] Hosting: **Vercel** (decidido). Primero en subdominio `*.vercel.app`; después se conecta uno de los dominios propios ya registrados (cuál, pendiente de elegir)

## Fase 1 — MVP catálogo (3–4 semanas)

- [ ] Auth: registro/login profesional con verificación de email
- [ ] Onboarding de empresa: ficha, logo, ubicación, categorías
- [ ] CRUD de productos con límite de 5 activos (constraint en BD) y 5 fotos (constraint en BD)
- [ ] Subida de imágenes a Supabase Storage con compresión/resize
- [ ] Catálogo público: home, categorías, buscador, filtros, ficha de producto
- [ ] SEO base: SSR/SSG, metas, sitemap, robots, Schema.org (ver [seo.md](seo.md))
- [ ] Log de búsquedas (`search_queries`)

**Gate de salida:** un proveedor real puede registrarse y publicar; un comprador encuentra el producto por Google y por el buscador interno.

## Fase 2 — Watcher IA (2 semanas, en paralelo con final de F1)

- [ ] Pipeline de moderación pre-publicación: texto + imágenes (ver [moderacion-ia.md](moderacion-ia.md))
- [ ] Estados de producto (`pending_review → published/rejected`) con motivo visible al vendedor
- [ ] Cola de revisión humana en panel admin para casos dudosos
- [ ] Re-escaneo al editar producto
- [ ] Métricas de moderación (tasa de rechazo, falsos positivos)

**Gate de salida:** imposible publicar pigmentos/masterbatch/aditivos o contenido ajeno al plástico sin revisión.

## Fase 3 — Mensajería (2 semanas)

- [ ] Conversaciones comprador ↔ vendedor (Supabase Realtime)
- [ ] Notificaciones por email (Resend) con resumen, sin exponer emails entre partes
- [ ] Moderación IA de mensajes (mismo watcher, modo ligero)
- [ ] Anti-spam: límite de conversaciones nuevas/día para cuentas recientes, reportar/bloquear

## Fase 4 — Lanzamiento CDMX (2 semanas)

- [ ] Carga inicial de oferta: invitar proveedores conocidos de AGAMA (objetivo: 30–50 proveedores, 150+ productos antes de anunciar)
- [ ] Landing pages SEO por categoría y por zona
- [ ] Analytics (Plausible/GA4) + dashboard interno de métricas de éxito
- [ ] Legal: términos de uso, aviso de privacidad (LFPDPPP México), política de contenido

## Fase 5 — Monetización Pro (posterior)

- [ ] Plan Pro con Stripe (suscripción): >5 productos, destacados, estadísticas de ficha
- [ ] Enforcement de límites free/pro en BD y UI
- [ ] Facturación (CFDI) — evaluar proveedor

## Fase 6 — Crecimiento (continuo)

- [ ] Reseñas/valoraciones de proveedores
- [ ] Alertas de demanda ("avísame cuando haya X")
- [ ] Informes de mercado con los datos agregados (producto de datos para AGAMA)
- [ ] Expansión geográfica más allá de CDMX
