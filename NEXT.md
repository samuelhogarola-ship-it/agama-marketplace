# NEXT — TodoPlástico (2026-08-10)

## Auditoría completa — Findings

Auditoría realizada 2026-08-10. Tres ejes: seguridad, consistencia funcional, calidad de código.

---

## HIGH — Resolver antes del lanzamiento

### H1. Artículos editoriales violan la política de contenido prohibido
- **Archivos:** `src/lib/articles.ts` (líneas ~96-185, 344-360, 517-533, 708-724)
- **Problema:** La plataforma prohíbe pigmentos, masterbatch y aditivos (competencia de AGAMA), pero hay ~6 artículos SEO dedicados exactamente a esos temas: "masterbatch vs pigmento", "aditivos UV", "dispersión de color", etc. La categoría editorial "Color y pigmentos" también nombra directamente el producto prohibido.
- **Impacto:** Contradice la política de negocio y posiciona la plataforma para keywords que compiten con AGAMA.
- **Fix:** Eliminar o reescribir esos artículos para enfocarlos en el cliente (transformador), no en el producto AGAMA.

### H2. Open redirect en `/ingresar`
- **Archivo:** `src/app/ingresar/page.tsx` (~línea 29)
- **Problema:** El parámetro `next` de la URL se pasa directamente a `router.push()` sin validación. Un atacante puede construir `https://todo-plastico.com/ingresar?next=https://evil.com` y redirigir al usuario tras login.
- **Fix:** Validar que `next` empiece con `/` y no contenga `//`.

### H3. No hay headers de seguridad (CSP/HSTS)
- **Archivo:** `next.config.ts`
- **Problema:** No se configuran Content-Security-Policy ni Strict-Transport-Security.
- **Fix:** Añadir `headers()` en `next.config.ts` con CSP restrictiva y HSTS.

### H4. Resend SMTP no verificado — auth emails no funcionan
- **Problema:** Ni `agamaeu.com` ni `todo-plastico.com` tienen registros DKIM/SPF de Resend. Signup devuelve 500.
- **Fix:** En resend.com/domains → Añadir `send.todo-plastico.com` → copiar DNS records a IONOS → verificar → actualizar SMTP en Supabase Auth.

---

## MEDIUM — Resolver para calidad de producción

### M1. `/admin` no valida rol de administrador
- **Archivo:** `middleware.ts:30-38`
- **Problema:** La ruta `/admin` solo verifica que hay sesión autenticada, no que el usuario tenga rol admin. Cualquier usuario registrado puede acceder al panel de moderación.
- **Fix:** Verificar email/rol contra una lista de admins (env var o tabla).

### M2. Rate limiting solo in-memory y parcial
- **Archivo:** `src/app/api/moderate/route.ts:7-19`
- **Problema:** Rate limit en memoria (se resetea con cada deploy/restart). No hay rate limiting en auth ni en búsqueda.
- **Fix:** Usar Supabase rate limiting o un store persistente.

### M3. Fallo silencioso en upload de fotos
- **Archivos:** `src/app/panel/publicar/page.tsx:83-91`, `src/app/panel/editar/[id]/page.tsx:260-269`
- **Problema:** Si la subida de fotos falla (red, cuota, RLS), el error se ignora. El anuncio se crea sin fotos y sin aviso al usuario.
- **Fix:** Mostrar error al usuario cuando falla el upload.

### M4. Admin queue se puede quedar stuck
- **Archivo:** `src/components/AdminQueue.tsx:43-68`
- **Problema:** `approve()` y `submitReject()` no tienen `try/catch`. Si la red falla, `setBusy(null)` nunca ejecuta y el botón queda deshabilitado permanentemente.
- **Fix:** Envolver en try/catch, mostrar error, resetear busy.

### M5. Búsqueda usa `ARTICLES` en vez de `PUBLISHED_ARTICLES`
- **Archivo:** `src/app/buscar/page.tsx:6`
- **Problema:** La búsqueda devuelve artículos no publicados. Si alguno tiene `published: false`, el link lleva a 404.
- **Fix:** Cambiar import a `PUBLISHED_ARTICLES`.

