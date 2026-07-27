# Roadmap — AGAMA Marketplace

Fases secuenciales; cada fase termina con tests Playwright en verde y deploy a staging.

## Fase 0 — Fundaciones (1 semana)

- [x] Repo + gobernanza (CLAUDE.md, ramas + PR, CHANGELOG)
- [x] Stack definitivo: Next.js 15 App Router + TypeScript + Tailwind 4 (ver [stack.md](stack.md))
- [x] Supabase (auth, Postgres, Storage) — temporalmente en `studio-panel` con prefijo `mkt_`; ver CLAUDE.md
- [ ] **Bloqueante de Fase 4:** migrar BD a proyecto Supabase propio (`pg_dump -t 'public.mkt_*'`)
- [ ] CI (GitHub Actions): lint + typecheck + Playwright smoke en cada PR
- [x] Playwright smoke suite (9 tests en desktop + mobile)
- [x] Hosting: Vercel desplegado en `agama-marketplace.vercel.app`
- [ ] Dominio propio: pendiente de elegir entre los dominios existentes

## Fase 1 — MVP catálogo (3–4 semanas)

- [x] Auth: magic link + contraseña; callback PKCE; middleware de protección de rutas
- [x] Onboarding de empresa: ficha autocreada en primer acceso, editable (`/panel/perfil`)
- [x] CRUD de productos con límite 5 activos en BD (trigger) y 5 fotos en BD (trigger)
- [x] Subida de imágenes a Supabase Storage (MIME-based extension, path validation)
- [ ] **Compresión/resize de imágenes antes de subir** (pendiente)
- [ ] **Editar producto** — no hay UI de edición todavía
- [x] Catálogo público: home con categorías, búsqueda con log de demanda, ficha de producto, ficha de empresa
- [x] SEO: SSR, metas, sitemap, robots, Schema.org Product + LocalBusiness + ItemList
- [x] Log de búsquedas en `mkt_search_queries`
- [x] Branding AGAMA: top bar + header + footer "Un servicio de AGAMA"
- [x] Legal: términos, privacidad, política de contenido, cookie banner
- [x] Seguridad: RLS completo, XSS (JSON-LD), filter injection, headers HTTP, phone privacy

**Gate de salida:** un proveedor real puede registrarse y publicar; un comprador encuentra el producto por Google y por el buscador interno.
→ **Bloqueante real:** SMTP de Supabase sin configurar (signup/magic link no mandan emails).

## Fase 2 — Watcher IA (2 semanas, en paralelo con final de F1)

- [x] Capa 1 — reglas duras en BD (`mkt_moderate_text`): pigmentos/masterbatch/aditivos, datos de contacto
- [x] Capa 2 — Claude Haiku texto: clasificación semántica, confianza, categoría detectada
- [x] Capa 3 — Claude Haiku visión: scan de imágenes (solo si texto pasa)
- [x] Pipeline en Next.js API route (`/api/moderate`); sin dependencia de Edge Functions
- [x] `mkt_submit_product` como única vía a `published` (SECURITY DEFINER + veredicto externo)
- [x] Log en `mkt_moderation_events` (source, confidence, model, violations)
- [x] Motivo de rechazo visible al vendedor en el panel
- [ ] **Cola de revisión humana** — panel admin para casos `pending_review` (falta UI)
- [ ] Re-escaneo al editar producto
- [ ] Métricas de moderación (tasa de rechazo, falsos positivos)

**Gate de salida:** imposible publicar pigmentos/masterbatch/aditivos sin revisión.
→ **Bloqueante real:** `ANTHROPIC_API_KEY` pendiente de añadir en Vercel (sin ella solo actúa capa 1).

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
