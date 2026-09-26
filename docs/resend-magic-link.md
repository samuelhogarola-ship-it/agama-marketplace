# Resend + magic link

TodoPlásticos queda preparado para acceso sin contraseña. La app usa Supabase Auth con sesión persistente en cookies y confirma los enlaces en el servidor mediante `token_hash`.

## Supabase Auth

En el proyecto Supabase `tiynnllrcdhsvrzsdsct`, configurar:

- Authentication > URL Configuration:
  - Site URL: `https://todo-plastico.com`
  - Redirect URL local: `http://localhost:3000/auth/callback`
  - Redirect URL producción: `https://todo-plastico.com/auth/callback`
- Authentication > Providers > Email:
  - Enable Email provider
  - Confirm email: activado
  - Secure email change: activado
- Authentication > SMTP Settings:
  - Sender: `TodoPlásticos <acceso@todo-plastico.com>`
  - Host: `smtp.resend.com`
  - Port: `465`
  - Username: `resend`
  - Password: API key de Resend

### Plantillas en español

Los HTML versionados y los asuntos están en `supabase/email-templates/`. La guía vigente de activación y costes es [auth-email-setup.md](auth-email-setup.md). Un merge no activa automáticamente las plantillas en el proyecto alojado.

Los botones usan `{{ .SiteURL }}/auth/confirm` y `{{ .TokenHash }}` para verificar en servidor sin depender del verificador PKCE de otro navegador. Site URL debe coincidir con el dominio HTTPS de producción y no terminar en slash. Los enlaces de acceso llevan al panel; recuperación e invitación llevan a los ajustes de cuenta. Mantener desactivado el seguimiento de enlaces del proveedor.

## Variables locales

La app no necesita la clave de Resend si Supabase manda los correos. Mantener en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tiynnllrcdhsvrzsdsct.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
TODO_PLASTICO_ADMIN_EMAILS=admin@example.com
TODO_PLASTICO_SEED_ADMIN_EMAIL=admin@example.com
```

Para sembrar categorías y la empresa AGAMA:

```bash
node scripts/seed-launch-data.mjs
```

Desde `/ingresar` se admite contraseña o enlace de acceso por correo.

## Aperturas automáticas del correo
Los enlaces nuevos abren `/auth/confirm`: GET muestra un botón y no consume el token. Solo el POST del botón verifica el código y crea la sesión. Esta respuesta no incluye analítica ni recursos externos y usa no-store, noindex y no-referrer. El callback anterior se conserva para enlaces antiguos y PKCE. Publicar esta ruta antes de activar las plantillas.