### M6. Sin CSRF/origin check en rutas admin POST
- **Problema:** Las rutas POST de admin no validan el header Origin/Referer.
- **Fix:** Middleware que valide origin en mutations.

### M7. Referencias obsoletas a categorías eliminadas
- **Archivos:** `docs/vision.md`, `src/app/api/moderate/route.ts` (prompt de IA)
- **Problema:** Mencionan maquinaria, resinas y servicios (categorías ya eliminadas).
- **Fix:** Actualizar docs y prompt de moderación.

### M8. Modales sin trap de foco ni Escape
- **Archivos:** `src/components/ListingGallery.tsx:65-140`, `src/components/AdminQueue.tsx:158-226`
- **Problema:** `role="dialog" aria-modal="true"` pero sin focus trap ni cierre con Escape (a diferencia de `MobileNav` que sí los implementa).
- **Fix:** Implementar focus trap y handler de Escape.

### M9. `categoryImages` duplicado en 2 archivos
- **Archivos:** `src/app/page.tsx:12-24`, `src/app/categorias/page.tsx:15-25`
- **Problema:** Mapa idéntico copiado. Cambiar imagen de categoría requiere editar ambos archivos.
- **Fix:** Mover a `src/lib/categories.ts`.

### M10. Admin dashboard ignora errores de queries
- **Archivo:** `src/app/admin/page.tsx:44-58`
- **Problema:** De 6 queries paralelas, solo se verifica el error de una. Las demás muestran "0" en vez de indicar fallo.
- **Fix:** Verificar todos los errores.

---

## LOW — Mejoras de calidad

### L1. Rutas `/mensajes` son stubs (redirect a `/`)
- **Archivos:** `src/app/mensajes/page.tsx`, `src/app/mensajes/[id]/page.tsx`
- **Problema:** Rutas vacías que solo hacen `redirect("/")`. Middleware las protege innecesariamente.
- **Acción:** Eliminar rutas y protección de middleware hasta que se implemente Fase 3.

### L2. `docs/seo.md` documenta ruta inexistente
- **Problema:** Describe patrón `/c/{categoria}/{zona}` que no existe en el código.
- **Fix:** Eliminar referencia o marcar como futuro.

### L3. Variable `ALLOW_INDEXING` muerta
- **Archivo:** `.env.example`
- **Problema:** La variable ya no se usa en el código.
- **Fix:** Eliminar de `.env.example`.

### L4. `void supabase.insert()` sin error handling en búsqueda
- **Archivo:** `src/app/buscar/page.tsx:51`
- **Problema:** Fire-and-forget sin `.catch()` — puede producir unhandled promise rejection.
- **Fix:** Añadir `.catch(() => {})` o await con manejo.

### L5. Falta canonical en homepage
- **Archivo:** `src/app/page.tsx`
- **Problema:** Todas las páginas de contenido tienen canonical excepto la home.
- **Fix:** Añadir `alternates: { canonical: "/" }` al metadata.

### L6. Polling 2s para consent de cookies
- **Archivo:** `src/components/Analytics.tsx:11-21`
- **Problema:** `setInterval` cada 2s para verificar localStorage. Mejor usar CustomEvent.
- **Fix:** Disparar evento custom desde `CookieBanner.decide()`.

### L7. Subcategorías inconsistentes entre SUBCATEGORIES y SUGGESTIONS
- **Archivo:** `src/lib/categories.ts`
- **Problema:** Labels difieren entre los dos mapas para las mismas categorías.
- **Fix:** Sincronizar labels.

### L8. N+1 en conteo de categorías
- **Archivo:** `src/app/categorias/page.tsx:29-38`
- **Problema:** 11 queries separadas (una por categoría) en vez de un count agrupado.
- **Fix:** RPC o query agrupada.

### L9. Formularios publicar/editar duplicados (~90% código común)
- **Archivos:** `src/app/panel/publicar/page.tsx`, `src/app/panel/editar/[id]/page.tsx`
- **Acción:** Extraer componente compartido `ListingForm`.

### L10. Type aliases duplicados (`Product`/`Listing`, `Profile`/`Company`)
- **Archivo:** `src/lib/types.ts:44-50`
- **Problema:** Dos nombres para el mismo tipo dificulta búsquedas.
- **Acción:** Unificar en un refactor futuro.

