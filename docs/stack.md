# Stack técnico propuesto

Criterio: reutilizar lo que AGAMA ya domina (Supabase, Resend, Playwright) y añadir lo mínimo necesario para un marketplace con SSR.

| Capa | Elección | Por qué |
|---|---|---|
| Framework | **Next.js (App Router, TypeScript)** | SSR/SSG imprescindible para SEO de catálogo; ecosistema maduro. |
| BD + Auth + Storage + Realtime | **Supabase** (proyecto nuevo, separado del de AGAMA) | Ya se usa en AGAMA; RLS para multi-tenant; Realtime para chat; Storage para fotos. |
| Moderación IA | **Claude Haiku** vía Edge Functions de Supabase | Clasificación texto+imagen barata; lógica server-side, nunca en cliente. |
| Email | **Resend** | Ya en uso en AGAMA. |
| Pagos (fase 5) | **Stripe** (suscripción Pro) | Estándar; no hay pagos de productos en v1. |
| Hosting | **Vercel** (decidido) | Deploy por PR, previews, ISR. Lanzamiento en `*.vercel.app`; luego dominio propio (uno de los ya registrados, por elegir). |
| E2E | **Playwright** | Ya en uso en AGAMA. Ver `playwright.config.ts`. |
| Lint/format | ESLint + Prettier | Vía pre-commit y CI. |
| Analytics | Plausible (o GA4) | Decisión pendiente. |

## Decisiones clave

- **Constraints en BD, no solo en UI:** límite de 5 productos y 5 fotos como triggers/checks en Postgres; la UI solo refleja.
- **RLS estricta:** un perfil solo lee/escribe lo suyo; catálogo público vía vistas `published` únicamente.
- **Claves de IA y Resend solo en Edge Functions** — jamás expuestas al cliente.
- **Proyecto Supabase separado** del portal AGAMA existente: aislamiento de datos, facturación y riesgo.

## Calidad

- **Pre-commit** (`.pre-commit-config.yaml`): gitleaks (secretos), prettier, eslint, bloqueo de commit directo a `main`.
- **CI en cada PR:** typecheck + lint + Playwright smoke. Merge bloqueado si falla.
- **Playwright — suites previstas:**
  - `smoke`: home, categoría, ficha producto renderizan con datos seed
  - `auth`: registro, verificación, login, logout
  - `publish`: crear producto → queda `pending_review` → publicado tras aprobación mock; límite de 5 productos y 5 fotos se aplica
  - `moderation`: producto con "masterbatch" en título → rechazado con motivo
  - `messaging`: comprador contacta, vendedor responde, email notificación (mock)
  - `seo`: metas, JSON-LD válido y canonical en home/categoría/ficha
