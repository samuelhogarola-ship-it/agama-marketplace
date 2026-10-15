# Roadmap — TodoPlásticos

Estado actualizado: 13 de octubre de 2026. Las fases de producto están implementadas en código y la infraestructura del Supabase propio de TodoPlásticos está operativa. El trabajo activo es preparación de lanzamiento, verificación final de flujos y operación.

## Fase 0 — Fundaciones

Estado: **completa en código**.

- [x] Next.js 15 App Router, TypeScript y Tailwind 4.
- [x] Supabase con Auth, Postgres, Storage y prefijo `mkt_`.
- [x] Estructura de datos TodoPlásticos: empresas, anuncios, fotos, categorías, artículos, banners y moderación.
- [x] RLS, headers de seguridad, protección de rutas y sanitización de JSON-LD/filtros.
- [x] Sitemap, robots, metadatos SSR y rutas semánticas.
- [x] CI en pull requests: instalación limpia, typecheck, build y smoke Playwright.
- [x] Smoke Playwright en Chromium desktop.

Pendientes operativos antes de producción: configuración final de entorno seguro, usuario admin real, correos de Auth en producción, analítica, revisión legal y carga inicial de datos. SMTP activo con mailer interno Supabase mientras no se verifique un proveedor dedicado.

## Fase 1 — Directorio y catálogo B2B

Estado: **completa en código**.

- [x] Registro y login por magic link con callback PKCE.
- [x] Onboarding y edición de ficha profesional de empresa.
- [x] Publicar dirección separada con código postal obligatorio y autocompletado local: migración `0016_company_address.sql` aplicada en Supabase y guardado verificado en producción.
- [x] Directorio `/empresas` con búsqueda, categoría, ubicación y perfiles públicos.
- [x] Catálogo por categoría, buscador general y fichas públicas de anuncios.
- [x] CRUD de anuncios: publicar, editar, pausar, reactivar y eliminar.
- [x] Reenvío automático a moderación después de editar un anuncio publicado.
- [x] Límite de 5 anuncios activos y 5 fotos por anuncio aplicado en BD.
- [x] Compresión y resize de imágenes en cliente antes de subirlas.
- [x] Contacto externo por web, teléfono, email, WhatsApp y enlace de empresa.
- [x] Branding de TodoPlásticos e integración visible y sutil de AGAMA.
- [x] Textos legales y normas de comunidad adaptados al modelo no transaccional.

## Fase 2 — Moderación, contenido y operación

Estado: **completa en código**.

- [x] Capa 1: reglas duras para pigmentos, masterbatch, aditivos y datos de contacto en texto.
- [x] Capa 2: clasificación semántica con Claude Haiku y umbral conservador.
- [x] Capa 3: revisión visual de fotografías; si una capa falla, el anuncio queda pendiente.
- [x] Estados `published`, `rejected` y `pending_review` con motivos visibles.
- [x] Cola admin para aprobar/rechazar casos dudosos y métricas básicas de moderación.
- [x] Reescaneo al editar anuncios.
- [x] Portal editorial local con 5 artículos, páginas individuales y Schema.org Article.
- [x] Buscador ampliado a empresas, anuncios y contenido.
- [x] Sitemap ampliado a empresas, categorías y artículos.

## Fase 3 — Preparación de lanzamiento

Estado: **operativa en demo; pendiente de hardening y configuración de producción**.

### Estado de Supabase y migraciones

El proyecto Supabase propio de TodoPlásticos está vinculado y sincronizado hasta la migración `0016_company_address.sql`. El arreglo de guardado de ficha de empresa, teléfono por prefijo y dirección estructurada ya está en el código fusionado y se verificó en producción con una cuenta temporal de QA.

- [x] Migraciones de producción aplicadas hasta `0016`.
- [x] Guardado de perfil de empresa verificado en producción: login, guardado, recarga, persistencia en UI y fila en base de datos.
- [x] Autocompletado de dirección por código postal verificado contra el endpoint público.
- [ ] Antes de activar Stripe, repetir una prueba específica de webhook live/test y confirmar que el rol de servicio actualiza el plan sin chocar con las protecciones de columnas administrativas.

- [x] Migrar `mkt_*` a un proyecto Supabase propio y validar tablas, Storage y RLS inicial.
- [x] Separar envío a revisión de decisiones: solo `service_role` puede publicar o rechazar.
- [x] Bloquear escritura de eventos de moderación por anunciantes y cerrar la moderación si falla IA.
- [x] Validar callback de magic link y URLs de empresa en servidor.
- [x] Preparar Docker, healthcheck y configuración base para el VPS de AGAMA.
- [x] Configurar SMTP en Supabase Auth — usar mailer propio de Supabase (free, 2/h) hasta tener Resend/Brevo verificado.
- [ ] Añadir `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y `TODO_PLASTICO_ADMIN_EMAILS` en el entorno seguro.
- [ ] **Stripe (bloque aplazado).** Al activarlo: aplicar `0013`, añadir las cuatro claves (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) y **verificar con un evento de prueba que `mkt_is_service_role()` detecta bien el rol**. Si esa detección falla, el webhook choca contra `mkt_protect_company_admin_fields` y el plan no sube a Pro pese al cobro. Ese camino nunca se ha ejercitado.
- [ ] Crear usuario admin real y conectar las variables del nuevo Supabase en WF Studio.
- [ ] Instalar Plausible o GA4 con consentimiento y definir eventos de búsqueda/contacto.
- [x] Preparar seed repetible de categorías y perfil AGAMA.
- [x] Mantener el seed alineado con el catálogo aprobado.
- [ ] Cargar proveedores iniciales, anuncios reales y artículos revisados.
- [ ] Revisar legalmente términos, privacidad LFPDPPP y normas de comunidad.
- [ ] Conectar `todo-plastico.com`, activar indexación y verificar Search Console.
- [ ] Ejecutar smoke desktop + mobile y checklist de lanzamiento.

## Fase 4 — Evolución posterior

Fuera de la Fase 1 actual y sin implementación en este PR:

- [ ] Mensajería interna o solicitudes de presupuesto, si el modelo lo justifica.
- [ ] Favoritos, reseñas y alertas de demanda.
- [ ] Plan Pro, destacados y estadísticas para empresas.
- [ ] Analítica avanzada y expansión geográfica.

## Gates de entrega

Cada PR debe pasar:

```text
npm ci
npm run typecheck
npm run build
npx playwright test --project=chromium
```

El lanzamiento público añade los gates externos de Supabase propio, SMTP, claves IA, dominio, analítica, contenido real y revisión legal.
