# Resend + magic link

TodoPlástico queda preparado para acceso sin contraseña. La app usa Supabase Auth con sesión persistente en cookies y confirma los enlaces en el servidor mediante `token_hash`.

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
  - Sender: `TodoPlástico <acceso@todo-plastico.com>`
  - Host: `smtp.resend.com`
  - Port: `465`
  - Username: `resend`
  - Password: API key de Resend

### Plantilla Magic Link

En Authentication > Emails > Templates > Magic Link, el botón debe usar el hash directamente y no `{{ .ConfirmationURL }}`:

```html
<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">
  Ingresar en TodoPlástico
</a>
```

La aplicación siempre envía un `emailRedirectTo` que ya contiene `?next=...`, por eso la plantilla añade los parámetros con `&`. El callback `/auth/callback` valida el hash mediante `verifyOtp` y guarda la sesión en cookies.

No usar `{{ .ConfirmationURL }}` para este flujo SSR: genera un `code` PKCE que depende del verificador almacenado en el navegador donde se solicitó el correo y falla con `pkce_code_verifier_not_found` si el enlace se abre en otro contexto.

### Plantilla de recuperación

La plantilla Reset Password debe seguir el mismo patrón, usando el tipo `recovery`:

```html
<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery">
  Cambiar mi contraseña
</a>
```

El formulario envía como destino `/auth/callback?next=/panel/ajustes`, donde el usuario puede establecer la contraseña nueva después de que el callback valide el hash.

En Resend, desactivar el seguimiento de enlaces para los correos de autenticación. Los enlaces reescritos o prefetched pueden consumir tokens de un solo uso.

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

El usuario admin entra desde `/ingresar` con magic link. No se usa contraseña en la interfaz.
