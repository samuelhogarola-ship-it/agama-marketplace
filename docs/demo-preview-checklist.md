# Checklist de cierre del demo preview

## Estado actual

- [x] Portada premium con hero, carrusel y CTA.
- [x] Navegación de categorías congelada con seis categorías aprobadas.
- [x] Panel lateral de categorías en escritorio.
- [x] Sugerencias y filtros por categoría.
- [x] Listado público con tres fotografías demo de AGAMA.
- [x] Logo de empresa en la ficha pública y fallback de iniciales.
- [x] Anuncios destacados en portada.
- [x] Contacto externo por email, teléfono, WhatsApp y web propia.
- [x] Formulario de anuncio con precio, unidad, compra mínima, ubicación y fotos.
- [x] Límites de cinco anuncios y cinco fotografías en base de datos.
- [x] Bloqueo de pigmentos, masterbatch y aditivos.
- [x] Enlaces externos limitados al dominio propio de la empresa anunciante.
- [x] Panel de usuario y panel operativo de Fuengirola.
- [x] Cola de revisión con aprobación y rechazo humano.
- [x] Motivo obligatorio al rechazar un anuncio.
- [x] Decisiones humanas registradas en `mkt_moderation_events`.
- [x] Permisos admin basados en emails configurados o `app_metadata.role`, nunca en `user_metadata`.
- [x] Magic link y sesión persistente en el navegador.

## Antes de darlo por finalizado

### Configuración y despliegue

- [ ] Configurar el dominio final `todo-plastico.com` en Vercel/hosting.
- [ ] Configurar `NEXT_PUBLIC_SITE_URL` con el dominio final.
- [ ] Configurar SMTP de Supabase Auth con Resend y probar entrega real.
- [ ] Configurar `TODO_PLASTICO_ADMIN_EMAILS` con los emails reales del equipo.
- [ ] Mantener `SUPABASE_SERVICE_ROLE_KEY` solo en servidor y nunca en cliente.
- [ ] Decidir si la moderación IA se activa con `ANTHROPIC_API_KEY` en producción.
- [ ] Ejecutar migraciones en el proyecto Supabase definitivo y verificar RLS.
- [ ] Configurar backups y revisar límites de almacenamiento.

### Cuentas y permisos

- [ ] Crear y probar una cuenta empresa normal mediante magic link.
- [ ] Crear y probar una cuenta admin real.
- [ ] Confirmar que una cuenta normal no puede abrir ni llamar al panel admin.
- [ ] Confirmar que una empresa solo puede editar sus propios datos y anuncios.
- [ ] Probar cierre de sesión, enlace caducado y reenvío de magic link.

### Anuncios y moderación

- [ ] Crear un anuncio permitido y comprobar que llega a `pending_review`.
- [ ] Aprobarlo desde el panel y comprobar que aparece públicamente.
- [ ] Rechazarlo con motivo y comprobar que el motivo queda guardado.
- [ ] Probar bloqueo de pigmentos, masterbatch y aditivos.
- [ ] Probar bloqueo de teléfono, email y WhatsApp dentro del texto.
- [ ] Probar validación de precio, unidad, compra mínima y ubicación.
- [ ] Probar límite de cinco anuncios y cinco fotos.
- [ ] Probar edición de un anuncio publicado y su retorno a revisión.
- [ ] Probar que un enlace externo de otra web se rechaza.

### Contenido y experiencia

- [ ] Revisar las seis categorías aprobadas con el equipo AGAMA.
- [ ] Revisar textos legales, comunidad, privacidad, cookies y términos.
- [ ] Revisar textos de sanciones, avisos premium y pérdida del servicio.
- [ ] Añadir logo real de cada empresa cuando se incorporen.
- [ ] Confirmar que las imágenes de portada y categorías son reales, claras y coherentes.
- [ ] Revisar SEO, sitemap, canonical y `noindex` del entorno preview.

### Responsive y calidad

- [ ] Verificar móvil de 390 px: portada, filtros, formularios y ficha.
- [ ] Verificar tablet de 768 px.
- [ ] Verificar escritorio de 1440 px.
- [ ] Revisar que no haya texto cortado, botones solapados ni imágenes tapadas.
- [ ] Revisar carga sin imágenes, errores de red y estados vacíos.
- [ ] Ejecutar `npm run typecheck`, `npm run lint` y `npm run build`.
- [ ] Hacer un smoke test de rutas públicas, auth, panel y APIs admin.
- [ ] Revisar accesibilidad básica: foco, labels, contraste, teclado y alt text.

## No es alcance del primer lanzamiento

- [ ] Mensajería interna entre comprador y vendedor.
- [ ] Checkout, pagos y logística.
- [ ] CMS editorial completo.
- [ ] Sistema de anuncios premium automatizado.
- [ ] Analítica comercial avanzada.
