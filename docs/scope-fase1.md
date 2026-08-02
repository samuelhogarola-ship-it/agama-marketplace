# TodoPlástico — Definición de Fase 1

> **Documento de alcance** | Dominio: todo-plastico.com | Fecha: 31 de julio de 2026 | Estado: implementado en código; dependencias de producción pendientes

---

## Contenido

1. [Objetivo redefinido](#1-objetivo-redefinido)
2. [Alcance cerrado — Fase 1](#2-alcance-cerrado--fase-1)
3. [Funciones excluidas](#3-funciones-excluidas-de-la-fase-1)
4. [Tipos de usuario](#4-tipos-de-usuario)
5. [Flujo de publicación](#5-flujo-de-publicación)
6. [Flujo de moderación automática](#6-flujo-de-moderación-automática)
7. [Estructura de datos](#7-estructura-de-datos)
8. [Arquitectura recomendada](#8-arquitectura-recomendada)
9. [Riesgos](#9-riesgos)
10. [Dependencias](#10-dependencias)
11. [Fases de desarrollo](#11-fases-de-desarrollo)
12. [Criterios de aceptación](#12-criterios-de-aceptación)

---

## 1. Objetivo redefinido

> **Posicionamiento:** TodoPlástico es una plataforma sectorial B2B gratuita orientada a tráfico y visibilidad, no un marketplace transaccional.

Construir un punto de entrada digital para profesionales, compradores y proveedores de la industria del plástico en México que combine:

- **Directorio de empresas** con perfiles públicos y datos de contacto.
- **Escaparate de productos, servicios y anuncios B2B** de publicación gratuita.
- **Portal de contenido editorial** útil sobre la industria.
- **Presencia destacada de AGAMA** como impulsor del proyecto.

La conversión se produce fuera de la plataforma: visita a la web del proveedor, llamada, correo, WhatsApp o formulario externo. TodoPlástico no intermedia ni gestiona transacciones.

### Relación con AGAMA

- Dominio, identidad visual, base de datos, usuarios y textos legales propios.
- La relación se muestra como *"Impulsado por AGAMA"* o *"Una iniciativa de AGAMA para la industria del plástico en México"*.
- AGAMA participa dentro de la plataforma como empresa fundadora, proveedor verificado, anunciante principal y referencia técnica.
- Espacios promocionales y enlaces estratégicos reservados para AGAMA.

---

## 2. Alcance cerrado — Fase 1

### Público

- Página principal con categorías destacadas, buscador y anuncios recientes.
- Portal de contenidos: artículos, guías, fichas técnicas. Categorías editoriales.
- Buscador general (productos, empresas, contenido).
- Directorio de empresas con listado y filtros.
- Perfil público de empresa: logo, descripción, ubicación, categorías, enlace a web, datos de contacto, listado de anuncios.
- Listado de productos/servicios/anuncios con filtros por categoría y ubicación.
- Ficha individual de anuncio: título, descripción, fotos, categoría, ubicación, datos de contacto de la empresa, enlace externo.
- Espacios promocionales de AGAMA (banner, sección destacada, empresa fundadora).

### Acceso autenticado

- Registro e inicio de sesión (email + contraseña; magic link).
- Panel privado de empresa: editar perfil, gestionar anuncios.
- Crear, editar y eliminar anuncios (hasta 5 activos, hasta 5 fotos por anuncio).
- Enlace a web propia de la empresa y datos de contacto externos visibles.
- Gestión de categorías y etiquetas en cada anuncio.

### Administración

- Panel de administración: cola de moderación, gestión de usuarios, gestión de contenido editorial.
- Moderación automática asistida por IA (ver sección 6).

### Transversal

- Diseño responsive (mobile-first).
- Arquitectura SEO: SSR, metas, sitemap, robots, Schema.org, URLs semánticas.
- Analítica básica (Plausible o GA4).
- Textos legales: términos de uso, aviso de privacidad (LFPDPPP), política de contenido, condiciones de publicación, política de cookies.

---

## 3. Funciones excluidas de la Fase 1

> Ninguna de estas funciones debe desarrollarse ni diseñarse en la Fase 1. Pueden evaluarse en fases posteriores.

| Función | Razón de exclusión |
|---|---|
| Pagos, comisiones, carrito, pedidos | La plataforma no intermedia transacciones |
| Facturación (CFDI) | Sin operaciones económicas internas |
| Mensajería interna / chat entre usuarios | El contacto se produce fuera de la plataforma |
| Valoraciones / reseñas | Requiere masa crítica de usuarios |
| Comparador de productos | Complejidad sin retorno en esta fase |
| Favoritos / listas guardadas | Diferir hasta medir engagement |
| Seguimiento de operaciones | No hay operaciones que seguir |
| Gestión logística / garantías | Fuera del modelo de negocio |
| Solicitudes de presupuesto | Fase 2 candidata |
| Notificaciones push / email transaccional | Solo lo imprescindible (confirmación de registro) |
| Planes de pago / suscripciones | Monetización posterior |
| Estadísticas avanzadas para empresas | Fase 2 candidata |

---

## 4. Tipos de usuario

| Rol | Descripción | Acceso |
|---|---|---|
| **Visitante** | Cualquier persona que llega por buscador o enlace directo. Navega catálogo, directorio y contenido. | Todo lo público. Sin registro. |
| **Empresa** | Fabricante, distribuidor, recuperador o prestador de servicios del sector plástico en México. Se registra con datos de empresa. | Crear perfil, publicar hasta 5 anuncios, gestionar fotos, editar datos de contacto. |
| **AGAMA** | Empresa fundadora e impulsora. Tiene perfil verificado, espacios promocionales y visibilidad prioritaria. | Todo lo de Empresa + posición destacada en directorio y home. |
| **Admin** | Equipo AGAMA que opera la plataforma. | Cola de moderación, gestión de usuarios, publicación de contenido editorial, configuración. |

No hay distinción comprador/vendedor: cualquier empresa publica y cualquier visitante descubre. El contacto ocurre fuera de la plataforma.

---

## 5. Flujo de publicación

1. **Registro.** La empresa crea cuenta (email + contraseña o magic link) y completa su perfil: nombre, logo, descripción, ubicación, categorías, web, teléfono, email de contacto, WhatsApp.

2. **Crear anuncio.** Desde el panel: título, descripción, categoría, ubicación, hasta 5 fotos (comprimidas en cliente antes de subir), datos de contacto (heredados del perfil, editables por anuncio), enlace externo opcional.

3. **Moderación automática.** El anuncio pasa al estado `pending_review` y entra en el pipeline de IA (ver sección 6).

4. **Resultado:**
   - **4a. Aprobado → `published`.** El anuncio es visible en catálogo, directorio y buscador. Indexable por Google.
   - **4b. Rechazado → `rejected`.** El vendedor ve el motivo en su panel y puede corregir y reenviar.
   - **4c. Dudoso → cola humana.** Un admin revisa y aprueba o rechaza manualmente.

5. **Edición.** Al editar un anuncio publicado, vuelve a `pending_review` y repite la moderación.

6. **Retirada.** La empresa puede pausar o eliminar sus anuncios en cualquier momento.

---

## 6. Flujo de moderación automática

Tres capas secuenciales; si una capa rechaza, las siguientes no se ejecutan.

### Capa 1 — Reglas duras (instantánea)

- Lista de términos prohibidos: pigmentos, masterbatch, aditivos, concentrados de color, estabilizantes UV, antioxidantes, retardantes de flama.
- Regex para datos de contacto en título/descripción (teléfono, email, URL, WhatsApp) — en anuncios B2B estos datos van en los campos específicos del perfil, no incrustados en el texto del anuncio.
- Validación de campos obligatorios y longitudes mínimas.
- Resultado: `REJECT` inmediato si hay match, con motivo específico.

### Capa 2 — Clasificación de texto (Claude Haiku)

- Análisis semántico de título + descripción + categoría.
- Detecta: fuera de tema, spam, contenido vacío/incoherente, keyword stuffing, afirmaciones sospechosas, lenguaje inapropiado.
- Puede sugerir: categoría más adecuada, etiquetas automáticas, correcciones ortográficas.
- Resultado: `APPROVE`, `REJECT` con motivo, o `REVIEW` si confianza < 0.8.

### Capa 3 — Análisis de imágenes (Claude Haiku visión)

- Solo se ejecuta si el texto pasó las capas anteriores.
- Detecta: imágenes sin relación con plásticos, texto superpuesto con datos de contacto, contenido inapropiado, imágenes genéricas/stock sin relación.
- Resultado: `APPROVE`, `REJECT`, o `REVIEW`.

### Veredicto combinado

| Veredicto | Acción | Visible para la empresa |
|---|---|---|
| APPROVE | Estado → `published` | Anuncio publicado |
| REJECT | Estado → `rejected` | Motivo de rechazo + opción de corregir |
| REVIEW | Estado → `pending_review`, cola de admin | "En revisión" — sin motivo hasta que un admin decida |

### Alcance y limitaciones de la moderación

La revisión automática no es una validación técnica, legal ni comercial. Solo modera formato y cumplimiento de las normas de la plataforma. Los términos de uso deben reflejar explícitamente que:

- Cada empresa es responsable de sus publicaciones.
- TodoPlástico no garantiza exactitud de la información.
- TodoPlástico no interviene en la compraventa.
- AGAMA impulsa la plataforma pero no asume responsabilidad sobre anuncios de terceros.

---

## 7. Estructura de datos

Prefijo `mkt_` en todas las tablas. RLS activada desde el primer día. Constraints de límites (5 anuncios activos, 5 fotos) en BD, no solo en UI.

### mkt_companies

- id, user_id (auth)
- name, slug, logo_url
- description, location
- website, phone, email, whatsapp
- categories[]
- is_verified, is_featured
- status (active/blocked)
- created_at, updated_at

### mkt_listings

- id, company_id
- title, slug, description
- type (product/service/ad)
- category, tags[]
- location
- contact_override (opt.)
- external_url
- status (draft/pending_review/published/rejected/paused)
- rejection_reason
- created_at, updated_at

### mkt_listing_photos

- id, listing_id
- storage_path, position
- alt_text
- CHECK(position ≤ 5)

### mkt_moderation_events

- id, listing_id
- source (rules/ai_text/ai_vision/human)
- verdict, confidence
- violations[], reason_es
- category_detected
- model, reviewer_id
- created_at

### mkt_categories

- id, slug, name
- parent_id (opt.)
- icon, description
- position

### mkt_articles

- id, slug, title
- excerpt, body (markdown/html)
- category, tags[]
- cover_image_url
- author_id, status
- published_at
- seo_title, seo_description

### mkt_search_queries

- id, query, results_count
- session_id (anónimo)
- created_at

### mkt_banners

- id, slot (home_hero, sidebar, etc.)
- image_url, link_url
- company_id (nullable)
- active, position
- starts_at, ends_at

### Cambios respecto al esquema actual

- `mkt_profiles` → renombrar a `mkt_companies` y añadir campos de contacto público (website, phone, email, whatsapp).
- `mkt_products` → renombrar a `mkt_listings` y añadir campo `type` (product/service/ad) y `external_url`.
- Nuevo: `mkt_articles` para el portal de contenido editorial.
- Nuevo: `mkt_banners` para espacios promocionales de AGAMA.
- Eliminar: `mkt_conversations`, `mkt_messages` y triggers asociados (mensajería fuera de Fase 1).
- Mantener: `mkt_moderation_events`, `mkt_search_queries`, `mkt_categories` (ya existen).

---

## 8. Arquitectura recomendada

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | Next.js 15 (App Router, TypeScript) | SSR/SSG para SEO. Ya en uso. |
| Estilos | Tailwind CSS 4 | Ya en uso. |
| BD + Auth + Storage | Supabase | Proyecto propio antes de producción. RLS estricta. |
| Moderación IA | Claude Haiku (API route Next.js) | Texto + visión. Clave solo en servidor. |
| Email | Resend | Solo confirmación de registro en F1. |
| Hosting | Vercel | Deploy por PR, previews. Dominio: todo-plastico.com. |
| Contenido editorial | Markdown/MDX en repo o tabla mkt_articles | Decisión abierta: archivos vs. BD + CMS admin. |
| Imágenes | Supabase Storage + compresión en cliente | Bucket mkt-photos. |
| SEO | SSR, sitemap dinámico, Schema.org, canonical | Ya parcialmente implementado. |
| Analítica | Plausible o GA4 | Decidir antes de producción. |
| Testing | Playwright | Suite smoke existente. Ampliar. |
| CI | GitHub Actions | lint + typecheck + Playwright en cada PR. |

### Decisión abierta: contenido editorial

Dos opciones viables:

- **Opción A — Markdown en repo:** archivos MDX en `/content`. Ventaja: rápido, sin UI de admin. Desventaja: publicar requiere PR y deploy.
- **Opción B — Tabla en BD + panel admin:** `mkt_articles` con editor en el panel de administración. Ventaja: cualquiera del equipo publica sin tocar código. Desventaja: más desarrollo.

Recomendación: empezar con Opción A (MDX) para lanzar rápido y migrar a Opción B cuando el volumen editorial lo justifique. La tabla `mkt_articles` queda definida en el esquema para facilitar la migración.

---

## 9. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| BD compartida con studio-panel | Alto — datos cruzados, límites de plan free, no apto para producción | Migrar a proyecto Supabase propio **antes** de lanzamiento público |
| SMTP no configurado | Alto — nadie puede registrarse | Configurar Resend en Supabase Auth antes de invitar proveedores |
| ANTHROPIC_API_KEY ausente en Vercel | Medio — moderación IA inactiva (solo regex) | Añadir variable de entorno en Vercel |
| Contenido insuficiente al lanzar | Medio — la plataforma parece vacía, sin valor para visitantes | Carga inicial: perfil AGAMA + 10–20 anuncios reales + 5–10 artículos editoriales antes de abrir |
| Moderación IA con falsos positivos altos | Medio — empresas frustradas por rechazos incorrectos | Umbral conservador (enviar a cola humana en caso de duda), motivos claros, opción de corrección |
| Abuso de datos de contacto públicos (scraping) | Bajo-medio — empresas reciben spam externo | Rate limiting, honeypot fields, monitoreo de patrones de acceso |
| Pigmentos/masterbatch/aditivos burlando moderación | Medio — conflicto con negocio de AGAMA | Tres capas de moderación + escaneo periódico del catálogo publicado |
| Dominio sin configurar | Medio — SEO en vercel.app pierde valor para la marca | Configurar todo-plastico.com en Vercel y Supabase antes de activar indexación |

---

## 10. Dependencias

### Bloqueantes (antes de producción)

- **Proyecto Supabase propio** — migrar tablas `mkt_*` y bucket `mkt-photos` fuera de studio-panel.
- **Dominio todo-plastico.com** — registrar/transferir, configurar DNS en Vercel.
- **SMTP en Supabase** — Resend para emails de autenticación.
- **ANTHROPIC_API_KEY en Vercel** — para moderación IA completa.
- **Textos legales revisados** — términos, privacidad, política de contenido adaptados al nuevo modelo (sin intermediación).

### No bloqueantes (pueden ir en paralelo)

- Proveedor de analítica (Plausible vs. GA4).
- Contenido editorial inicial (puede prepararse en paralelo con desarrollo).
- CI en GitHub Actions (deseable, no bloqueante para lanzar).
- Compresión de imágenes en cliente (browser-image-compression).

---

## 11. Fases de desarrollo

La Fase 1 se subdivide en sprints para entregar incrementalmente.

**Sprint 0 — Reestructuración (2–3 días)**
Actualizar docs (vision, roadmap, CLAUDE.md). Renombrar tablas (profiles→companies, products→listings). Eliminar esquema de mensajería. Crear tabla articles y banners. Adaptar RLS. Actualizar types.

**Sprint 1 — Directorio y perfiles (1 semana)**
Perfil público de empresa con datos de contacto. Directorio con listado y filtros. Búsqueda de empresas. Perfil de AGAMA como empresa fundadora. Adaptar home.

**Sprint 2 — Anuncios / listings (1 semana)**
Adaptar CRUD de productos a listings (product/service/ad). Edición de anuncios existentes. Compresión de imágenes. Fichas públicas con enlace externo y datos de contacto. Re-moderación al editar.

**Sprint 3 — Contenido y SEO (1 semana)**
Portal de artículos (MDX). Categorías de contenido. Páginas de categoría SEO. Schema.org actualizado. Sitemap dinámico ampliado. Espacios promocionales AGAMA (banners).

**Sprint 4 — Admin y moderación (3–4 días)**
Panel de administración: cola de moderación, gestión de usuarios, publicación de contenido. Aprobar/rechazar desde admin. Métricas básicas de moderación.

**Sprint 5 — Pulido y lanzamiento (1 semana)**
Textos legales actualizados. Analítica. Carga inicial de datos (perfil AGAMA, anuncios semilla, artículos). Configurar dominio. Migrar BD a proyecto propio. Smoke tests actualizados. Deploy a producción.

**Estimación total: 5–6 semanas** desde validación del alcance. Gran parte del código existente (auth, moderación IA, catálogo, SEO) se reutiliza con adaptaciones.

---

## 12. Criterios de aceptación

La Fase 1 se considera completa cuando se cumplen todos estos criterios.

### Funcionales

- Una empresa puede registrarse, crear su perfil y publicar un anuncio sin intervención manual.
- Un visitante encuentra una empresa o anuncio mediante el buscador y accede a sus datos de contacto.
- Los anuncios pasan por moderación automática y solo se publican si son aprobados.
- Los productos prohibidos (pigmentos, masterbatch, aditivos) son rechazados automáticamente con motivo claro.
- Un admin puede revisar y resolver casos dudosos desde el panel.
- El contenido editorial se muestra, se categoriza y es indexable.
- AGAMA aparece como empresa fundadora con visibilidad destacada.
- Los límites (5 anuncios activos, 5 fotos) se aplican en BD.

### Técnicos

- Proyecto Supabase propio con RLS en todas las tablas.
- Dominio todo-plastico.com configurado y funcionando.
- SMTP operativo (registro por email funciona).
- Moderación IA activa (ANTHROPIC_API_KEY configurada).
- SSR correcto: metas, Schema.org, sitemap, robots en todas las páginas públicas.
- Diseño responsive funcional en mobile, tablet y desktop.
- Playwright smoke suite en verde.
- Sin secretos en el repositorio (gitleaks en pre-commit).

### De negocio

- Al menos 10 anuncios reales publicados antes de abrir al público.
- Al menos 5 artículos de contenido editorial publicados.
- Textos legales revisados y publicados.
- Analítica instalada y capturando datos.
- Google Search Console configurado y primeras páginas indexadas.

### Preparación para Fase 2

La arquitectura debe permitir añadir sin rehacer la base:

- Mensajería interna (tablas eliminadas, pero el modelo de datos lo soporta).
- Solicitudes de presupuesto (nueva tabla, nuevo estado en listings).
- Favoritos (tabla user_id + listing_id).
- Valoraciones (tabla con rating + review por empresa).
- Planes destacados / premium (campo `plan` en companies).
- Estadísticas para empresas (views, clicks en datos de contacto — trackear desde F1 si es barato).