### L11. Eslint-disable sin uso
- **Archivo:** `src/components/MobileNav.tsx:87`
- **Fix:** Eliminar `// eslint-disable-line jsx-a11y/no-autofocus`.

### L12. Logo `todoplastico-logo.png` posiblemente huérfano
- **Archivo:** `public/todoplastico-logo.png`
- **Problema:** No se encontraron referencias en el código.
- **Acción:** Verificar si se usa en OG images o eliminar.

---

## Bloqueantes para el primer proveedor real

### 1. SMTP Resend (ver H4)
Sin esto, signup y magic link no mandan emails. Nadie puede registrarse.

**Pasos:**
1. resend.com/domains → Add Domain → `send.todo-plastico.com`
2. Copiar 3 CNAME (DKIM) + 1 TXT (SPF) + 1 MX a IONOS DNS
3. Verificar en Resend
4. Supabase dashboard → Auth → SMTP → Host: `smtp.resend.com`, Port: 465, User: `resend`, Pass: API key, Sender: `noreply@send.todo-plastico.com`

### 2. ANTHROPIC_API_KEY en servidor
Sin esto, la moderación IA (capas 2 y 3) no corre — solo actúa el regex.

→ Variable de entorno en Coolify/Docker: `ANTHROPIC_API_KEY=sk-ant-...`

---

## Progreso de resolución

| ID | Estado | Fecha | Notas |
|----|--------|-------|-------|
| H1 | ✅ resuelto | 2026-08-10 | 5 artículos "Color y pigmentos" despublicados |
| H2 | ✅ resuelto | 2026-08-10 | Validación de `next` en `/ingresar` |
| H3 | ✅ resuelto | 2026-08-10 | CSP + HSTS en `next.config.ts` |
| H4 | ⬜ pendiente | | Requiere acceso a Resend + IONOS DNS |
| M1 | ✅ ya mitigado | 2026-08-10 | `isAdminUser()` valida en cada página/API admin |
| M2 | ⬜ pendiente | | Rate limiting persistente requiere infra externa |
| M3 | ✅ resuelto | 2026-08-10 | Upload error feedback en publicar y editar |
| M4 | ✅ resuelto | 2026-08-10 | try/catch + error UI en AdminQueue |
| M5 | ✅ resuelto | 2026-08-10 | Búsqueda usa PUBLISHED_ARTICLES |
| M6 | ✅ resuelto | 2026-08-10 | Origin check en 3 rutas admin POST |
| M7 | ✅ resuelto | 2026-08-10 | vision.md y seo.md actualizados |
| M8 | ✅ resuelto | 2026-08-10 | Focus trap + Escape en lightbox y reject dialog |
| M9 | ✅ resuelto | 2026-08-10 | CATEGORY_IMAGES centralizado en categories.ts |
| M10 | ✅ resuelto | 2026-08-10 | Todos los errores de query se muestran en admin |
| L1 | ✅ resuelto | 2026-08-10 | Stubs /mensajes eliminados + middleware actualizado |
| L2 | ✅ resuelto | 2026-08-10 | Ruta /c/{cat}/{zona} eliminada de seo.md |
| L3 | ✅ resuelto | 2026-08-10 | ALLOW_INDEXING eliminado de .env.example |
| L4 | ✅ resuelto | 2026-08-10 | Promise rejection handled en búsqueda |
| L5 | ✅ resuelto | 2026-08-10 | Canonical en homepage |
| L6 | ✅ resuelto | 2026-08-10 | CustomEvent reemplaza polling 2s |
| L7 | ✅ no acción | 2026-08-10 | Labels distintos por diseño (tags vs. SEO suggestions) |
| L8 | ✅ resuelto | 2026-08-10 | N+1 → query única con agrupación client-side |
| L9 | ⬜ pendiente | | Refactor forms publicar/editar a componente compartido |
| L10 | ⬜ pendiente | | Unificar Product/Listing y Profile/Company |
| L11 | ✅ resuelto | 2026-08-10 | eslint-disable eliminado en MobileNav |
| L12 | ✅ no acción | 2026-08-10 | Logo para prompts Codex / OG futuro, se conserva |
