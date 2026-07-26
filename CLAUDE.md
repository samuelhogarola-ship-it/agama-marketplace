# CLAUDE.md — Reglas para agama-marketplace

## Gobernanza

- Proyecto **separado** del repo AGAMA principal: no compartir código ni datos con el portal AGAMA.
- **BD temporal:** las tablas viven en el proyecto Supabase `studio-panel` (iaglqispczaoduoodzwx) con prefijo `mkt_` y RLS estricta, porque el plan free no permite un tercer proyecto (decisión del 2026-07-26). **Antes del lanzamiento público (Fase 4) hay que migrar a un proyecto Supabase propio** (`pg_dump -t 'public.mkt_*'` + bucket `mkt-photos`).
- No se trabaja directamente en `main`: rama feature + PR siempre.
- `CHANGELOG.md` es el changelog oficial; se actualiza en cada PR con cambios funcionales.
- `docs/vision.md` y `docs/roadmap.md` son la fuente canónica del alcance; no implementar nada fuera de la fase activa del roadmap sin acuerdo del propietario.

## Reglas de producto no negociables

- Límites free: **5 productos activos, 5 fotos por producto** — aplicados en BD (constraint/trigger), no solo en UI.
- **Pigmentos, masterbatch y aditivos prohibidos** en la plataforma (competencia de AGAMA). La lista de prohibidos vive en `docs/moderacion-ia.md` y en la config del watcher; mantenerlas sincronizadas.
- Nada se publica sin pasar por el pipeline de moderación (`pending_review` primero).
- Contacto solo por mensajería interna; no exponer emails/teléfonos entre usuarios.

## Seguridad

- Claves (Anthropic, Resend, Stripe, service_role de Supabase) solo en Edge Functions / variables de entorno del servidor. Nunca en cliente ni en el repo.
- RLS activada en todas las tablas desde el primer día.
- gitleaks corre en pre-commit; si detecta un secreto, rotarlo, no solo borrarlo del diff.

## Idioma

- UI y contenido: español (es-MX). Código e identificadores: inglés. Docs del repo: español.
