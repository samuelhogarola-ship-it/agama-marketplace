# Changelog

## [Unreleased]

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
