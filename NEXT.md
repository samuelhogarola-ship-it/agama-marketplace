# NEXT — AGAMA Marketplace (2026-07-27)

## Estado actual: ~55% del MVP lanzable

```
Fase 0 Fundaciones   ██████████░░  90%  ✓ (falta CI y dominio propio)
Fase 1 Catálogo      ████████░░░░  70%  ✓ (falta SMTP, editar producto, resize)
Fase 2 Watcher IA    ████████░░░░  70%  ✓ (falta panel admin + ANTHROPIC_API_KEY en Vercel)
Fase 3 Mensajería    ███░░░░░░░░░  25%  (schema + triggers listos, UI pendiente)
Fase 4 Lanzamiento   ░░░░░░░░░░░░   0%
Fase 5 Monetización  ░░░░░░░░░░░░   0%
```

---

## Bloqueantes para onboardear el primer proveedor real

Estas dos cosas hay que hacerlas en el dashboard — no requieren código:

### 1. SMTP en Supabase (BLOQUEANTE DURO)
Sin esto, signup y magic link no mandan emails. Nadie puede registrarse.

→ Supabase dashboard → proyecto `iaglqispczaoduoodzwx` → Authentication → SMTP Settings  
→ Host: `smtp.resend.com` · Puerto: 465 · Usuario: `resend` · Password: API key de Resend

### 2. ANTHROPIC_API_KEY en Vercel
Sin esto, la moderación IA (capas 2 y 3) no corre — solo actúa el regex.

→ Vercel dashboard → proyecto `agama-marketplace` → Settings → Environment Variables  
→ Añadir: `ANTHROPIC_API_KEY` = tu API key de Anthropic (solo Production + Preview, no browser)

---

## Siguiente bloque de código recomendado (~1 jornada)

### A. Editar producto
No existe UI para editar un producto publicado/rechazado. Un vendedor que recibe un rechazo no puede corregirlo sin eliminar y republicar.

Ruta nueva: `/panel/productos/[id]/editar` — mismo form que publicar, precargado.  
Al guardar: `status → draft`, fotos actualizadas, llama `/api/moderate` al submit.

### B. Compresión de imágenes antes de subir
Hoy se sube el archivo original (pueden ser 8 MB JPGs). Añadir resize en el cliente antes del `storage.upload()`:

```ts
// En publicar/page.tsx, antes del upload loop
const compressed = await compressImage(file, { maxWidth: 1200, quality: 0.8 });
```

Librería sugerida: `browser-image-compression` (2 KB gzip, zero deps).

### C. Cola de revisión humana (panel admin básico)
Productos que la IA deja en `pending_review` no tienen destino — quedan bloqueados.

Ruta nueva: `/admin` (protegida por rol en JWT o por email hardcodeado).  
Vista: lista de productos `pending_review` con título, categoría, motivo de duda, botones Aprobar/Rechazar.  
Acción: llama `mkt_submit_product(id, 'approve'|'reject', reason)` con service_role o sesión admin.

---

## Fase 3 — Mensajería (siguiente fase mayor)

El schema ya existe (`mkt_conversations`, `mkt_messages`, triggers de moderación y anti-spam).  
Lo que falta es toda la UI:

- `/mensajes` — lista de conversaciones del usuario (comprador o vendedor)
- `/mensajes/[id]` — hilo de mensajes con Supabase Realtime
- Botón "Contactar al vendedor" en ficha de producto (`ContactSellerButton` ya existe como componente vacío)
- Notificaciones por email (Resend) cuando llega un mensaje nuevo

Estimación: 1.5–2 jornadas.

---

## Pendientes menores

| Item | Dónde | Esfuerzo |
|------|-------|----------|
| Leaked password protection | Supabase Auth → Passwords → Enable | 1 min (dashboard) |
| CI (lint + typecheck + Playwright en cada PR) | `.github/workflows/ci.yml` | 1–2 h |
| `ALLOW_INDEXING=true` en Vercel | Solo después de conectar dominio propio | 2 min |
| Datos de prueba en producción | Supabase → limpiar user `test-mkt-vendor@example.com` y productos id 3/4 | 5 min |
| Favicon del marketplace | `src/app/favicon.ico` — usar isotipo AGAMA | 15 min |

---

## Decisión pendiente: dominio

Elige uno de los dominios existentes para el marketplace antes de Fase 4.  
Cambiar dominio después de indexar causa pérdida de ranking — hay que decidirlo antes de activar indexación.

Opciones sugeridas (si están disponibles): `plásticos.mx`, `agamamkt.com`, o un subdominio de `agama.com.mx` tipo `marketplace.agama.com.mx`.
