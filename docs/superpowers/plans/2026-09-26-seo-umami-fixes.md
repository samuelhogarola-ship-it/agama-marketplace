# Fixes técnicos SEO y Umami

Alcance autorizado: corregir defectos de la auditoría, PR independientes desde main, pruebas y revisión antes del merge. Sin cambios de dominio, correo ni migraciones de Supabase.

1. SEO: canonical de paginación, variantes filtradas noindex/follow, números de página seguros, título del directorio, datos estructurados fieles y sitemap completo sin fechas inventadas. Regresiones unitarias y Playwright; actualizar docs/seo.md.
2. Umami: contactos limitados a páginas propias, comparación anterior real, validación de días y errores sin ceros ficticios. Pruebas con dos empresas y fallo del proveedor.
3. Verificar unitarias, TypeScript, ESLint, build, Playwright y Husky; revisión independiente y CI antes de fusionar cada PR.
4. Comprobar publicación por respuestas de producción. Registrar entrega en WF-Studio; si sigue pidiendo login, conservar informe y comunicar el bloqueo.

## Registro
- Base origin/main f0d57b8; 55 pruebas unitarias correctas.
- PR #30 cerrada por superada: marca fusionada previamente; dominio y correo no confirmados excluidos.
- Trabajo en checkout dedicado todoplasticos-edit, rama codex/seo-technical-fixes.
