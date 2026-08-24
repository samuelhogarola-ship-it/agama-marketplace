# Changelog

## [Unreleased]

### Security
- Escapado de HTML en todos los correos salientes (`src/lib/email.ts`): asunto, email y mensaje del usuario se interpolaban sin sanear, lo que permitía inyectar enlaces arbitrarios en un correo enviado desde el dominio propio (vector de phishing hacia el admin y hacia el usuario).
- Rate limiting en la apertura (5/hora) y respuesta (10/10 min) de tickets, que hasta ahora disparaban un correo por petición sin ningún límite.

### Fixed
- La home no declaraba `title` ni `description` propios y heredaba los genéricos del layout; además la descripción del JSON-LD no coincidía con la meta description. Ahora ambas salen de una constante única.
- Formulario de publicación: los 13 controles no tenían etiqueta asociada (`htmlFor`/`id`), por lo que un lector de pantalla los anunciaba sin nombre. Añadido también indicador de foco visible, `aria-pressed` en las subcategorías y `role="alert"` en el mensaje de error.

### Changed
- Rate limiter extraído a `src/lib/rate-limit.ts` y compartido entre moderación y tickets; ahora purga entradas vencidas en lugar de crecer sin límite.
- `checkOrigin` ya no deja pasar peticiones sin cabecera `Origin`: cae a `Sec-Fetch-Site` y rechaza si no hay ninguna de las dos. No aplica a webhooks, que se autentican por firma.
- El modo demo del panel (`?preview=1`, que salta la autenticación y muestra datos ficticios) queda tras el flag `NEXT_PUBLIC_DEMO_PREVIEW`. Afecta a `/panel`, `/panel/perfil` y `/panel/editar/[id]`.
- Indicador de foco visible en los 26 campos de formulario del sitio: el patrón anterior anulaba el outline y lo sustituía por un cambio de borde de 1px.

### Fixed (cont.)
- `/p/[slug]` servía la misma ficha para cualquier slug con el id correcto (`parseId` solo mira los dígitos finales). Ahora redirige 308 a la URL canónica en lugar de multiplicar variantes indexables.
- Carrera TOCTOU en los triggers de límite (`0012`): dos inserts concurrentes podían superar los 5 anuncios o las 5 fotos. Añadido lock de fila sobre la entidad padre antes de contar.
- Webhook de Stripe (`0013`): sin deduplicación, un reintento de Stripe reprocesaba el evento; sin guarda de orden, un `subscription.updated` retrasado resucitaba el plan Pro tras un `deleted`. Añadida tabla `mkt_stripe_events` con el id como PK y la función `mkt_apply_stripe_event`, que comprueba el orden y escribe en la misma transacción.
- `mkt_protect_company_admin_fields` detectaba service_role solo por `request.jwt.claim.role`, una ruta de claim legacy. Si el runtime no la puebla, el webhook chocaría contra su propia protección y el plan nunca subiría a Pro pese al cobro. Sustituido por el helper `mkt_is_service_role()`, que acepta las cuatro formas posibles. **Sin verificar contra la BD**: Stripe no está configurado y este camino nunca se ha ejercitado.
- Promesa flotante sin `catch` externo en la notificación de respuesta de tickets.

### Added — MVP funcional (Fase 1 + parte de F2/F3)
- App Next.js 15 (App Router, TS, Tailwind 4) con marca AGAMA (logo oficial, paleta navy/azul) arriba y abajo.
- Catálogo público SSR: home, categorías, landing por categoría, ficha de producto (JSON-LD Product), ficha de empresa (LocalBusiness), búsqueda con log de demanda.
- Auth Supabase: registro profesional, login con contraseña **y** magic link (`/auth/callback`).
- Panel de vendedor: CRUD de productos (límite 5 + 5 fotos aplicado en BD), ficha de empresa, estados con motivo de rechazo.
- Mensajería interna comprador↔vendedor con moderación por mensaje.
- Watcher capa 1 en BD (`mkt_moderate_text` + `mkt_submit_product` SECURITY DEFINER): rechaza pigmentos/masterbatch/aditivos y datos de contacto; RLS impide publicar sin moderación.
- Esquema completo en Supabase (`supabase/migrations/0001`, prefijo `mkt_`, exportable) + bucket `mkt-photos`.
- Legal: términos, aviso de privacidad (LFPDPPP) y cookies + banner de consentimiento.
- SEO: metas, canonical, sitemap dinámico, robots, noindex global hasta dominio final.
- Playwright: suite smoke (9 tests) verde.

### Added
- Definición del proyecto: visión, roadmap por fases, especificación del watcher IA, estrategia SEO y stack propuesto (`docs/`).
- Gobernanza del repo (`CLAUDE.md`): ramas + PR, límites de producto no negociables, seguridad.
- Tooling base: `.pre-commit-config.yaml` (gitleaks, no-commit-to-main), `playwright.config.ts`, workflow de CI.
