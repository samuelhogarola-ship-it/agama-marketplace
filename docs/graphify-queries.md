# Graphify Queries — Flujos Clave TodoPlástico

Usa estas queries cuando necesites reconstruir un flujo, debuggear, o entender qué archivos toca un cambio.
Ejecutar con: `/graphify query "<pregunta>"`

---

## Autenticación
```
/graphify query "flujo completo de login con magic link desde formulario hasta sesión activa"
/graphify query "cómo se propaga la sesión del usuario entre middleware y páginas protegidas"
/graphify query "qué pasa cuando el token de magic link expira o es inválido"
```

## Publicación de anuncios
```
/graphify query "flujo completo para publicar un anuncio desde el formulario hasta la BD"
/graphify query "cómo se suben y validan las fotos de un anuncio"
/graphify query "qué validaciones se aplican al crear o editar un anuncio"
/graphify query "cómo funciona el límite de 5 anuncios activos por empresa"
```

## Moderación IA
```
/graphify query "pipeline de moderación de anuncios de pending_review hasta aprobado o rechazado"
/graphify query "cómo se llama a Claude Haiku para clasificar texto e imágenes"
/graphify query "qué contenido está prohibido y dónde se aplica esa regla"
```

## Catálogo y navegación
```
/graphify query "cómo se resuelve una URL de categoría hasta mostrar los anuncios"
/graphify query "cómo funcionan los filtros de categoría y subcategoría"
/graphify query "flujo de búsqueda y listado de anuncios públicos"
```

## Admin
```
/graphify query "qué puede hacer un admin que no puede un usuario normal"
/graphify query "cómo se verifica que un usuario tiene rol admin"
/graphify query "flujo de aprobación o rechazo de un anuncio desde el panel admin"
```

## SEO y metadata
```
/graphify query "cómo se genera el metadata y JSON-LD para páginas de anuncio"
/graphify query "qué archivos tocan el SEO y cómo están conectados"
/graphify query "cómo funciona safeJsonLd y dónde se usa"
```

## Base de datos y Supabase
```
/graphify query "cómo se conecta el cliente Supabase en server vs client components"
/graphify query "qué tablas mkt_ existen y cómo se relacionan"
/graphify query "dónde se aplica RLS y cómo se bypassea en el admin"
```

## Bugs frecuentes
```
/graphify query "qué archivos tocan createClient y pueden causar errores de autenticación"
/graphify query "qué componentes dependen de CATEGORIES y se rompen si cambia esa constante"
/graphify query "flujo de error cuando un anuncio no pasa moderación"
```

---

**Tip:** Si el grafo está desactualizado tras cambios grandes, corre:
```
/graphify --update
```
