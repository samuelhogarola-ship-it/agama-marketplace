# Changelog

## [Unreleased]

### Moderación
- Los anuncios nuevos, editados o reactivados quedan en revisión sin llamar automáticamente a OpenAI.
- La valoración con IA solo puede iniciarla un administrador desde la cola y nunca publica ni rechaza: la decisión final continúa siendo humana.
- Las valoraciones se reutilizan mientras el contenido no cambie para evitar consumo duplicado de tokens.
- Una reserva atómica, renovable y ligada a un propietario por versión del anuncio impide que dos peticiones concurrentes consuman tokens duplicados; expira tras cinco minutos si una petición se interrumpe.
- La versión y propiedad de la reserva se vuelven a validar dentro de la misma transacción que guarda la recomendación IA, evitando registrar resultados obsoletos.
- Añadir, modificar o borrar una foto invalida la valoración IA anterior, y las señales de texto e imagen se conservan al combinar recomendaciones.

### Panel
- Los enlaces de navegación mantienen `preview=1`, incluso cuando contienen un fragmento como `#catalogo`.

### Pagos
- El inicio de Stripe valida en runtime que la URL y los errores recibidos sean texto antes de usarlos.

### Analytics
- Umami usa un fallback público y validado para la instancia Agama y el sitio TodoPlástico, evitando que un build de Coolify sin variables `NEXT_PUBLIC_*` elimine el tracker de producción.
- El tracker queda restringido a `todo-plastico.com` y `www.todo-plastico.com`.

### Security
- CSRF: añadida verificación `checkOrigin()` al endpoint `/api/moderate` (el único sin protección).
- CSP: eliminado `'unsafe-eval'` de `script-src` en producción.

### SEO
- Meta description del home recortada a ~155 chars (estaba en 208).
- OG image del layout raíz cambiada a 1200×630 (`og-default.png`).
- Títulos de `/categorias` y `/empresas` acortados a ≤60 chars.
- Añadido `lastModified` a todas las páginas estáticas del sitemap.
- `generateStaticParams` añadido a `/e/[slug]` y `/p/[slug]` para pre-render en build.
- Logos de empresa migrados de `<img>` a `next/image` en páginas públicas.

### Code quality
- Constantes de formulario (`FIELD_CLASS`, `LABEL_CLASS`, `SELECT_CLASS`) extraídas a `src/lib/form-classes.ts`.
- `DEMO_PREVIEW_ENABLED` centralizado en `src/lib/demo-data.ts` (antes duplicado en 3 archivos).
- Focus ring unificado en la página de edición (`focus-visible:ring-2`).

### Fixed — soft-404 en todas las rutas dinámicas
- `src/app/loading.tsx` envolvía la aplicación entera en un límite de Suspense. Next volcaba la cabecera con status 200 antes de renderizar el contenido, así que cualquier `notFound()` o `redirect()` posterior pintaba su UI pero **no podía cambiar el código HTTP**: `/c/*`, `/p/*`, `/e/*` y `/articulos/*` inexistentes devolvían 200 en vez de 404, y el redirect canónico de `/p/[slug]` devolvía 200 en vez de 308.
- Eliminado el `loading.tsx` de la raíz. El spinner vive ahora en `src/components/RouteLoading.tsx` y se reutiliza desde `/buscar`, `/empresas` y `/categorias` — segmentos que no contienen rutas con `notFound()`. `/panel` conserva su propio skeleton.
- El smoke test de 404 comprobaba el texto de la página, no el status, y por eso el fallo pasó desapercibido. Añadidos dos tests que verifican el código HTTP: 404 real en cinco rutas inexistentes y 308 con `Location` correcto en una ficha con slug incorrecto.

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
