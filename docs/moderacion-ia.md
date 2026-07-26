# Watcher IA — Especificación de moderación

## Principio

Nada se publica sin pasar por el watcher. La IA decide en los casos claros; los dudosos van a cola humana. El vendedor siempre ve el motivo del rechazo y puede corregir o apelar.

## Política de contenido

**Permitido:** productos de plástico (nuevos, usados, reciclados), materia prima plástica (resina, molido, paca), maquinaria y refacciones del sector, y servicios de transformación (inyección, soplado, maquila).

**Prohibido:**
1. **Competencia directa de AGAMA:** pigmentos, masterbatch, concentrados de color, aditivos (UV, antioxidantes, retardantes de flama, deslizantes, etc.) ofrecidos como producto o servicio.
2. **Fuera de tema:** cualquier producto/servicio no relacionado con el plástico.
3. **Ilegal o peligroso:** falsificaciones, residuos peligrosos sin permisos, armas, etc.
4. **Evasión de plataforma:** teléfonos/emails/WhatsApp en título, descripción o imágenes de la ficha (el contacto va por mensajería interna).
5. **Spam / engaño:** fichas duplicadas, precios señuelo, keyword stuffing.

## Pipeline

```
Producto creado/editado
  → status: pending_review
  → Edge Function "moderate-product"
      1. Clasificador de texto (Claude Haiku): título + descripción + categoría
      2. Clasificador de imágenes (Claude, visión): las 5 fotos en una llamada
      3. Reglas duras (regex): teléfonos, emails, URLs, lista de términos prohibidos
  → Veredicto combinado:
      APPROVE  (confianza alta, todo permitido)  → published
      REJECT   (violación clara, p. ej. "masterbatch" en el título) → rejected + motivo
      REVIEW   (dudoso, confianza baja, apelación) → cola humana en panel admin
```

- Mismo pipeline en **modo ligero** (solo texto, síncrono) para mensajes de chat; si un mensaje es REJECT no se entrega y se notifica al emisor.
- **Re-escaneo** obligatorio en cada edición de ficha.
- **Escaneo aleatorio periódico** del catálogo publicado (cron semanal) por si cambia la política.

## Salida estructurada del clasificador

```json
{
  "verdict": "approve | reject | review",
  "category_detected": "envases | bolsas | ... | fuera_de_tema",
  "violations": ["competencia_pigmentos", "datos_contacto", ...],
  "confidence": 0.0-1.0,
  "reason_es": "Explicación breve mostrada al vendedor"
}
```

Umbral inicial: `confidence < 0.8` → REVIEW. Ajustar con datos reales.

## Modelo y coste

- Texto: Claude Haiku (barato, rápido, suficiente para clasificación).
- Imágenes: Claude Haiku con visión; solo si el texto pasó (ahorra llamadas).
- Presupuesto estimado MVP: centavos por producto; irrelevante frente al valor.

## Registro y métricas

Cada decisión se guarda en `moderation_events` (input hash, veredicto, violaciones, confianza, modelo, revisor humano si lo hubo). Métricas: tasa de rechazo, tiempo en cola humana, falsos positivos reportados vía apelación.

## Apelación

Botón "solicitar revisión" en fichas rechazadas → cola humana. Máx. 1 apelación por versión de ficha.
