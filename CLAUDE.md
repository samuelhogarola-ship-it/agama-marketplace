# CLAUDE.md — Reglas para TodoPlástico

## Gobernanza

- Proyecto **separado** del repo AGAMA principal: no compartir código ni datos con el portal AGAMA.
- **BD temporal:** las tablas viven en el proyecto Supabase `studio-panel` (iaglqispczaoduoodzwx) con prefijo `mkt_` y RLS estricta, porque el plan free no permite un tercer proyecto (decisión del 2026-07-26). **Antes del lanzamiento público hay que migrar a un proyecto Supabase propio** (`pg_dump -t 'public.mkt_*'` + bucket `mkt-photos`).
- No se trabaja directamente en `main`: rama feature + PR siempre.
- `CHANGELOG.md` es el changelog oficial; se actualiza en cada PR con cambios funcionales.
- `docs/scope-fase1.md` es la fuente canónica del alcance actual. `docs/vision.md` y `docs/roadmap.md` deben mantenerse sincronizados con ese alcance.

## Reglas de producto no negociables

- TodoPlástico es una **plataforma B2B gratuita de descubrimiento**, no un marketplace transaccional.
- La marca visible es **TodoPlástico**, con texto **"Impulsado por AGAMA"**.
- Límites free: **5 anuncios activos, 5 fotos por anuncio** — aplicados en BD (constraint/trigger), no solo en UI.
- **Pigmentos, masterbatch y aditivos prohibidos** en la plataforma (competencia de AGAMA). La lista de prohibidos vive en `docs/moderacion-ia.md` y en la config del watcher; mantenerlas sincronizadas.
- Nada se publica sin pasar por el pipeline de moderación (`pending_review` primero).
- El contacto es **externo y público**: web, teléfono, email y WhatsApp en campos específicos de empresa/anuncio. No hay mensajería interna en Fase 1.
- No se permiten datos de contacto incrustados en título, descripción o imágenes: esos datos van en los campos dedicados.

## Seguridad

- Claves (Anthropic, Resend, Stripe, service_role de Supabase) solo en Edge Functions / variables de entorno del servidor. Nunca en cliente ni en el repo.
- RLS activada en todas las tablas desde el primer día.
- gitleaks corre en pre-commit; si detecta un secreto, rotarlo, no solo borrarlo del diff.

## Idioma

- UI y contenido: español (es-MX). Código e identificadores: inglés. Docs del repo: español.
