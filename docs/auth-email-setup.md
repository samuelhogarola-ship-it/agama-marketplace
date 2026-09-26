# Correos de acceso de TodoPlásticos en español

Estado (26 de septiembre de 2026): plantillas preparadas en el repositorio. Guardarlas aquí o fusionar la PR NO cambia las plantillas del proyecto alojado. Activación pendiente de sesión autenticada en Supabase, remitente verificado y prueba real del correo recibido.

Proyecto: `tiynnllrcdhsvrzsdsct`. Dominio web vigente: `https://todo-plastico.com`. `todoplasticos.com` es otro dominio: confirmar propiedad y acceso DNS antes de configurarlo. No cambiar la URL pública del sitio para personalizar un correo.

## Aplicación
1. Abrir Authentication > Emails > Templates en el proyecto correcto. Guardar una copia privada de las plantillas actuales antes de sustituirlas.
2. Copiar el asunto de `supabase/email-templates/subjects.json` y el HTML correspondiente: confirmation (Confirm sign up), magic-link (Magic link), recovery (Reset password), invite (Invite user), email-change (Change email address), reauthentication.
3. Comprobar Authentication > URL Configuration: Site URL debe ser el origen HTTPS definitivo, sin slash final. Los botones usan esa URL y el callback existente con `token_hash`; recuperación dirige a `/panel/ajustes`. El acceso por correo dirige al panel.
4. Configurar SMTP personalizado. Para Resend: host `smtp.resend.com`, puerto `465`, usuario `resend`, contraseña = clave del proveedor. Introducirla solo en Supabase, nunca en el repositorio.
5. Remitente propuesto si se confirma el dominio actual: `TodoPlásticos <acceso@todo-plastico.com>`. Verificar ese dominio en Resend con los registros DNS exactos que proporcione el panel. Mantener los registros MX de buzones existentes; no sustituirlos a ciegas. Revisar SPF, DKIM y alineación DMARC del correo recibido.
6. Desactivar seguimiento de enlaces en el proveedor para los correos de autenticación. Confirmar guardado con una nueva lectura de SMTP y plantillas.
7. Enviar prueba a la cuenta autorizada: revisar asunto y cuerpo españoles, dominio From, autenticación del mensaje y enlace de un solo uso. Probar inicio de sesión y recuperación en otro navegador. No cambiar la contraseña del usuario como prueba automática.

Las notificaciones de seguridad opcionales deben revisarse según cuáles estén activadas; este paquete cubre los seis mensajes de autenticación, no activa ni desactiva notificaciones.

## Coste consultado el 26/09/2026 (USD, sin impuestos)
- Supabase Free permite SMTP propio y plantillas personalizadas. No hace falta Pro para traducir y usar remitente del dominio.
- Resend Free: 3.000 correos/mes, máximo 100/día; revisar también límites de envío configurados en Supabase. Resend Pro empieza en 20 USD/mes por 50.000 correos, sin el límite diario del plan gratuito.
- Cambiar el dominio técnico de la API de Supabase a un subdominio propio es distinto: requiere plan de pago (Pro desde 25 USD/mes) y complemento Custom Domain de 10 USD/mes, además de posibles consumos. No es necesario para que el remitente y el botón de acceso usen el dominio de la web.
- El dominio debe estar comprado y bajo control del cliente. La compra/renovación se factura aparte por el registrador; no se ha cotizado ni contratado un dominio nuevo.
- No se ha contratado ningún plan ni activado cargos.

Fuentes oficiales:
- https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/platform/custom-domains
- https://supabase.com/pricing
- https://resend.com/pricing
- https://resend.com/pricing.md
